import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import {
  transactions,
  wallets,
  categories,
  tags,
  transactionTags,
  importLogs,
} from "@/lib/db/schema";
import { randomUUID } from "crypto";

const defaultCategories = [
  // Expense
  { name: "Makanan & Minuman", type: "expense", color: "#F97316", icon: "UtensilsCrossed" },
  { name: "Transportasi", type: "expense", color: "#3B82F6", icon: "Car" },
  { name: "Belanja", type: "expense", color: "#A855F7", icon: "ShoppingBag" },
  { name: "Kesehatan", type: "expense", color: "#EF4444", icon: "Heart" },
  { name: "Hiburan", type: "expense", color: "#EAB308", icon: "Gamepad2" },
  { name: "Tagihan & Utilitas", type: "expense", color: "#6B7280", icon: "Receipt" },
  { name: "Pendidikan", type: "expense", color: "#06B6D4", icon: "BookOpen" },
  { name: "Perawatan Diri", type: "expense", color: "#EC4899", icon: "Sparkles" },
  { name: "Investasi", type: "expense", color: "#10B981", icon: "TrendingUp" },
  { name: "Lainnya", type: "expense", color: "#9CA3AF", icon: "MoreHorizontal" },
  // Income
  { name: "Gaji", type: "income", color: "#22C55E", icon: "Briefcase" },
  { name: "Freelance", type: "income", color: "#14B8A6", icon: "Laptop" },
  { name: "Hadiah", type: "income", color: "#F59E0B", icon: "Gift" },
  { name: "Investasi", type: "income", color: "#8B5CF6", icon: "TrendingUp" },
  { name: "Lainnya", type: "income", color: "#9CA3AF", icon: "MoreHorizontal" },
] as const;

async function reset() {
  console.log("⚠️  Starting database reset...");
  console.log("⚠️  ALL data will be wiped. Press Ctrl+C within 3 seconds to cancel.");
  await new Promise((r) => setTimeout(r, 3000));

  console.log("\n🗑️  Deleting transaction_tags...");
  await db.delete(transactionTags);

  console.log("🗑️  Deleting import_logs...");
  await db.delete(importLogs);

  console.log("🗑️  Deleting transactions...");
  await db.delete(transactions);

  console.log("🗑️  Deleting wallets...");
  await db.delete(wallets);

  console.log("🗑️  Deleting categories (including defaults)...");
  await db.delete(categories);

  console.log("🗑️  Deleting tags...");
  await db.delete(tags);

  console.log("\n🌱 Re-seeding default categories...");
  const now = new Date();
  const data = defaultCategories.map((cat) => ({
    id: randomUUID(),
    name: cat.name,
    type: cat.type,
    color: cat.color,
    icon: cat.icon,
    isDefault: true,
    createdAt: now,
  }));

  await db.insert(categories).values(data);
  console.log(`✅ Inserted ${data.length} default categories.`);
  console.log("\n✅ Database reset complete. Fresh start!");
}

reset().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
