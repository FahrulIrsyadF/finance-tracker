import { getTransactions } from "@/actions/transactions";
import { getWallets } from "@/actions/wallets";
import { getCategories } from "@/actions/categories";
import { TransactionsClient } from "./_client";

export default async function TransactionsPage() {
  const [txList, wallets, categories] = await Promise.all([
    getTransactions(),
    getWallets(),
    getCategories(),
  ]);

  return (
    <TransactionsClient
      initialTransactions={txList}
      wallets={wallets}
      categories={categories}
    />
  );
}
