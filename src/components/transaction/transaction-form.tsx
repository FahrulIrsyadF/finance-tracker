"use client";

import { useState, useTransition } from "react";
import { createTransaction, updateTransaction, TransactionType, TransactionFormData } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export type WalletOption = { id: string; name: string; currentBalance: number; color: string | null; isArchived?: boolean };
export type CategoryOption = { id: string; name: string; type: string; color: string | null };

export interface TransactionFormProps {
  wallets: WalletOption[];
  categories: CategoryOption[];
  /** If provided, form runs in edit mode */
  editId?: string;
  initialValues?: {
    walletId: string;
    transferToWalletId?: string;
    categoryId?: string;
    type: TransactionType;
    amount: number;
    note?: string;
    date: string;
  };
  /** Called after successful save */
  onSuccess?: () => void;
  /** Show cancel button that calls this */
  onCancel?: () => void;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
  transfer: "Transfer",
};

export function TransactionForm({
  wallets,
  categories,
  editId,
  initialValues,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const activeWallets = wallets.filter(w => !w.isArchived);

  const [typeTab, setTypeTab] = useState<TransactionType>(initialValues?.type ?? "expense");
  const [form, setForm] = useState({
    walletId: initialValues?.walletId ?? activeWallets[0]?.id ?? "",
    transferToWalletId: initialValues?.transferToWalletId ?? "",
    categoryId: initialValues?.categoryId ?? "",
    amount: initialValues?.amount ? String(initialValues.amount) : "",
    note: initialValues?.note ?? "",
    date: initialValues?.date ?? new Date().toISOString().split("T")[0],
  });

  const filteredCategories = categories.filter((c) => c.type === typeTab);

  // Explicit label lookup — fixes shadcn/Radix SelectValue ID display bug
  const selectedWalletObj = wallets.find((w) => w.id === form.walletId);
  const selectedWalletLabel = selectedWalletObj
    ? `${selectedWalletObj.name} — ${formatCurrency(selectedWalletObj.currentBalance)}`
    : form.walletId ? "Wallet Dihapus" : undefined;

  const selectedTransferObj = wallets.find((w) => w.id === form.transferToWalletId);
  const selectedTransferLabel = selectedTransferObj?.name || (form.transferToWalletId ? "Wallet Dihapus" : undefined);

  const selectedCategoryLabel = categories.find((c) => c.id === form.categoryId)?.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: TransactionFormData = {
      walletId: form.walletId,
      categoryId: typeTab !== "transfer" ? form.categoryId || undefined : undefined,
      type: typeTab,
      amount: Number(form.amount),
      note: form.note || undefined,
      date: new Date(form.date),
      transferToWalletId: typeTab === "transfer" ? form.transferToWalletId : undefined,
    };

    startTransition(async () => {
      if (editId) {
        await updateTransaction(editId, data);
      } else {
        await createTransaction(data);
      }
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type tabs */}
      <div className="flex rounded-xl overflow-hidden border">
        {(["expense", "income", "transfer"] as TransactionType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setTypeTab(tab);
              setForm((f) => ({ ...f, categoryId: "" }));
            }}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              typeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {TYPE_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-amount">Jumlah (Rp)</Label>
        <Input
          id="tx-amount"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          required
          min={1}
          className="text-lg h-12"
        />
        {/* Quick amount presets */}
        <div className="flex gap-1.5 flex-wrap">
          {[5000, 10000, 20000, 25000, 50000, 100000].map((preset) => {
            const isActive = form.amount === String(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setForm((f) => ({ ...f, amount: String(preset) }))}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:border-border hover:text-foreground"
                )}
              >
                {preset >= 1000 ? `${preset / 1000}rb` : preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-date">Tanggal</Label>
        <Input
          id="tx-date"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
      </div>

      {/* Wallet source */}
      <div className="space-y-1.5">
        <Label>{typeTab === "transfer" ? "Dari Wallet" : "Wallet"}</Label>
        <Select
          value={form.walletId}
          onValueChange={(v) => setForm((f) => ({ ...f, walletId: v ?? f.walletId }))}
        >
          <SelectTrigger id="tx-wallet">
            <SelectValue placeholder="Pilih wallet...">
              {selectedWalletLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {!selectedWalletObj && form.walletId && (
              <SelectItem value={form.walletId}>
                Wallet Dihapus
              </SelectItem>
            )}
            {wallets
              .filter((w) => !w.isArchived || w.id === form.walletId)
              .map((w) => (
                <SelectItem key={w.id} value={w.id} disabled={w.isArchived}>
                  {w.name} — {formatCurrency(w.currentBalance)}
                  {w.isArchived ? " (Dihapus)" : ""}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transfer destination wallet */}
      {typeTab === "transfer" && (
        <div className="space-y-1.5">
          <Label>Ke Wallet</Label>
          <Select
            value={form.transferToWalletId}
            onValueChange={(v) => setForm((f) => ({ ...f, transferToWalletId: v ?? f.transferToWalletId }))}
          >
            <SelectTrigger id="tx-wallet-to">
              <SelectValue placeholder="Pilih tujuan...">
                {selectedTransferLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
            {!selectedTransferObj && form.transferToWalletId && (
              <SelectItem value={form.transferToWalletId}>
                Wallet Dihapus
              </SelectItem>
            )}
            {wallets
              .filter((w) => w.id !== form.walletId && (!w.isArchived || w.id === form.transferToWalletId))
              .map((w) => (
                <SelectItem key={w.id} value={w.id} disabled={w.isArchived}>
                  {w.name}
                  {w.isArchived ? " (Dihapus)" : ""}
                </SelectItem>
              ))}
          </SelectContent>
          </Select>
        </div>
      )}

      {/* Category */}
      {typeTab !== "transfer" && (
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select
            value={form.categoryId}
            onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? f.categoryId }))}
          >
            <SelectTrigger id="tx-category">
              <SelectValue placeholder="Pilih kategori...">
                {selectedCategoryLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-note">Catatan (opsional)</Label>
        <Input
          id="tx-note"
          placeholder="Deskripsi singkat..."
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending} className="flex-1">
            Batal
          </Button>
        )}
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
