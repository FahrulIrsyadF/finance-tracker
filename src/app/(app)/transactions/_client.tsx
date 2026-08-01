"use client";

import { useState, useTransition } from "react";
import { deleteTransaction } from "@/actions/transactions";
import { TransactionForm, WalletOption, CategoryOption } from "@/components/transaction/transaction-form";
import type { TransactionType } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Trash2, Pencil, ArrowLeftRight, TrendingUp, TrendingDown, FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type TxRow = {
  id: string; walletId: string; categoryId: string | null;
  type: string; amount: number; note: string | null;
  date: Date; source: string;
};

interface Props {
  initialTransactions: TxRow[];
  wallets: WalletOption[];
  categories: CategoryOption[];
}

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
  transfer: "Transfer",
};

export function TransactionsClient({ initialTransactions, wallets, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TxRow | null>(null);
  // State-based delete confirmation — avoids window.confirm() which can be blocked
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w]));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    startTransition(async () => {
      await deleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
      router.refresh();
    });
  };

  // Group by date string
  const grouped: Record<string, TxRow[]> = {};
  for (const tx of initialTransactions) {
    const key = new Date(tx.date).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  }

  const activeWallets = wallets.filter(w => !w.isArchived);

  return (
    <div className="px-4 pt-6 max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transaksi</h1>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => router.push("/transactions/ai")}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            AI
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => router.push("/transactions/pdf")}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              if (activeWallets.length === 0) {
                alert("Silakan tambah wallet aktif terlebih dahulu.");
                router.push("/wallets");
                return;
              }
              setAddDialogOpen(true);
            }} 
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada transaksi.</p>
          <p className="text-xs mt-1">Ketuk Tambah atau gunakan shortcut di HP kamu.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, txs]) => {
            const dayIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const dayExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

            return (
              <div key={date}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {date}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600">+{formatCurrency(dayIncome)}</span>
                    )}
                    {dayIncome > 0 && dayExpense > 0 && " · "}
                    {dayExpense > 0 && (
                      <span className="text-rose-600">-{formatCurrency(dayExpense)}</span>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  {txs.map((tx) => {
                    const cat = tx.categoryId ? categoryMap[tx.categoryId] : null;
                    const wallet = walletMap[tx.walletId];

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: cat?.color ?? "#6B7280" }}
                          >
                            {tx.type === "income" ? (
                              <TrendingUp className="h-4 w-4 text-white" />
                            ) : tx.type === "expense" ? (
                              <TrendingDown className="h-4 w-4 text-white" />
                            ) : (
                              <ArrowLeftRight className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {tx.note ?? cat?.name ?? TYPE_LABELS[tx.type as TransactionType]}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {wallet?.name ?? "Wallet Dihapus"}
                              {cat && ` · ${cat.name}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              tx.type === "income"
                                ? "text-emerald-600"
                                : tx.type === "expense"
                                ? "text-rose-600"
                                : "text-muted-foreground"
                            )}
                          >
                            {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                            {formatCurrency(tx.amount)}
                          </p>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditTarget(tx)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTargetId(tx.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Hapus Transaksi</DialogTitle>
            <DialogDescription>
              Transaksi ini akan dihapus permanen dan saldo wallet akan dikembalikan. Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={pending}
            >
              {pending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Tambah Transaksi</DialogTitle>
          </DialogHeader>
          <TransactionForm
            wallets={wallets}
            categories={categories}
            onSuccess={() => setAddDialogOpen(false)}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
      >
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <TransactionForm
              wallets={wallets}
              categories={categories}
              editId={editTarget.id}
              initialValues={{
                walletId: editTarget.walletId,
                categoryId: editTarget.categoryId ?? undefined,
                type: editTarget.type as TransactionType,
                amount: editTarget.amount,
                note: editTarget.note ?? undefined,
                date: new Date(editTarget.date).toISOString().split("T")[0],
              }}
              onSuccess={() => setEditTarget(null)}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
