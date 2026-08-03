"use client";

import { useState, useTransition } from "react";
import { createCategory, updateCategory, deleteCategory, CategoryFormData, CategoryType } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type CategoryRow = {
  id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
};

const CATEGORY_COLORS = [
  "#F97316", "#3B82F6", "#A855F7", "#EF4444", "#EAB308",
  "#6B7280", "#06B6D4", "#EC4899", "#10B981", "#8B5CF6",
];

export function CategoriesClient({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryRow | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const [error, setError] = useState("");

  const [form, setForm] = useState<CategoryFormData>({
    name: "",
    type: "expense",
    color: CATEGORY_COLORS[0],
    icon: "MoreHorizontal",
  });

  const filtered = initialCategories.filter((c) => c.type === activeTab);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", type: activeTab, color: CATEGORY_COLORS[0], icon: "MoreHorizontal" });
    setDialogOpen(true);
  };

  const openEdit = (c: CategoryRow) => {
    setEditTarget(c);
    setForm({
      name: c.name,
      type: c.type as CategoryType,
      color: c.color ?? CATEGORY_COLORS[0],
      icon: c.icon ?? "MoreHorizontal",
    });
    setDialogOpen(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteCategory(deleteTarget.id);
        setDeleteTarget(null);
        router.refresh();
      } catch (e: unknown) {
        if (e instanceof Error) setError(e.message);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editTarget) {
        await updateCategory(editTarget.id, form);
      } else {
        await createCategory(form);
      }
      setDialogOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="px-4 pt-6 max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Kategori</h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </div>

      {/* Tab */}
      <div className="flex rounded-xl overflow-hidden border">
        {(["expense", "income"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab === "expense" ? "Pengeluaran" : "Pemasukan"}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada kategori.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.color ?? "#6B7280" }}
                >
                  <Tag className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">{cat.name}</p>
                  {cat.isDefault && <p className="text-xs text-muted-foreground">Default</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {!cat.isDefault && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                    disabled={pending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Hapus Kategori?</DialogTitle>
            <div className="text-sm text-muted-foreground mt-2">
              Kategori "{deleteTarget?.name}" akan dihapus secara permanen.
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
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

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nama</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nama kategori"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as CategoryType }))}
              >
                <SelectTrigger id="cat-type">
                  <SelectValue>
                    {form.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map((color) => (
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
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : editTarget ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
