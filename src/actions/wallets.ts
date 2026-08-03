"use server";

import { db } from "@/lib/db";
import { wallets, transactions } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";

export type WalletType = "cash" | "bank" | "ewallet" | "credit";

export interface WalletFormData {
  name: string;
  type: WalletType;
  initialBalance: number;
  color: string;
  icon: string;
}

export async function getWallets() {
  return db.select().from(wallets).orderBy(wallets.createdAt);
}

export async function createWallet(data: WalletFormData) {
  const now = new Date();
  await db.insert(wallets).values({
    id: randomUUID(),
    name: data.name,
    type: data.type,
    initialBalance: data.initialBalance,
    currentBalance: data.initialBalance,
    color: data.color,
    icon: data.icon,
    createdAt: now,
  });
  revalidatePath("/wallets");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/insights");
}

export async function updateWallet(id: string, data: Partial<WalletFormData>) {
  await db.update(wallets).set(data).where(eq(wallets.id, id));
  revalidatePath("/wallets");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/insights");
}

/**
 * Edit saldo awal wallet dan adjust currentBalance secara proporsional.
 * currentBalance += (newInitial - oldInitial) agar tidak membuang running balance.
 */
export async function updateWalletInitialBalance(id: string, newInitialBalance: number) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
  if (!wallet) throw new Error("Wallet tidak ditemukan");

  const diff = newInitialBalance - wallet.initialBalance;
  await db
    .update(wallets)
    .set({
      initialBalance: newInitialBalance,
      currentBalance: sql`${wallets.currentBalance} + ${diff}`,
    })
    .where(eq(wallets.id, id));

  revalidatePath("/wallets");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/insights");
}

export async function getWalletTransactions(
  walletId: string,
  opts?: { startDate?: Date; endDate?: Date }
) {
  const conditions = [eq(transactions.walletId, walletId)];
  if (opts?.startDate) conditions.push(gte(transactions.date, opts.startDate));
  if (opts?.endDate) conditions.push(lte(transactions.date, opts.endDate));

  return db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date));
}

export async function deleteWallet(id: string) {
  // Check if wallet has transactions
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.walletId, id));

  const [{ countAsTransfer }] = await db
    .select({ countAsTransfer: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.transferToWalletId, id));

  if (count > 0 || countAsTransfer > 0) {
    // Soft delete / Archive
    await db.update(wallets).set({ isArchived: true }).where(eq(wallets.id, id));
  } else {
    // Hard delete
    await db.delete(wallets).where(eq(wallets.id, id));
  }
  
  revalidatePath("/wallets");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}
