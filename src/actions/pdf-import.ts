"use server";

import { db } from "@/lib/db";
import { categories, transactions, wallets } from "@/lib/db/schema";
import { parsePDFBuffer } from "@/lib/parsers/pdf-parser";
import { ParsedTransaction } from "@/lib/parsers/types";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export type ImportPreviewRow = ParsedTransaction & {
  id: string;
  status: "new" | "duplicate";
  categoryId?: string;
  selected: boolean;
};

export async function previewPDFImport(formData: FormData, walletId: string) {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file uploaded");

  const buffer = Buffer.from(await file.arrayBuffer());
  
  const parseResult = await parsePDFBuffer(buffer);
  
  if (parseResult.bank === "Unknown") {
    throw new Error("Format PDF tidak dikenali. Pastikan file adalah E-Statement BCA atau Bank Jago.");
  }
  
  if (parseResult.transactions.length === 0) {
    throw new Error("Tidak ada transaksi yang bisa diekstrak dari PDF ini.");
  }

  // Ambil data transaksi existing dari DB untuk deduplikasi
  const existingTxs = await db
    .select({
      date: transactions.date,
      amount: transactions.amount,
      type: transactions.type
    })
    .from(transactions)
    .where(eq(transactions.walletId, walletId));

  // Ambil semua kategori untuk mapping auto-kategori
  const dbCategories = await db.select().from(categories);

  const preview: ImportPreviewRow[] = parseResult.transactions.map((tx) => {
    // Cek duplikasi
    const txDateDate = new Date(tx.date);
    const isDuplicate = existingTxs.some(
      (etx) => etx.date.getTime() === txDateDate.getTime() && etx.amount === tx.amount && etx.type === tx.type
    );

    // Map category ID
    let categoryId: string | undefined = undefined;
    if (tx.categoryName) {
      const match = dbCategories.find(c => c.name.toLowerCase() === tx.categoryName?.toLowerCase());
      if (match) categoryId = match.id;
    }

    return {
      ...tx,
      id: randomUUID(),
      status: isDuplicate ? "duplicate" : "new",
      selected: !isDuplicate, // default centang jika bukan duplikat
      categoryId
    };
  });

  return { bank: parseResult.bank, preview };
}

export type SaveTx = Omit<ParsedTransaction, "categoryName"> & { categoryId?: string };

export async function saveImportedTransactions(
  walletId: string,
  transactionsToSave: SaveTx[]
) {
  const now = new Date();
  let totalIncome = 0;
  let totalExpense = 0;

  const insertData = transactionsToSave.map(tx => {
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
      source: "pdf_import" as const,
      createdAt: now,
    };
  });

  if (insertData.length === 0) return 0;

  // Transaction for DB update and wallet balance
  await db.transaction(async (tx) => {
    await tx.insert(transactions).values(insertData);
    
    // Update wallet balance
    const wallet = await tx.query.wallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.id, walletId)
    });
    
    if (wallet) {
      const net = totalIncome - totalExpense;
      await tx.update(wallets)
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
