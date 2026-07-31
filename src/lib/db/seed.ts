import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
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

async function seed() {
  console.log("🌱 Seeding default categories...");

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

  // Only insert if table is empty
  const existing = await db.select().from(categories);
  if (existing.length > 0) {
    console.log(`✅ Categories already seeded (${existing.length} rows). Skipping.`);
    return;
  }

  await db.insert(categories).values(data);
  console.log(`✅ Inserted ${data.length} default categories.`);
}

seed().catch(console.error);
