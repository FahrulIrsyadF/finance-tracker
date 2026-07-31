"use server";

import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export type CategoryType = "income" | "expense";

export interface CategoryFormData {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

export async function getCategories(type?: CategoryType) {
  const result = await db.select().from(categories).orderBy(categories.name);
  if (type) return result.filter((c) => c.type === type);
  return result;
}

export async function createCategory(data: CategoryFormData) {
  await db.insert(categories).values({
    id: randomUUID(),
    name: data.name,
    type: data.type,
    color: data.color,
    icon: data.icon,
    isDefault: false,
  });
  revalidatePath("/categories");
}

export async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  await db.update(categories).set(data).where(eq(categories.id, id));
  revalidatePath("/categories");
}

export async function deleteCategory(id: string) {
  // Check if any transactions use this category
  const usages = await db
    .select()
    .from(transactions)
    .where(eq(transactions.categoryId, id));

  if (usages.length > 0) {
    throw new Error(`Kategori ini digunakan oleh ${usages.length} transaksi. Hapus atau pindahkan transaksi terlebih dahulu.`);
  }

  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/categories");
}
