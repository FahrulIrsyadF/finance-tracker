"use client";

import { useState, useTransition } from "react";
import { upsertBudget, BudgetFormData } from "@/actions/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

export function BudgetForm({ 
  categories, 
  initialData, 
  isNew 
}: { 
  categories: any[], 
  initialData?: any, 
  isNew: boolean 
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState<BudgetFormData>({
    categoryId: initialData?.categoryId ?? (categories.length > 0 ? categories[0].id : ""),
    amount: initialData?.amount ?? "",
    period: initialData?.period ?? "monthly",
  });

  const selectedCategoryName = categories.find((c) => c.id === form.categoryId)?.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.amount) return;

    startTransition(async () => {
      await upsertBudget({
        ...form,
        amount: Number(form.amount)
      });
      router.push("/budgets");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Kategori</Label>
        <Select
          disabled={!isNew}
          value={form.categoryId}
          onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori...">
              {selectedCategoryName}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Periode Anggaran</Label>
        <div className="flex rounded-xl overflow-hidden border">
          {(["daily", "weekly", "monthly"] as const).map((p) => {
            const labels = { daily: "Harian", weekly: "Mingguan", monthly: "Bulanan" };
            return (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, period: p }))}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  form.period === p
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
        <Label>Batas Anggaran (Rp)</Label>
        <Input
          type="number"
          inputMode="decimal"
          required
          min={1}
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value as any }))}
          className="text-lg h-12"
          placeholder="0"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan Anggaran"}
      </Button>
    </form>
  );
}
