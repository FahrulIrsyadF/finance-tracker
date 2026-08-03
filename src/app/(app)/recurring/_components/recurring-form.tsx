"use client";

import { useState, useTransition } from "react";
import { createRecurringTransaction, updateRecurringTransaction, RecurringTransactionFormData } from "@/actions/recurring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function RecurringForm({
  wallets,
  categories,
  editId,
  initialData,
}: {
  wallets: any[];
  categories: any[];
  editId?: string;
  initialData?: any;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const activeWallets = wallets.filter((w) => !w.isArchived);

  const [typeTab, setTypeTab] = useState<"income" | "expense" | "transfer">(initialData?.type ?? "expense");
  const [form, setForm] = useState({
    walletId: initialData?.walletId ?? activeWallets[0]?.id ?? "",
    transferToWalletId: initialData?.transferToWalletId ?? "",
    categoryId: initialData?.categoryId ?? "",
    amount: initialData?.amount ? String(initialData.amount) : "",
    note: initialData?.note ?? "",
    frequency: initialData?.frequency ?? "monthly",
    startDate: initialData?.startDate ?? new Date().toISOString().split("T")[0],
  });

  const filteredCategories = categories.filter((c) => c.type === typeTab);

  const selectedWalletObj = wallets.find((w) => w.id === form.walletId);
  const selectedTransferObj = wallets.find((w) => w.id === form.transferToWalletId);
  const selectedCategoryLabel = categories.find((c) => c.id === form.categoryId)?.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: RecurringTransactionFormData = {
      walletId: form.walletId,
      categoryId: typeTab !== "transfer" ? form.categoryId || undefined : undefined,
      type: typeTab,
      amount: Number(form.amount),
      note: form.note || undefined,
      frequency: form.frequency as "daily" | "weekly" | "monthly",
      startDate: new Date(form.startDate + "T00:00:00"),
      transferToWalletId: typeTab === "transfer" ? form.transferToWalletId : undefined,
    };

    startTransition(async () => {
      if (editId) {
        await updateRecurringTransaction(editId, data);
      } else {
        await createRecurringTransaction(data);
      }
      router.push("/recurring");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type tabs */}
      <div className="flex rounded-xl overflow-hidden border">
        {(["expense", "income", "transfer"] as const).map((tab) => (
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
            {tab === "expense" ? "Pengeluaran" : tab === "income" ? "Pemasukan" : "Transfer"}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label>Periode</Label>
        <div className="flex rounded-xl overflow-hidden border">
          {(["daily", "weekly", "monthly"] as const).map((p) => {
            const labels = { daily: "Harian", weekly: "Mingguan", monthly: "Bulanan" };
            return (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, frequency: p }))}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  form.frequency === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tx-date">Tanggal Mulai</Label>
        <Input
          id="tx-date"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          required
        />
        <p className="text-[10px] text-muted-foreground leading-snug">
          Transaksi akan otomatis dicatat setiap periode yang dipilih terhitung dari tanggal ini.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>{typeTab === "transfer" ? "Dari Wallet" : "Wallet"}</Label>
        <Select
          value={form.walletId}
          onValueChange={(v) => setForm((f) => ({ ...f, walletId: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih wallet...">
              {selectedWalletObj ? `${selectedWalletObj.name} — ${formatCurrency(selectedWalletObj.currentBalance)}` : "Pilih wallet"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {wallets
              .filter((w) => !w.isArchived || w.id === form.walletId)
              .map((w) => (
                <SelectItem key={w.id} value={w.id} disabled={w.isArchived}>
                  {w.name} — {formatCurrency(w.currentBalance)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {typeTab === "transfer" && (
        <div className="space-y-1.5">
          <Label>Ke Wallet</Label>
          <Select
            value={form.transferToWalletId}
            onValueChange={(v) => setForm((f) => ({ ...f, transferToWalletId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih tujuan...">
                {selectedTransferObj?.name || "Pilih tujuan"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
            {wallets
              .filter((w) => w.id !== form.walletId && (!w.isArchived || w.id === form.transferToWalletId))
              .map((w) => (
                <SelectItem key={w.id} value={w.id} disabled={w.isArchived}>
                  {w.name}
                </SelectItem>
              ))}
          </SelectContent>
          </Select>
        </div>
      )}

      {typeTab !== "transfer" && (
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select
            value={form.categoryId}
            onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori...">
                {selectedCategoryLabel || "Pilih kategori"}
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

      <div className="space-y-1.5">
        <Label htmlFor="tx-note">Catatan (opsional)</Label>
        <Input
          id="tx-note"
          placeholder="Nama tagihan/langganan..."
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Simpan"}
      </Button>
    </form>
  );
}
