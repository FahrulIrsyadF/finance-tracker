"use server";

import { db } from "@/lib/db";
import { budgets, categories, transactions } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and, gte, lte } from "drizzle-orm";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export interface BudgetFormData {
  categoryId: string;
  amount: number;
  period: "daily" | "weekly" | "monthly";
}

export async function getBudgets() {
  const result = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      amount: budgets.amount,
      period: budgets.period,
      isActive: budgets.isActive,
      createdAt: budgets.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id));

  const now = new Date();
  
  const budgetsWithProgress = await Promise.all(
    result.map(async (budget) => {
      let startDate: Date;
      let endDate: Date;

      if (budget.period === "daily") {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
      } else if (budget.period === "weekly") {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      const txs = await db
        .select({ amount: transactions.amount })
        .from(transactions)
        .where(
          and(
            eq(transactions.categoryId, budget.categoryId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate),
            eq(transactions.type, "expense")
          )
        );

      const spent = txs.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        ...budget,
        spent,
        remaining: Math.max(0, budget.amount - spent),
        percentage: Math.min(100, (spent / budget.amount) * 100),
      };
    })
  );

  return budgetsWithProgress;
}

export async function upsertBudget(data: BudgetFormData) {
  const existing = await db
    .select()
    .from(budgets)
    .where(eq(budgets.categoryId, data.categoryId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(budgets)
      .set({
        amount: data.amount,
        period: data.period,
      })
      .where(eq(budgets.categoryId, data.categoryId));
  } else {
    await db.insert(budgets).values({
      id: randomUUID(),
      categoryId: data.categoryId,
      amount: data.amount,
      period: data.period,
      createdAt: new Date(),
    });
  }
  revalidatePath("/budgets");
  revalidatePath("/categories");
}

export async function deleteBudget(id: string) {
  await db.delete(budgets).where(eq(budgets.id, id));
  revalidatePath("/budgets");
  revalidatePath("/categories");
}

export async function toggleBudgetStatus(id: string, isActive: boolean) {
  await db.update(budgets).set({ isActive }).where(eq(budgets.id, id));
  revalidatePath("/budgets");
  revalidatePath("/categories");
}

export async function checkBudgetExceeded(categoryId: string, newAmount: number, date: Date) {
  const budget = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.categoryId, categoryId), eq(budgets.isActive, true)))
    .limit(1);

  if (budget.length === 0) return { exceeded: false };

  const b = budget[0];
  let startDate: Date;
  let endDate: Date;

  if (b.period === "daily") {
    startDate = startOfDay(date);
    endDate = endOfDay(date);
  } else if (b.period === "weekly") {
    startDate = startOfWeek(date, { weekStartsOn: 1 });
    endDate = endOfWeek(date, { weekStartsOn: 1 });
  } else {
    startDate = startOfMonth(date);
    endDate = endOfMonth(date);
  }

  const txs = await db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.categoryId, categoryId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        eq(transactions.type, "expense")
      )
    );

  const currentSpent = txs.reduce((sum, tx) => sum + tx.amount, 0);
  const totalAfterNewTransaction = currentSpent + newAmount;

  if (totalAfterNewTransaction > b.amount) {
    const periodName = b.period === 'daily' ? 'harian' : b.period === 'weekly' ? 'mingguan' : 'bulanan';
    return {
      exceeded: true,
      message: `Peringatan: Anggaran ${periodName} terlampaui! (Sisa sebelumnya: Rp ${(b.amount - currentSpent).toLocaleString('id-ID')})`
    };
  }

  return { exceeded: false };
}
