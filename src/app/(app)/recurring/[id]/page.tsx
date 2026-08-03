import { getRecurringTransactions } from "@/actions/recurring";
import { getCategories } from "@/actions/categories";
import { getWallets } from "@/actions/wallets";
import { RecurringForm } from "../_components/recurring-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RecurringEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  
  const [wallets, categories, recurrings] = await Promise.all([
    getWallets(),
    getCategories(),
    isNew ? Promise.resolve([]) : getRecurringTransactions()
  ]);

  let initialData = undefined;
  if (!isNew) {
    const r = recurrings.find(r => r.id === id);
    if (!r) notFound();
    initialData = {
      walletId: r.walletId,
      categoryId: r.categoryId || undefined,
      type: r.type,
      amount: r.amount,
      note: r.note || undefined,
      frequency: r.frequency,
      startDate: new Date(r.startDate).toISOString().split('T')[0],
      transferToWalletId: r.transferToWalletId || undefined,
    };
  }

  return (
    <div className="flex flex-col h-full bg-background max-w-md mx-auto w-full">
      <header className="px-4 py-4 border-b flex items-center gap-3 sticky top-0 bg-background z-10">
        <Link href="/recurring" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{isNew ? "Tambah Transaksi Rutin" : "Edit Transaksi Rutin"}</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <RecurringForm 
          wallets={wallets}
          categories={categories}
          initialData={initialData}
          editId={isNew ? undefined : id}
        />
      </main>
    </div>
  );
}
