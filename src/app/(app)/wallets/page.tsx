import { getWallets } from "@/actions/wallets";
import { getCategories } from "@/actions/categories";
import { WalletsClient } from "./_client";

export default async function WalletsPage() {
  const [walletsData, categories] = await Promise.all([
    getWallets(),
    getCategories(),
  ]);

  // Map ke WalletOption shape yang dibutuhkan TransactionForm
  const walletOptions = walletsData.map((w) => ({
    id: w.id,
    name: w.name,
    currentBalance: w.currentBalance,
    color: w.color,
    isArchived: w.isArchived,
  }));

  return (
    <WalletsClient
      initialWallets={walletsData}
      wallets={walletOptions}
      categories={categories}
    />
  );
}
