import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const wallets = sqliteTable("wallets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // cash, bank, ewallet, credit
  initialBalance: real("initial_balance").notNull().default(0),
  currentBalance: real("current_balance").notNull().default(0),
  color: text("color"),
  icon: text("icon"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // income, expense
  color: text("color"),
  icon: text("icon"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  walletId: text("wallet_id").references(() => wallets.id).notNull(),
  categoryId: text("category_id").references(() => categories.id), // Nullable for transfers
  type: text("type").notNull(), // income, expense, transfer
  amount: real("amount").notNull(),
  note: text("note"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  transferToWalletId: text("transfer_to_wallet_id").references(() => wallets.id),
  source: text("source").notNull().default('manual'), // manual, ai_text, ocr, pdf_import, excel_import
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const transactionTags = sqliteTable("transaction_tags", {
  transactionId: text("transaction_id").references(() => transactions.id).notNull(),
  tagId: text("tag_id").references(() => tags.id).notNull(),
});

export const importLogs = sqliteTable("import_logs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // pdf, excel, ocr
  filename: text("filename").notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  transactionCount: integer("transaction_count").notNull().default(0),
});
