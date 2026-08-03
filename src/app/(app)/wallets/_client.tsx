"use client";

import { useState, useTransition } from "react";
import { deleteWallet } from "@/actions/wallets";
import { WalletDialog } from "@/components/wallet/wallet-dialog";
import { WalletDetailDialog } from "@/components/wallet/wallet-detail-dialog";
import { TransactionForm } from "@/components/transaction/transaction-form";
import type { WalletOption, CategoryOption } from "@/components/transaction/transaction-form";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, Wallet, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

type WalletRow = {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  currentBalance: number;
  color: string | null;
  icon: string | null;
  createdAt: Date;
  isArchived: boolean;
};

interface Props {
  initialWallets: WalletRow[];
  wallets: WalletOption[];
  categories: CategoryOption[];
}

export function WalletsClient({ initialWallets, wallets, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WalletRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [detailWallet, setDetailWallet] = useState<WalletRow | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const activeWallets = initialWallets.filter((w) => !w.isArchived);
  const archivedWallets = initialWallets.filter((w) => w.isArchived);
  const displayedWallets = showArchived ? initialWallets : activeWallets;
  const totalBalance = activeWallets.reduce((s, w) => s + w.currentBalance, 0);

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    startTransition(async () => {
      await deleteWallet(deleteTargetId);
      setDeleteTargetId(null);
      router.refresh();
    });
  };

  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (e: React.MouseEvent, w: WalletRow) => {
    e.stopPropagation();
    setEditTarget(w);
    setDialogOpen(true);
  };

  const openDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  return (
    <div className="px-4 pt-6 max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Wallet</h1>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalBalance)}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeWallets.length >= 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTransferDialogOpen(true)}
              className="gap-1.5"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Transfer
            </Button>
          )}
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      {displayedWallets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada wallet.</p>
          <p className="text-xs mt-1">Tambah wallet untuk mulai mencatat keuangan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedWallets.map((wallet) => (
            <div
              key={wallet.id}
              onClick={() => setDetailWallet(wallet)}
              className="flex items-center justify-between p-4 rounded-2xl border bg-card cursor-pointer hover:bg-muted/40 active:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: wallet.color ?? "#6B7280" }}
                >
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
                  <p className="text-xs text-muted-foreground">
                    Awal: {formatCurrency(wallet.initialBalance)}
                  </p>
                  {wallet.isArchived && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 text-[10px] rounded font-medium">
                      Dihapus
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-base">{formatCurrency(wallet.currentBalance)}</p>
                <div className="flex gap-1 mt-1 justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => openEdit(e, wallet)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    onClick={(e) => openDelete(e, wallet.id)}
                    disabled={wallet.isArchived}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {archivedWallets.length > 0 && (
        <div className="pt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Sembunyikan Wallet Dihapus" : `Tampilkan Wallet Dihapus (${archivedWallets.length})`}
          </Button>
        </div>
      )}

      {/* Wallet Detail Dialog */}
      <WalletDetailDialog
        wallet={detailWallet}
        open={!!detailWallet}
        onClose={() => setDetailWallet(null)}
      />

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Transfer Antar Wallet</DialogTitle>
          </DialogHeader>
          <TransactionForm
            wallets={wallets}
            categories={categories}
            initialValues={{
              walletId: activeWallets[0]?.id ?? "",
              transferToWalletId: activeWallets[1]?.id ?? "",
              type: "transfer",
              amount: 0,
              date: new Date().toISOString().split("T")[0],
            }}
            onSuccess={() => {
              setTransferDialogOpen(false);
              router.refresh();
            }}
            onCancel={() => setTransferDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Hapus Wallet</DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin menghapus wallet ini?
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

      <WalletDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editTarget ?? undefined}
      />
    </div>
  );
}
