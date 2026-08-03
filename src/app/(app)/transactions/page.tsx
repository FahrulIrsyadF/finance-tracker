import { getTransactions } from "@/actions/transactions";
import { getWallets } from "@/actions/wallets";
import { getCategories } from "@/actions/categories";
import { TransactionsClient } from "./_client";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const now = new Date();
  const monthParam = parseInt((params.month as string) || String(now.getMonth() + 1), 10);
  const yearParam = parseInt((params.year as string) || String(now.getFullYear()), 10);
  const walletIdParam = (params.walletId as string) || undefined;

  // Default: bulan ini
  const startDate = new Date(yearParam, monthParam - 1, 1, 0, 0, 0);
  const endDate = new Date(yearParam, monthParam, 0, 23, 59, 59);

  const [txList, walletsData, categories] = await Promise.all([
    getTransactions({ startDate, endDate, walletId: walletIdParam }),
    getWallets(),
    getCategories(),
  ]);

  const wallets = walletsData.map((w) => ({
    id: w.id,
    name: w.name,
    currentBalance: w.currentBalance,
    color: w.color,
    isArchived: w.isArchived,
  }));

  return (
    <TransactionsClient
      initialTransactions={txList}
      wallets={wallets}
      categories={categories}
      currentMonth={monthParam}
      currentYear={yearParam}
      currentWalletId={walletIdParam}
    />
  );
}
