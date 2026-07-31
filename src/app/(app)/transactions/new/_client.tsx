"use client";

import { TransactionForm, WalletOption, CategoryOption } from "@/components/transaction/transaction-form";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  wallets: WalletOption[];
  categories: CategoryOption[];
}

export function NewTransactionClient({ wallets, categories }: Props) {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const activeWallets = wallets.filter(w => !w.isArchived);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center gap-4">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <div>
          <h2 className="text-xl font-bold">Transaksi Tersimpan!</h2>
          <p className="text-sm text-muted-foreground mt-1">Transaksi berhasil dicatat.</p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => setDone(false)}>
            + Tambah Lagi
          </Button>
          <Button onClick={() => router.push("/transactions")}>
            Lihat Transaksi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/transactions">
          <Button size="icon" variant="ghost" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Catat Transaksi</h1>
          <p className="text-xs text-muted-foreground">Isi detail transaksi di bawah</p>
        </div>
      </div>

      {activeWallets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Belum ada wallet aktif.</p>
          <Link href="/wallets">
            <Button variant="link" className="mt-1 text-sm">Tambah Wallet dulu →</Button>
          </Link>
        </div>
      ) : (
        <TransactionForm
          wallets={wallets}
          categories={categories}
          onSuccess={() => setDone(true)}
          onCancel={() => router.push("/transactions")}
        />
      )}
    </div>
  );
}
