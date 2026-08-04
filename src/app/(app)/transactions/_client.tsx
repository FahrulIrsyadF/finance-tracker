"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { deleteTransaction, searchTransactions } from "@/actions/transactions";
import { TransactionForm, WalletOption, CategoryOption } from "@/components/transaction/transaction-form";
import type { TransactionType } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Plus, Trash2, Pencil, ArrowLeftRight, TrendingUp, TrendingDown,
  FileText, Sparkles, Search, ChevronLeft, ChevronRight, X, Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

type TxRow = {
  id: string; walletId: string; categoryId: string | null;
  type: string; amount: number; note: string | null;
  date: Date; source: string;
  transferToWalletId?: string | null;
};

interface Props {
  initialTransactions: TxRow[];
  wallets: WalletOption[];
  categories: CategoryOption[];
  currentMonth: number;
  currentYear: number;
  currentWalletId?: string;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
  transfer: "Transfer",
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function TransactionsClient({
  initialTransactions,
  wallets,
  categories,
  currentMonth,
  currentYear,
  currentWalletId,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TxRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TxRow[] | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w]));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const activeWallets = wallets.filter(w => !w.isArchived);
  const selectedWallet = wallets.find((w) => w.id === currentWalletId);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearchTransition(async () => {
        const results = await searchTransactions(searchQuery);
        setSearchResults(results as TxRow[]);
      });
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    startTransition(async () => {
      await deleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
      router.refresh();
    });
  };

  const navigate = (newMonth: number, newYear: number, newWalletId?: string | null) => {
    const params = new URLSearchParams();
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    const wid = newWalletId === null ? undefined : (newWalletId ?? currentWalletId);
    if (wid) params.set("walletId", wid);
    startTransition(() => {
      router.push(`/transactions?${params.toString()}`);
    });
  };

  const prevMonth = () => {
    if (currentMonth === 1) navigate(12, currentYear - 1);
    else navigate(currentMonth - 1, currentYear);
  };

  const nextMonth = () => {
    if (currentMonth === 12) navigate(1, currentYear + 1);
    else navigate(currentMonth + 1, currentYear);
  };

  // Determine which transactions to show and project transfer types based on wallet filter
  const displayTxs = searchResults !== null ? searchResults : initialTransactions;
  
  const projectedTxs = displayTxs.map(tx => {
    let computedType = tx.type;
    if (tx.type === "transfer" && currentWalletId) {
      if (tx.walletId === currentWalletId) computedType = "expense";
      else if (tx.transferToWalletId === currentWalletId) computedType = "income";
    }
    return { ...tx, computedType };
  });

  // Group by date
  const grouped: Record<string, (TxRow & { computedType: string })[]> = {};
  for (const tx of projectedTxs) {
    const key = new Date(tx.date).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  }

  const isSearchMode = searchResults !== null;

  return (
    <div className="px-4 pt-6 pb-28 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transaksi</h1>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => {
              const visible = !isSearchVisible;
              setIsSearchVisible(visible);
              if (visible) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
              } else {
                setSearchQuery("");
                setSearchResults(null);
              }
            }}
          >
            <Search className="h-4 w-4" />
          </Button>

          {wallets.filter(w => !w.isArchived).length > 1 && (
            <Select
              value={currentWalletId ?? "all"}
              onValueChange={(val) => navigate(currentMonth, currentYear, val === "all" ? null : val)}
              disabled={pending}
            >
              <SelectTrigger id="tx-wallet-filter" className="h-8 text-xs border-dashed w-[110px]">
                <SelectValue>
                  {selectedWallet ? selectedWallet.name : "Semua"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {wallets.filter(w => !w.isArchived).map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="gap-1.5 h-8 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchVisible && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Cari transaksi..."
            className="pl-9 pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Filters — hidden in search mode */}
      {!isSearchMode && (
        <div className="space-y-2">

          {/* Month/Year Navigator */}
          <div className="flex items-center justify-between bg-card p-2 rounded-xl border">
            <Button size="icon" variant="ghost" onClick={prevMonth} disabled={pending} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="font-semibold text-sm">
              {MONTHS[currentMonth - 1]} {currentYear}
            </p>
            <Button size="icon" variant="ghost" onClick={nextMonth} disabled={pending} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Search mode indicator */}
      {isSearchMode && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span>
            {isSearching ? "Mencari..." : `${displayTxs.length} hasil untuk "${searchQuery}"`}
          </span>
        </div>
      )}

      {/* Transaction List */}
      <div className={cn("transition-opacity duration-150", pending && "opacity-50 pointer-events-none")}>
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {isSearchMode ? "Tidak ada hasil ditemukan." : "Belum ada transaksi bulan ini."}
            </p>
            {!isSearchMode && (
              <p className="text-xs mt-1">Ketuk tombol + untuk menambah transaksi.</p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, txs]) => {
              const dayIncome = txs.filter((t) => t.computedType === "income").reduce((s, t) => s + t.amount, 0);
              const dayExpense = txs.filter((t) => t.computedType === "expense").reduce((s, t) => s + t.amount, 0);

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
                              {tx.computedType === "income" ? (
                                <TrendingUp className="h-4 w-4 text-white" />
                              ) : tx.computedType === "expense" ? (
                                <TrendingDown className="h-4 w-4 text-white" />
                              ) : (
                                <ArrowLeftRight className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {tx.note ?? cat?.name ?? TYPE_LABELS[tx.computedType as TransactionType] ?? TYPE_LABELS[tx.type as TransactionType]}
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
                                tx.computedType === "income"
                                  ? "text-emerald-600"
                                  : tx.computedType === "expense"
                                  ? "text-rose-600"
                                  : "text-muted-foreground"
                              )}
                            >
                              {tx.computedType === "income" ? "+" : tx.computedType === "expense" ? "-" : ""}
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
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          if (activeWallets.length === 0) {
            alert("Silakan tambah wallet aktif terlebih dahulu.");
            router.push("/wallets");
            return;
          }
          setAddDialogOpen(true);
        }}
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
        aria-label="Tambah transaksi"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Import Dialog — pilih AI atau PDF */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Import Transaksi</DialogTitle>
            <DialogDescription>
              Pilih metode import yang ingin kamu gunakan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              onClick={() => { setImportDialogOpen(false); router.push("/transactions/ai"); }}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-900 transition-colors">
                <Sparkles className="h-6 w-6 text-violet-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">AI Input</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tulis teks, AI parse otomatis</p>
              </div>
            </button>
            <button
              onClick={() => { setImportDialogOpen(false); router.push("/transactions/pdf"); }}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900 transition-colors">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">PDF E-Statement</p>
                <p className="text-xs text-muted-foreground mt-0.5">Upload mutasi bank PDF</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" onClick={() => setDeleteTargetId(null)} disabled={pending}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={pending}>
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
            onSuccess={() => {
              setAddDialogOpen(false);
              if (searchQuery.trim()) {
                startSearchTransition(async () => {
                  const results = await searchTransactions(searchQuery);
                  setSearchResults(results as TxRow[]);
                });
              }
            }}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
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
              onSuccess={() => {
                setEditTarget(null);
                if (searchQuery.trim()) {
                  startSearchTransition(async () => {
                    const results = await searchTransactions(searchQuery);
                    setSearchResults(results as TxRow[]);
                  });
                }
              }}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
