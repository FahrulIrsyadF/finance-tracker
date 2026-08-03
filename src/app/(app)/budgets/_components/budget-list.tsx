"use client";

import { useState, useTransition } from "react";
import { deleteBudget, getBudgets } from "@/actions/budgets";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import * as LucideIcons from "lucide-react";

// Since this is a client component, we take the initial data from server.
export function BudgetList({ budgets, categories }: { budgets: any[], categories: any[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      await deleteBudget(deletingId);
      setDeletingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {budgets.map((b) => {
        const isOver = b.remaining <= 0;
        const isWarning = b.percentage >= 80 && !isOver;
        const periodLabel = b.period === 'daily' ? 'Harian' : b.period === 'weekly' ? 'Mingguan' : 'Bulanan';
        
        const IconComp = b.categoryIcon ? (LucideIcons as any)[b.categoryIcon] : null;

        return (
          <div key={b.id} className="p-4 rounded-xl border bg-card">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: b.categoryColor || '#cbd5e1' }}
                >
                  {IconComp ? <IconComp className="h-4 w-4" /> : '•'}
                </div>
                <div>
                  <h3 className="font-medium text-sm leading-none">{b.categoryName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Limit: {formatCurrency(b.amount)} / {periodLabel}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" nativeButton={false} render={<Link href={`/budgets/${b.categoryId}`} />}>
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  disabled={pending}
                  onClick={() => setDeletingId(b.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span>Terpakai: {formatCurrency(b.spent)}</span>
                <span className={cn(
                  isOver ? "text-destructive" : isWarning ? "text-amber-500" : "text-emerald-500"
                )}>
                  Sisa: {formatCurrency(b.remaining)}
                </span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    isOver ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${b.percentage}%` }}
                />
              </div>
              {isOver && (
                <p className="text-[10px] text-destructive mt-1.5 font-medium">
                  Oops, pengeluaran melebihi anggaran!
                </p>
              )}
            </div>
          </div>
        );
      })}

      <Dialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Hapus Anggaran?</DialogTitle>
            <DialogDescription>
              Anggaran yang dihapus tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={pending}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={pending}
            >
              {pending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
