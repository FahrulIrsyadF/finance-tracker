"use server";

import { db } from "@/lib/db";
import { categories, transactions, wallets } from "@/lib/db/schema";
import { parseTransactionsFromText, AITransaction } from "@/lib/gemini";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export type AIPreviewRow = AITransaction & {
  id: string;
  categoryId?: string;
  selected: boolean;
};

export async function parseAITransactionsAction(text: string, modelId: string = "gemini-3.5-flash-lite"): Promise<AIPreviewRow[]> {
  if (!text.trim()) throw new Error("Input teks tidak boleh kosong.");

  const dbCategories = await db.select().from(categories);
  const categoryNames = dbCategories.map((c) => c.name);

  const today = new Date().toISOString().split("T")[0];

  let parsed;
  try {
    parsed = await parseTransactionsFromText(text, today, categoryNames, modelId);
  } catch (err: any) {
    const raw: string = err?.message ?? "";
    if (raw.includes("429") || raw.toLowerCase().includes("quota") || raw.toLowerCase().includes("too many requests")) {
      throw new Error("Kuota AI sedang penuh. Coba lagi dalam beberapa menit.");
    }
    if (raw.includes("403") || raw.toLowerCase().includes("permission") || raw.toLowerCase().includes("api_key")) {
      throw new Error("API key tidak valid atau tidak punya izin. Periksa kembali GEMINI_API_KEY di .env.local.");
    }
    if (raw.includes("503") || raw.toLowerCase().includes("overloaded") || raw.toLowerCase().includes("unavailable")) {
      throw new Error("Server AI sedang sibuk. Coba lagi sebentar lagi.");
    }
    if (raw.toLowerCase().includes("model not found") || raw.includes("404")) {
      throw new Error("Model AI tidak ditemukan. Periksa nama model di konfigurasi.");
    }
    // Generic fallback
    throw new Error("AI gagal memproses teks. Pastikan koneksi internet stabil dan coba lagi.");
  }

  if (parsed.length === 0) throw new Error("Tidak ada transaksi yang terdeteksi. Coba tulis lebih jelas, contoh: 'beli kopi 25rb kemarin'.");

  return parsed.map((tx) => {
    const matchedCategory = tx.categoryName
      ? dbCategories.find((c) => c.name.toLowerCase() === tx.categoryName?.toLowerCase())
      : undefined;

    return {
      ...tx,
      id: randomUUID(),
      categoryId: matchedCategory?.id,
      selected: true,
    };
  });
}

export async function saveAITransactions(
  walletId: string,
  transactionsToSave: (Omit<AITransaction, "categoryName"> & { categoryId?: string })[]
) {
  const now = new Date();
  let totalIncome = 0;
  let totalExpense = 0;

  const insertData = transactionsToSave.map((tx) => {
    if (tx.type === "income") totalIncome += tx.amount;
    else totalExpense += tx.amount;

    return {
      id: randomUUID(),
      walletId,
      categoryId: tx.categoryId || null,
      type: tx.type,
      amount: tx.amount,
      note: tx.note,
      date: new Date(tx.date),
      source: "ai_input" as const,
      createdAt: now,
    };
  });

  if (insertData.length === 0) return 0;

  await db.transaction(async (trx) => {
    await trx.insert(transactions).values(insertData);

    const wallet = await trx.query.wallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.id, walletId),
    });

    if (wallet) {
      const net = totalIncome - totalExpense;
      await trx.update(wallets)
        .set({ currentBalance: wallet.currentBalance + net })
        .where(eq(wallets.id, walletId));
    }
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  revalidatePath("/insights");

  return insertData.length;
}
