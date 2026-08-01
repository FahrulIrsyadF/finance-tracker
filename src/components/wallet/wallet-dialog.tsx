"use client";

import { useState, useTransition } from "react";
import { createWallet, updateWallet, deleteWallet, WalletFormData, WalletType } from "@/actions/wallets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface WalletDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: {
    id: string;
    name: string;
    type: string;
    initialBalance: number;
    color: string | null;
    icon: string | null;
  };
}

const WALLET_COLORS = [
  "#3B82F6", "#10B981", "#F97316", "#8B5CF6",
  "#EF4444", "#EAB308", "#06B6D4", "#EC4899",
];

const WALLET_TYPES: { value: WalletType; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "credit", label: "Kartu Kredit" },
];

export function WalletDialog({ open, onClose, initial }: WalletDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState<WalletFormData>({
    name: initial?.name ?? "",
    type: (initial?.type as WalletType) ?? "cash",
    initialBalance: initial?.initialBalance ?? 0,
    color: initial?.color ?? WALLET_COLORS[0],
    icon: "Wallet",
  });

  const isEdit = !!initial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (isEdit) {
        await updateWallet(initial.id, form);
      } else {
        await createWallet(form);
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Wallet" : "Tambah Wallet"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet-name">Nama Wallet</Label>
            <Input
              id="wallet-name"
              placeholder="Contoh: BCA Tabungan"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as WalletType }))}
            >
              <SelectTrigger id="wallet-type">
                <SelectValue>
                  {WALLET_TYPES.find((t) => t.value === form.type)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {WALLET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="wallet-balance">Saldo Awal</Label>
              <Input
                id="wallet-balance"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.initialBalance || ""}
                onChange={(e) => setForm((f) => ({ ...f, initialBalance: Number(e.target.value) }))}
                min={0}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Warna</Label>
            <div className="flex gap-2 flex-wrap">
              {WALLET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    form.color === color ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
