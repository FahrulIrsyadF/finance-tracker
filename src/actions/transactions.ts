"use server";

import { db } from "@/lib/db";
import { transactions, wallets } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, desc, and, gte, lte, sql, like } from "drizzle-orm";
import { checkBudgetExceeded } from "./budgets";

export type TransactionType = "income" | "expense" | "transfer";

export interface TransactionFormData {
  walletId: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  note?: string;
  date: Date;
  transferToWalletId?: string;
}

export interface TransactionFilters {
  walletId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
}

export async function getTransactions(filters?: TransactionFilters) {
  const conditions = [];

  if (filters?.walletId) conditions.push(eq(transactions.walletId, filters.walletId));
  if (filters?.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters?.type) conditions.push(eq(transactions.type, filters.type));
  if (filters?.startDate) conditions.push(gte(transactions.date, filters.startDate));
  if (filters?.endDate) conditions.push(lte(transactions.date, filters.endDate));

  return db
    .select()
    .from(transactions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date));
}

/**
 * Mencari transaksi berdasarkan note (full-text search across ALL dates).
 * Tidak terpengaruh filter waktu — gunakan untuk fitur pencarian.
 */
export async function searchTransactions(query: string) {
  if (!query.trim()) return [];
  return db
    .select()
    .from(transactions)
    .where(like(transactions.note, `%${query.trim()}%`))
    .orderBy(desc(transactions.date))
    .limit(50);
}

export async function createTransaction(data: TransactionFormData) {
  const now = new Date();
  const id = randomUUID();

  await db.insert(transactions).values({
    id,
    walletId: data.walletId,
    categoryId: data.categoryId,
    type: data.type,
    amount: data.amount,
    note: data.note ?? null,
    date: data.date,
    createdAt: now,
    transferToWalletId: data.transferToWalletId ?? null,
    source: "manual",
  });

  // Update wallet balance
  if (data.type === "income") {
    await db
      .update(wallets)
      .set({ currentBalance: sql`${wallets.currentBalance} + ${data.amount}` })
      .where(eq(wallets.id, data.walletId));
  } else if (data.type === "expense") {
    await db
      .update(wallets)
      .set({ currentBalance: sql`${wallets.currentBalance} - ${data.amount}` })
      .where(eq(wallets.id, data.walletId));
  } else if (data.type === "transfer" && data.transferToWalletId) {
    await db
      .update(wallets)
      .set({ currentBalance: sql`${wallets.currentBalance} - ${data.amount}` })
      .where(eq(wallets.id, data.walletId));
    await db
      .update(wallets)
      .set({ currentBalance: sql`${wallets.currentBalance} + ${data.amount}` })
      .where(eq(wallets.id, data.transferToWalletId));
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  revalidatePath("/insights");
  revalidatePath("/budgets"); // Important since budget progress changes

  if (data.type === "expense" && data.categoryId) {
    const budgetCheck = await checkBudgetExceeded(data.categoryId, data.amount, data.date);
    if (budgetCheck.exceeded) {
      return { success: true, overbudget: true, message: budgetCheck.message };
    }
  }

  return { success: true };
}

export async function deleteTransaction(id: string) {
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id));

  if (!tx) throw new Error("Transaksi tidak ditemukan");

  // Reverse wallet balance update
  if (tx.type === "income") {
    await db
      .update(wallets)
      .set({ currentBalance: sql`${wallets.currentBalance} - ${tx.amount}` })
      .where(eq(wallets.id, tx.walletId));
  } else if (tx.type === "expense") {
    await db
      .update(wallets)
      .set({ currentBalance: sql`${wallets.currentBalance} + ${tx.amount}` })
      .where(eq(wallets.id, tx.walletId));
  } else if (tx.type === "transfer" && tx.transferToWalletId) {
    await db
      .update(wallets)
      .set({ currentBalance: sql`${wallets.currentBalance} + ${tx.amount}` })
      .where(eq(wallets.id, tx.walletId));
    await db
      .update(wallets)
      .set({ currentBalance: sql`${wallets.currentBalance} - ${tx.amount}` })
      .where(eq(wallets.id, tx.transferToWalletId));
  }

  await db.delete(transactions).where(eq(transactions.id, id));
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  revalidatePath("/insights");
}

export async function updateTransaction(id: string, data: TransactionFormData) {
  // 1. Get original transaction to reverse its balance effect
  const [original] = await db.select().from(transactions).where(eq(transactions.id, id));
  if (!original) throw new Error("Transaksi tidak ditemukan");

  // 2. Reverse original balance effect
  if (original.type === "income") {
    await db.update(wallets).set({ currentBalance: sql`${wallets.currentBalance} - ${original.amount}` }).where(eq(wallets.id, original.walletId));
  } else if (original.type === "expense") {
    await db.update(wallets).set({ currentBalance: sql`${wallets.currentBalance} + ${original.amount}` }).where(eq(wallets.id, original.walletId));
  } else if (original.type === "transfer" && original.transferToWalletId) {
    await db.update(wallets).set({ currentBalance: sql`${wallets.currentBalance} + ${original.amount}` }).where(eq(wallets.id, original.walletId));
    await db.update(wallets).set({ currentBalance: sql`${wallets.currentBalance} - ${original.amount}` }).where(eq(wallets.id, original.transferToWalletId));
  }

  // 3. Apply new transaction data
  await db.update(transactions).set({
    walletId: data.walletId,
    categoryId: data.categoryId ?? null,
    type: data.type,
    amount: data.amount,
    note: data.note ?? null,
    date: data.date,
    transferToWalletId: data.transferToWalletId ?? null,
  }).where(eq(transactions.id, id));

  // 4. Apply new balance effect
  if (data.type === "income") {
    await db.update(wallets).set({ currentBalance: sql`${wallets.currentBalance} + ${data.amount}` }).where(eq(wallets.id, data.walletId));
  } else if (data.type === "expense") {
    await db.update(wallets).set({ currentBalance: sql`${wallets.currentBalance} - ${data.amount}` }).where(eq(wallets.id, data.walletId));
  } else if (data.type === "transfer" && data.transferToWalletId) {
    await db.update(wallets).set({ currentBalance: sql`${wallets.currentBalance} - ${data.amount}` }).where(eq(wallets.id, data.walletId));
    await db.update(wallets).set({ currentBalance: sql`${wallets.currentBalance} + ${data.amount}` }).where(eq(wallets.id, data.transferToWalletId));
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  revalidatePath("/insights");
  revalidatePath("/budgets");

  if (data.type === "expense" && data.categoryId) {
    const budgetCheck = await checkBudgetExceeded(data.categoryId, data.amount, data.date);
    if (budgetCheck.exceeded) {
      return { success: true, overbudget: true, message: budgetCheck.message };
    }
  }

  return { success: true };
}

