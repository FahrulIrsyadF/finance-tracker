"use server";

import { db } from "@/lib/db";
import { transactions, categories, wallets } from "@/lib/db/schema";
import { and, gte, lte, eq } from "drizzle-orm";

export interface DateRange {
  from: Date;
  to: Date;
}

export type ChartDataPoint = {
  name: string;
  income: number;
  expense: number;
};

export type CategoryDataPoint = {
  id: string;
  name: string;
  value: number;
  color: string;
};

export interface InsightData {
  totalIncome: number;
  totalExpense: number;
  cashFlow: number;
  chartData: ChartDataPoint[]; // For bar chart
  expenseByCategory: CategoryDataPoint[]; // For donut chart
  incomeByCategory: CategoryDataPoint[]; // For donut chart
}

export async function getInsightData(range: DateRange, groupBy: "day" | "month"): Promise<InsightData> {
  // Fetch transactions in range
  const rawTxs = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      date: transactions.date,
      categoryId: transactions.categoryId,
      walletId: transactions.walletId,
    })
    .from(transactions)
    .where(and(
      gte(transactions.date, range.from),
      lte(transactions.date, range.to)
    ));

  // Fetch all categories for mapping
  const allCats = await db.select().from(categories);
  const catMap = Object.fromEntries(allCats.map(c => [c.id, c]));

  let totalIncome = 0;
  let totalExpense = 0;

  const chartMap: Record<string, { income: number; expense: number }> = {};
  const expenseCatMap: Record<string, number> = {};
  const incomeCatMap: Record<string, number> = {};

  for (const tx of rawTxs) {
    if (tx.type === "transfer") continue; // Exclude transfers from cash flow

    const dateObj = new Date(tx.date);
    let key = "";
    if (groupBy === "day") {
      key = dateObj.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
    } else {
      key = dateObj.toLocaleDateString("id-ID", { month: 'short', year: 'numeric' });
    }

    if (!chartMap[key]) {
      chartMap[key] = { income: 0, expense: 0 };
    }

    if (tx.type === "income") {
      totalIncome += tx.amount;
      chartMap[key].income += tx.amount;
      if (tx.categoryId) {
        incomeCatMap[tx.categoryId] = (incomeCatMap[tx.categoryId] || 0) + tx.amount;
      }
    } else if (tx.type === "expense") {
      totalExpense += tx.amount;
      chartMap[key].expense += tx.amount;
      if (tx.categoryId) {
        expenseCatMap[tx.categoryId] = (expenseCatMap[tx.categoryId] || 0) + tx.amount;
      }
    }
  }

  // Format chart data
  const chartData: ChartDataPoint[] = Object.entries(chartMap).map(([name, data]) => ({
    name,
    ...data,
  }));

  // Format category data
  const formatCatData = (map: Record<string, number>) => {
    return Object.entries(map)
      .map(([id, value]) => {
        const cat = catMap[id];
        return {
          id,
          name: cat?.name || "Lainnya",
          value,
          color: cat?.color || "#cbd5e1",
        };
      })
      .sort((a, b) => b.value - a.value);
  };

  return {
    totalIncome,
    totalExpense,
    cashFlow: totalIncome - totalExpense,
    chartData,
    expenseByCategory: formatCatData(expenseCatMap),
    incomeByCategory: formatCatData(incomeCatMap),
  };
}
