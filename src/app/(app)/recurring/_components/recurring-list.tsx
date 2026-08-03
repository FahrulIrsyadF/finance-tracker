"use client";

import { useState, useTransition } from "react";
import { deleteRecurringTransaction, toggleRecurringTransaction } from "@/actions/recurring";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Edit2, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function RecurringList({ items }: { items: any[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      await deleteRecurringTransaction(deletingId);
      setDeletingId(null);
      router.refresh();
    });
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    setLoading(id);
    await toggleRecurringTransaction(id, !currentActive);
    setLoading(null);
    router.refresh();
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground border rounded-xl bg-card">
        <p className="text-sm">Belum ada transaksi rutin.</p>
        <p className="text-xs mt-1">Ketuk tombol + untuk membuat baru.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isExpense = item.type === "expense";
        const isIncome = item.type === "income";
        const freqLabel = item.frequency === 'daily' ? 'Harian' : item.frequency === 'weekly' ? 'Mingguan' : 'Bulanan';
        
        const IconComp = item.categoryIcon ? (LucideIcons as any)[item.categoryIcon] : null;

        return (
          <div key={item.id} className={cn("p-4 rounded-xl border bg-card transition-opacity", !item.isActive && "opacity-80")}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shrink-0"
                  style={{ backgroundColor: item.categoryColor || (item.type === 'transfer' ? '#94a3b8' : '#cbd5e1') }}
                >
                  {IconComp ? <IconComp className="h-5 w-5" /> : (item.type === 'transfer' ? '⇄' : '•')}
                </div>
                <div>
                  <h3 className="font-medium text-sm leading-none">{item.note || item.categoryName || 'Transfer'}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.walletName} {item.type === 'transfer' && ` ➔ ${item.transferToWalletName}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold text-sm",
                  isExpense ? "text-rose-600" : isIncome ? "text-emerald-600" : "text-slate-600"
                )}>
                  {isExpense ? "-" : isIncome ? "+" : ""}
                  {formatCurrency(item.amount)}
                </p>
                <div className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded-full mt-1 font-medium">
                  {freqLabel}
                </div>
              </div>
            </div>

            <div className={cn("bg-secondary/50 rounded-lg p-2.5 flex justify-between items-center text-xs mb-3 transition-opacity", !item.isActive && "opacity-60")}>
              <span className="text-muted-foreground">Eksekusi Berikutnya:</span>
              <span className="font-medium">{format(new Date(item.nextProcessedDate), "dd MMM yyyy", { locale: localeId })}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={item.isActive} 
                  onCheckedChange={() => handleToggle(item.id, item.isActive)}
                  disabled={loading === item.id}
                />
                <span className={cn("text-xs font-medium", item.isActive ? "text-emerald-600" : "text-muted-foreground")}>
                  {item.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" nativeButton={false} render={<Link href={`/recurring/${item.id}`} />}>
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  disabled={pending}
                  onClick={() => setDeletingId(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      <Dialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <DialogContent className="max-w-xs mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Hapus Transaksi Rutin?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan.
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
