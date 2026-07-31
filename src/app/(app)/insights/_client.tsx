"use client";

import { InsightBarChart } from "@/components/insights/bar-chart";
import { InsightDonutChart } from "@/components/insights/donut-chart";
import type { InsightData } from "@/actions/insights";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialData: InsightData;
  currentRange: "weekly" | "monthly" | "yearly";
  currentDate: string;
  currentStartDay: number;
  fromLabel: string;
  toLabel: string;
}

export function InsightsClient({
  initialData,
  currentRange,
  currentDate,
  currentStartDay,
  fromLabel,
  toLabel,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"income" | "expense">("expense");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startDayInput, setStartDayInput] = useState(String(currentStartDay));

  const navigate = (newRange: string, dateOffset: number = 0, newStartDay?: number) => {
    const base = new Date(currentDate);
    if (dateOffset !== 0) {
      if (newRange === "weekly") base.setDate(base.getDate() + dateOffset * 7);
      if (newRange === "monthly") base.setMonth(base.getMonth() + dateOffset);
      if (newRange === "yearly") base.setFullYear(base.getFullYear() + dateOffset);
    }
    
    const d = base.toISOString().split("T")[0];
    const sd = newStartDay !== undefined ? newStartDay : currentStartDay;
    router.push(`/insights?range=${newRange}&date=${d}&startDay=${sd}`);
  };

  const handleSaveSettings = () => {
    const val = parseInt(startDayInput, 10);
    if (val >= 1 && val <= 31) {
      navigate(currentRange, 0, val);
      setSettingsOpen(false);
    } else {
      alert("Tanggal mulai harus antara 1 dan 31");
    }
  };

  let displayLabel = "";
  const d = new Date(currentDate);
  if (currentRange === "weekly") displayLabel = `${fromLabel} - ${toLabel}`;
  else if (currentRange === "monthly") displayLabel = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  else if (currentRange === "yearly") displayLabel = d.getFullYear().toString();

  return (
    <div className="px-4 pt-6 pb-20 max-w-md mx-auto space-y-6">
      {/* Header & Settings */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Insight</h1>
        {currentRange === "monthly" && (
          <Button size="icon" variant="ghost" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border">
        {(["weekly", "monthly", "yearly"] as const).map((r) => (
          <button
            key={r}
            onClick={() => navigate(r)}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              currentRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {r === "weekly" ? "Mingguan" : r === "monthly" ? "Bulanan" : "Tahunan"}
          </button>
        ))}
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-card p-2 rounded-xl border">
        <Button size="icon" variant="ghost" onClick={() => navigate(currentRange, -1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-semibold text-sm">{displayLabel}</p>
          {currentRange === "monthly" && currentStartDay !== 1 && (
            <p className="text-[10px] text-muted-foreground">{fromLabel} - {toLabel}</p>
          )}
        </div>
        <Button size="icon" variant="ghost" onClick={() => navigate(currentRange, 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1">Pemasukan</p>
          <p className="font-bold text-emerald-600">{formatCurrency(initialData.totalIncome)}</p>
        </div>
        <div className="border rounded-xl p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1">Pengeluaran</p>
          <p className="font-bold text-rose-600">{formatCurrency(initialData.totalExpense)}</p>
        </div>
      </div>
      
      <div className="border rounded-xl p-4 bg-card text-center">
        <p className="text-xs text-muted-foreground mb-1">Arus Kas (Cash Flow)</p>
        <p className={cn("font-bold text-lg", initialData.cashFlow >= 0 ? "text-emerald-600" : "text-rose-600")}>
          {initialData.cashFlow >= 0 ? "+" : ""}{formatCurrency(initialData.cashFlow)}
        </p>
      </div>

      {/* Bar Chart */}
      <div className="space-y-3">
        <h2 className="font-bold">Arus Kas</h2>
        <InsightBarChart data={initialData.chartData} />
      </div>

      {/* Donut Chart with Income/Expense Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Kategori</h2>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={cn("px-3 py-1 text-xs font-medium", tab === "expense" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" : "bg-transparent text-muted-foreground hover:bg-muted")}
              onClick={() => setTab("expense")}
            >
              Pengeluaran
            </button>
            <button
              className={cn("px-3 py-1 text-xs font-medium", tab === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-transparent text-muted-foreground hover:bg-muted")}
              onClick={() => setTab("income")}
            >
              Pemasukan
            </button>
          </div>
        </div>
        <InsightDonutChart data={tab === "expense" ? initialData.expenseByCategory : initialData.incomeByCategory} />
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Pengaturan Laporan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tanggal Mulai (Bulanan)</Label>
              <p className="text-xs text-muted-foreground">
                Tentukan siklus bulananmu. Misalnya jika gajian setiap tanggal 25, maka laporan akan dihitung dari tgl 25 ke tgl 24 bulan berikutnya.
              </p>
              <Input 
                type="number" 
                min={1} 
                max={31} 
                value={startDayInput}
                onChange={(e) => setStartDayInput(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleSaveSettings}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
