"use server";

import { db } from "@/lib/db";
import { transactions, categories, wallets } from "@/lib/db/schema";
import { and, gte, lte, eq, or } from "drizzle-orm";

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

export async function getInsightData(
  range: DateRange,
  groupBy: "day" | "month",
  walletId?: string
): Promise<InsightData> {
  // Fetch transactions in range
  const rawTxs = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      date: transactions.date,
      categoryId: transactions.categoryId,
      walletId: transactions.walletId,
      transferToWalletId: transactions.transferToWalletId,
    })
    .from(transactions)
    .where(and(
      gte(transactions.date, range.from),
      lte(transactions.date, range.to),
      ...(walletId ? [or(eq(transactions.walletId, walletId), eq(transactions.transferToWalletId, walletId))] : [])
    ));

  // Fetch all categories for mapping
  const allCats = await db.select().from(categories);
  const catMap = Object.fromEntries(allCats.map(c => [c.id, c]));

  let totalIncome = 0;
  let totalExpense = 0;

  const chartMap: Record<string, { name: string; income: number; expense: number; timestamp: number }> = {};
  const expenseCatMap: Record<string, number> = {};
  const incomeCatMap: Record<string, number> = {};

  for (const tx of rawTxs) {
    let computedType = tx.type;

    if (tx.type === "transfer") {
      if (!walletId) continue; // Exclude transfers from global cash flow
      
      if (tx.walletId === walletId) {
        computedType = "expense";
      } else if (tx.transferToWalletId === walletId) {
        computedType = "income";
      } else {
        continue;
      }
    }

    const dateObj = new Date(tx.date);
    let key = "";
    if (groupBy === "day") {
      key = dateObj.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
    } else {
      key = dateObj.toLocaleDateString("id-ID", { month: 'short', year: 'numeric' });
    }

    if (!chartMap[key]) {
      chartMap[key] = { name: key, income: 0, expense: 0, timestamp: dateObj.getTime() };
    }

    if (computedType === "income") {
      totalIncome += tx.amount;
      chartMap[key].income += tx.amount;
      if (tx.categoryId) {
        incomeCatMap[tx.categoryId] = (incomeCatMap[tx.categoryId] || 0) + tx.amount;
      }
    } else if (computedType === "expense") {
      totalExpense += tx.amount;
      chartMap[key].expense += tx.amount;
      if (tx.categoryId) {
        expenseCatMap[tx.categoryId] = (expenseCatMap[tx.categoryId] || 0) + tx.amount;
      }
    }
  }

  // Format chart data
  const chartData: ChartDataPoint[] = Object.values(chartMap)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ name, income, expense }) => ({
      name,
      income,
      expense,
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
