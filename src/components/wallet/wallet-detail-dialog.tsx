"use client";

import { useState, useTransition, useEffect } from "react";
import { getWalletTransactions, updateWalletInitialBalance } from "@/actions/wallets";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet, TrendingUp, TrendingDown, ArrowLeftRight,
  Pencil, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type WalletRow = {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  currentBalance: number;
  color: string | null;
  icon: string | null;
  isArchived: boolean;
};

type TxRow = {
  id: string;
  walletId: string;
  categoryId: string | null;
  type: string;
  amount: number;
  note: string | null;
  date: Date;
  source: string;
};

type TimeFilter = "this_month" | "last_7_days" | "last_month" | "all";

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  this_month: "Bulan ini",
  last_7_days: "7 hari terakhir",
  last_month: "Bulan lalu",
  all: "Semua",
};

function getDateRange(filter: TimeFilter): { startDate?: Date; endDate?: Date } {
  const now = new Date();
  if (filter === "this_month") {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }
  if (filter === "last_7_days") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: now };
  }
  if (filter === "last_month") {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0),
      endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  }
  return {};
}

interface Props {
  wallet: WalletRow | null;
  open: boolean;
  onClose: () => void;
}

export function WalletDetailDialog({ wallet, open, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("this_month");
  const [txList, setTxList] = useState<TxRow[] | null>(null);
  const [isTxLoaded, setIsTxLoaded] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [isSaving, startSavingTransition] = useTransition();

  const loadTransactions = (filter: TimeFilter) => {
    if (!wallet) return;
    setIsTxLoaded(false);
    startTransition(async () => {
      const range = getDateRange(filter);
      const data = await getWalletTransactions(wallet.id, range);
      setTxList(data as TxRow[]);
      setIsTxLoaded(true);
    });
  };

  useEffect(() => {
    if (open && wallet) {
      loadTransactions("this_month");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wallet?.id]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTxList(null);
      setIsTxLoaded(false);
      setEditingBalance(false);
      setTimeFilter("this_month");
      onClose();
    }
  };

  const handleFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    loadTransactions(filter);
  };

  const handleSaveBalance = () => {
    if (!wallet) return;
    const val = Number(newBalance);
    if (isNaN(val) || val < 0) return;
    startSavingTransition(async () => {
      await updateWalletInitialBalance(wallet.id, val);
      setEditingBalance(false);
      setNewBalance("");
      router.refresh();
      onClose();
    });
  };

  if (!wallet) return null;

  const grouped: Record<string, TxRow[]> = {};
  for (const tx of txList ?? []) {
    const key = new Date(tx.date).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: wallet.color ?? "#6B7280" }}
            >
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base truncate">{wallet.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Balance Info */}
        <div className="px-5 py-4 border-b shrink-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Saldo Saat Ini</p>
              <p className="font-bold">{formatCurrency(wallet.currentBalance)}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 relative group">
              <p className="text-xs text-muted-foreground mb-1">Saldo Awal</p>
              {editingBalance ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="h-7 text-xs px-2 w-full"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveBalance();
                      if (e.key === "Escape") setEditingBalance(false);
                    }}
                    disabled={isSaving}
                  />
                  <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleSaveBalance} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pencil className="h-3 w-3" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-bold">{formatCurrency(wallet.initialBalance)}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setNewBalance(wallet.initialBalance.toString());
                      setEditingBalance(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction History & Filter */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Riwayat Transaksi</h3>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
            {(["this_month", "last_7_days", "last_month", "all"] as TimeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  timeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {TIME_FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          <div className={cn("space-y-4 transition-opacity", (!isTxLoaded || isPending) && "opacity-50 pointer-events-none")}>
            {!isTxLoaded ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">Tidak ada transaksi.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([date, txs]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {date}
                  </p>
                  <div className="space-y-2">
                    {txs.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                            tx.type === "income" ? "bg-emerald-100 dark:bg-emerald-950" : 
                            tx.type === "expense" ? "bg-rose-100 dark:bg-rose-950" : 
                            "bg-blue-100 dark:bg-blue-950"
                          )}>
                            {tx.type === "income" ? <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : 
                             tx.type === "expense" ? <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" /> : 
                             <ArrowLeftRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tx.note ?? "Transaksi"}</p>
                          </div>
                        </div>
                        <p className={cn(
                          "text-sm font-semibold",
                          tx.type === "income" ? "text-emerald-600" : 
                          tx.type === "expense" ? "text-rose-600" : "text-muted-foreground"
                        )}>
                          {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
