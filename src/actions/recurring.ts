"use server";

import { db } from "@/lib/db";
import { recurringTransactions, transactions, wallets, categories } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and, lte } from "drizzle-orm";
import { addDays, addWeeks, addMonths } from "date-fns";

export interface RecurringTransactionFormData {
  walletId: string;
  categoryId?: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  note?: string;
  frequency: "daily" | "weekly" | "monthly";
  startDate: Date;
  transferToWalletId?: string;
}

export async function getRecurringTransactions() {
  const result = await db
    .select({
      id: recurringTransactions.id,
      walletId: recurringTransactions.walletId,
      categoryId: recurringTransactions.categoryId,
      type: recurringTransactions.type,
      amount: recurringTransactions.amount,
      note: recurringTransactions.note,
      frequency: recurringTransactions.frequency,
      startDate: recurringTransactions.startDate,
      nextProcessedDate: recurringTransactions.nextProcessedDate,
      isActive: recurringTransactions.isActive,
      transferToWalletId: recurringTransactions.transferToWalletId,
      walletName: wallets.name,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(recurringTransactions)
    .innerJoin(wallets, eq(recurringTransactions.walletId, wallets.id))
    .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
    .orderBy(recurringTransactions.nextProcessedDate);

  // For transfers, we might want to join the destination wallet name, but let's keep it simple for now
  return result;
}

export async function createRecurringTransaction(data: RecurringTransactionFormData) {
  await db.insert(recurringTransactions).values({
    id: randomUUID(),
    walletId: data.walletId,
    categoryId: data.categoryId || null,
    type: data.type,
    amount: data.amount,
    note: data.note,
    frequency: data.frequency,
    startDate: data.startDate,
    nextProcessedDate: data.startDate, // Initial run on start date
    isActive: true,
    transferToWalletId: data.transferToWalletId || null,
    createdAt: new Date(),
  });
  revalidatePath("/recurring");
}

export async function updateRecurringTransaction(id: string, data: Partial<RecurringTransactionFormData>) {
  await db
    .update(recurringTransactions)
    .set({
      ...data,
      // If startDate is updated, maybe we should reset nextProcessedDate. 
      // But for simplicity, let the user toggle active/inactive if they want to pause.
    })
    .where(eq(recurringTransactions.id, id));
  revalidatePath("/recurring");
}

export async function deleteRecurringTransaction(id: string) {
  await db.delete(recurringTransactions).where(eq(recurringTransactions.id, id));
  revalidatePath("/recurring");
}

export async function toggleRecurringTransaction(id: string, isActive: boolean) {
  await db
    .update(recurringTransactions)
    .set({ isActive })
    .where(eq(recurringTransactions.id, id));
  revalidatePath("/recurring");
}

let isProcessing = false;

export async function processRecurringTransactions() {
  if (isProcessing) return { processed: 0 };
  isProcessing = true;

  try {
    const now = new Date();

  // Find all active recurring transactions that need to be processed
  const dueTransactions = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextProcessedDate, now)
      )
    );

  if (dueTransactions.length === 0) return { processed: 0 };

  let processedCount = 0;

  for (const rt of dueTransactions) {
    let nextDate = new Date(rt.nextProcessedDate);
    
    // Process all missed occurrences (if any) up to 'now'
    while (nextDate <= now) {
      // 1. Create the transaction
      await db.insert(transactions).values({
        id: randomUUID(),
        walletId: rt.walletId,
        categoryId: rt.categoryId,
        type: rt.type,
        amount: rt.amount,
        note: (rt.note ? rt.note + ' ' : '') + '(Auto)',
        date: nextDate,
        createdAt: new Date(),
        transferToWalletId: rt.transferToWalletId,
        source: 'manual', // treating it as manual or maybe 'auto' - but let's stick to schema
      });

      // 2. Update Wallet Balance
      const wallet = await db.select().from(wallets).where(eq(wallets.id, rt.walletId)).limit(1);
      if (wallet.length > 0) {
        let newBalance = wallet[0].currentBalance;
        if (rt.type === 'income') newBalance += rt.amount;
        else if (rt.type === 'expense') newBalance -= rt.amount;
        else if (rt.type === 'transfer') newBalance -= rt.amount;

        await db.update(wallets).set({ currentBalance: newBalance }).where(eq(wallets.id, rt.walletId));

        if (rt.type === 'transfer' && rt.transferToWalletId) {
          const destWallet = await db.select().from(wallets).where(eq(wallets.id, rt.transferToWalletId)).limit(1);
          if (destWallet.length > 0) {
            await db.update(wallets).set({ currentBalance: destWallet[0].currentBalance + rt.amount }).where(eq(wallets.id, rt.transferToWalletId));
          }
        }
      }

      // Calculate next date
      if (rt.frequency === 'daily') {
        nextDate = addDays(nextDate, 1);
      } else if (rt.frequency === 'weekly') {
        nextDate = addWeeks(nextDate, 1);
      } else if (rt.frequency === 'monthly') {
        nextDate = addMonths(nextDate, 1);
      }

      processedCount++;
    }

    // 3. Update the recurring transaction's nextProcessedDate
    await db
      .update(recurringTransactions)
      .set({ nextProcessedDate: nextDate })
      .where(eq(recurringTransactions.id, rt.id));
  }

  if (processedCount > 0) {
    // Revalidate relevant pages
    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/wallets");
  }

  return { processed: processedCount };
  } finally {
    isProcessing = false;
  }
}
