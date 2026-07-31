import { getWallets } from "@/actions/wallets";
import { getCategories } from "@/actions/categories";
import { NewTransactionClient } from "./_client";

export const metadata = {
  title: "Catat Transaksi — FinanceTracker",
};

export default async function NewTransactionPage() {
  const [wallets, categories] = await Promise.all([
    getWallets(),
    getCategories(),
  ]);

  return <NewTransactionClient wallets={wallets} categories={categories} />;
}
