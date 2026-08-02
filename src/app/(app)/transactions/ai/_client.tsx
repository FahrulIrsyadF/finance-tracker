"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { parseAITransactionsAction, saveAITransactions, AIPreviewRow } from "@/actions/ai-parse";
import { formatCurrency, cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Sparkles, Zap, Bot } from "lucide-react";
import { useGeminiQuota } from "@/hooks/use-gemini-quota";
import { GEMINI_MODELS, GeminiModelId } from "@/lib/gemini";

const EXAMPLE_PROMPTS = [
  "kemarin beli kopi 25rb, bayar parkir 5k",
  "tadi malam makan mie ayam 20 ribu, siang beli indomaret 47k",
  "gajian bulan ini 5 juta masuk",
];

export function AIInputClient({ wallets, categories }: { wallets: any[]; categories: any[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeWallets = wallets.filter((w) => !w.isArchived);
  const [modelId, setModelId] = useState<GeminiModelId>(GEMINI_MODELS[0].id);
  const quota = useGeminiQuota(modelId);
  const isQuotaExhausted = quota.rpmExhausted || quota.rpdExhausted;
  const [walletId, setWalletId] = useState(activeWallets[0]?.id || "");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<AIPreviewRow[]>([]);

  const [dialog, setDialog] = useState<{ open: boolean; title: string; description: string; isError: boolean }>({
    open: false, title: "", description: "", isError: false,
  });

  const showDialog = (title: string, description: string, isError = false) => {
    setDialog({ open: true, title, description, isError });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleParse = () => {
    if (!text.trim()) return showDialog("Input Kosong", "Tulis dulu transaksimu ya!", true);
    if (!walletId) return showDialog("Pilih Wallet", "Pilih wallet tujuan terlebih dahulu.", true);
    if (quota.rpdExhausted) return showDialog("Kuota Harian Habis", `Kamu sudah menggunakan ${quota.RPD_LIMIT} request hari ini. Coba lagi besok.`, true);
    if (quota.rpmExhausted) return showDialog("Terlalu Cepat", `Tunggu ${quota.msTilRPMReset} detik lagi ya, kuota per menit sedang penuh.`, true);

    startTransition(async () => {
      try {
        const result = await parseAITransactionsAction(text, modelId);
        quota.recordUsage();
        setPreview(result);
      } catch (err: any) {
        showDialog("Gagal Parse", err.message || "Terjadi kesalahan.", true);
      }
    });
  };

  const handleSave = async () => {
    const selected = preview.filter((t) => t.selected);
    if (selected.length === 0) return showDialog("Tidak Ada yang Dipilih", "Centang minimal satu transaksi.", true);

    setSaving(true);
    try {
      const count = await saveAITransactions(walletId, selected);
      showDialog("Sukses!", `${count} transaksi berhasil disimpan.`);
      setTimeout(() => router.push("/transactions"), 1500);
    } catch (err: any) {
      showDialog("Gagal Simpan", err.message || "Terjadi kesalahan.", true);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => setPreview((p) => p.map((t) => t.id === id ? { ...t, selected: !t.selected } : t));
  const changeNote = (id: string, note: string) => setPreview((p) => p.map((t) => t.id === id ? { ...t, note } : t));
  const changeAmount = (id: string, amount: number) => setPreview((p) => p.map((t) => t.id === id ? { ...t, amount } : t));
  const changeDate = (id: string, date: string) => setPreview((p) => p.map((t) => t.id === id ? { ...t, date } : t));
  const changeCategory = (id: string, categoryId: string) => setPreview((p) => p.map((t) => t.id === id ? { ...t, categoryId: categoryId === "uncategorized" ? undefined : categoryId } : t));

  if (preview.length > 0) {
    const selectedCount = preview.filter((t) => t.selected).length;
    return (
      <div className="px-4 pt-4 max-w-2xl mx-auto space-y-4 pb-32">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setPreview([])}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Review AI Input</h1>
            <p className="text-sm text-muted-foreground">{selectedCount} dari {preview.length} transaksi dipilih</p>
          </div>
        </div>

        <div className="space-y-3">
          {preview.map((tx) => (
            <div key={tx.id} className={`p-4 rounded-xl border transition-all ${tx.selected ? "bg-card" : "bg-muted/30 opacity-60"}`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={tx.selected}
                  onChange={() => toggleSelect(tx.id)}
                  className="mt-1.5 h-4 w-4 rounded border-gray-300 accent-primary"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${tx.type === "income" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"}`}>
                      {tx.type === "income" ? "Pemasukan" : "Pengeluaran"}
                    </span>
                    <p className={`font-bold text-sm ${tx.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                  </div>

                  {tx.selected && (
                    <div className="space-y-1.5">
                      {/* Note */}
                      <Input
                        value={tx.note}
                        onChange={(e) => changeNote(tx.id, e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Nama transaksi..."
                      />
                      {/* Date & Amount row */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          type="date"
                          value={tx.date}
                          onChange={(e) => changeDate(tx.id, e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Input
                          type="number"
                          value={tx.amount}
                          onChange={(e) => changeAmount(tx.id, parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                          min={0}
                        />
                      </div>
                      {/* Category */}
                      <Select value={tx.categoryId || "uncategorized"} onValueChange={(v) => changeCategory(tx.id, v ?? "uncategorized")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue>
                            {categories.find((c) => c.id === tx.categoryId)?.name || "-- Tanpa Kategori --"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized">-- Tanpa Kategori --</SelectItem>
                          {categories.filter((c) => c.type === tx.type).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/90 backdrop-blur border-t z-10">
          <Button onClick={handleSave} disabled={saving || selectedCount === 0} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan {selectedCount} Transaksi
          </Button>
        </div>

        <Dialog open={dialog.open} onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}>
          <DialogContent className="max-w-sm rounded-xl">
            <DialogHeader>
              <DialogTitle className={dialog.isError ? "text-rose-600" : ""}>{dialog.title}</DialogTitle>
              <DialogDescription>{dialog.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter><Button onClick={() => setDialog((d) => ({ ...d, open: false }))}>Tutup</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">AI Input</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Catat Transaksi dengan AI
          </CardTitle>
          <CardDescription>
            Ketik sesuka hati, Gemini akan mem-parse-nya otomatis. Mendukung bahasa gaul, singkatan nominal (rb, k, jt), dan tanggal relatif (kemarin, tadi pagi, dll).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wallet Tujuan</Label>
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger>
                  <SelectValue>
                    {activeWallets.find((w) => w.id === walletId)?.name || "Pilih wallet..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeWallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Model AI</Label>
              <Select value={modelId} onValueChange={(v) => setModelId(v as GeminiModelId)}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5" />
                      {GEMINI_MODELS.find(m => m.id === modelId)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GEMINI_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ceritakan transaksimu</Label>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Contoh: kemarin beli kopi 25rb, tadi pagi bayar parkir 5k..."
              className="w-full min-h-[100px] resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleParse();
                }
              }}
            />
            <p className="text-[10px] text-muted-foreground">Ctrl+Enter untuk parse langsung</p>
          </div>

          {/* Example prompts */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Contoh input</Label>
            <div className="flex flex-col gap-1.5">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setText(p)}
                  className="text-left text-xs px-3 py-1.5 rounded-lg border border-dashed text-muted-foreground hover:bg-muted transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Quota indicator */}
          <div className="space-y-2 rounded-xl border p-3 bg-muted/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Kuota AI</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Per Menit (RPM)</span>
                <span className={cn("font-medium", quota.remainingRPM <= 3 ? "text-rose-500" : "text-emerald-600")}>
                  {quota.remainingRPM}/{quota.RPM_LIMIT}
                  {quota.rpmExhausted && ` — reset ${quota.msTilRPMReset}d`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", quota.remainingRPM <= 3 ? "bg-rose-500" : "bg-emerald-500")}
                  style={{ width: `${(quota.remainingRPM / quota.RPM_LIMIT) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Per Hari (RPD)</span>
                <span className={cn("font-medium", quota.remainingRPD <= 50 ? "text-amber-500" : quota.rpdExhausted ? "text-rose-500" : "text-emerald-600")}>
                  {quota.remainingRPD}/{quota.RPD_LIMIT}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", quota.rpdExhausted ? "bg-rose-500" : quota.remainingRPD <= 50 ? "bg-amber-400" : "bg-emerald-500")}
                  style={{ width: `${(quota.remainingRPD / quota.RPD_LIMIT) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleParse} disabled={pending || isQuotaExhausted} className="w-full gap-2">
            {pending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Parse dengan AI</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className={dialog.isError ? "text-rose-600" : ""}>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => setDialog((d) => ({ ...d, open: false }))}>Tutup</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
