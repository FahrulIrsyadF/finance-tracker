"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

import { ArrowLeft, CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";
import { previewPDFImport, saveImportedTransactions, ImportPreviewRow } from "@/actions/pdf-import";
import { formatCurrency } from "@/lib/utils";

export function PDFImportClient({ wallets, categories }: { wallets: any[]; categories: any[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  
  const [dialogConfig, setDialogConfig] = useState<{ open: boolean, title: string, description: string, isError: boolean }>({
    open: false, title: "", description: "", isError: false
  });

  const showAlert = (title: string, description: string = "", isError: boolean = false) => {
    setDialogConfig({ open: true, title, description, isError });
  };

  const activeWallets = wallets.filter((w) => !w.isArchived);
  
  const [file, setFile] = useState<File | null>(null);
  const [walletId, setWalletId] = useState(activeWallets[0]?.id || "");
  
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([]);
  const [bankDetected, setBankDetected] = useState("");

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return showAlert("File Kosong", "Pilih file PDF terlebih dahulu", true);
    if (!walletId) return showAlert("Wallet Kosong", "Pilih wallet tujuan", true);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const result = await previewPDFImport(formData, walletId);
        setBankDetected(result.bank);
        setPreviewData(result.preview);
        showAlert("Sukses Ekstrak", `Berhasil mengekstrak ${result.preview.length} transaksi`);
      } catch (error: any) {
        showAlert("Gagal memproses PDF", error.message, true);
      }
    });
  };

  const handleSave = async () => {
    const selectedTxs = previewData.filter(t => t.selected);
    if (selectedTxs.length === 0) return showAlert("Pilih Transaksi", "Tidak ada transaksi yang dipilih", true);

    setSaving(true);
    try {
      const count = await saveImportedTransactions(walletId, selectedTxs);
      showAlert("Sukses!", `${count} transaksi berhasil disimpan.`);
      // Delay navigation a bit to let the user see the success message
      setTimeout(() => router.push("/transactions"), 1500);
    } catch (error: any) {
      showAlert("Gagal menyimpan", error.message, true);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setPreviewData(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const changeCategory = (id: string, categoryId: string | null | undefined) => {
    setPreviewData(prev => prev.map(t => t.id === id ? { ...t, categoryId: categoryId || undefined } : t));
  };

  const changeNote = (id: string, note: string) => {
    setPreviewData(prev => prev.map(t => t.id === id ? { ...t, note } : t));
  };

  if (previewData.length > 0) {
    const selectedCount = previewData.filter(t => t.selected).length;
    return (
      <div className="px-4 pt-4 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setPreviewData([])}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Review Import ({bankDetected})</h1>
            <p className="text-sm text-muted-foreground">{selectedCount} dari {previewData.length} transaksi dipilih</p>
          </div>
        </div>

        <div className="space-y-4">
          {previewData.map((tx) => (
            <div key={tx.id} className={`p-4 rounded-xl border ${tx.selected ? "bg-card" : "bg-muted/30 opacity-60"} transition-all`}>
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={tx.selected} 
                  onChange={() => toggleSelect(tx.id)}
                  className="mt-1.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                      <p className="font-medium text-sm leading-tight mt-0.5">{tx.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${tx.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                      {tx.status === "duplicate" && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 mt-1">
                          Mungkin Duplikat
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {tx.selected && (
                    <div className="space-y-1.5">
                      <Input
                        value={tx.note}
                        onChange={(e) => changeNote(tx.id, e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Nama transaksi..."
                      />
                      <Select value={tx.categoryId || "uncategorized"} onValueChange={(v) => changeCategory(tx.id, v === "uncategorized" ? "" : v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pilih Kategori">
                            {categories.find(c => c.id === tx.categoryId)?.name || "-- Tanpa Kategori --"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized">-- Tanpa Kategori --</SelectItem>
                          {categories.filter(c => c.type === tx.type).map(c => (
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

        <div className="sticky bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t z-10 flex justify-end">
          <Button onClick={handleSave} disabled={saving || selectedCount === 0} className="w-full sm:w-auto">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan {selectedCount} Transaksi
          </Button>
        </div>
        
        <Dialog open={dialogConfig.open} onOpenChange={(v) => setDialogConfig(prev => ({ ...prev, open: v }))}>
          <DialogContent className="max-w-sm rounded-xl">
            <DialogHeader>
              <DialogTitle className={dialogConfig.isError ? "text-rose-600" : ""}>
                {dialogConfig.title}
              </DialogTitle>
              <DialogDescription>
                {dialogConfig.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button onClick={() => setDialogConfig(prev => ({ ...prev, open: false }))}>Tutup</Button>
            </DialogFooter>
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
        <h1 className="text-xl font-bold">Import E-Statement</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Upload PDF
          </CardTitle>
          <CardDescription>
            Saat ini mendukung E-Statement dari Bank BCA, Bank Jago, dan Bank BRI (BRImo).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="space-y-2">
              <Label>Wallet Tujuan</Label>
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih wallet...">
                    {activeWallets.find(w => w.id === walletId)?.name || "Pilih wallet..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeWallets.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Transaksi yang di-import akan dimasukkan ke wallet ini. Saldo wallet akan otomatis disesuaikan.
              </p>
            </div>

            <div className="space-y-2">
              <Label>File E-Statement (.pdf)</Label>
              <Input 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                <><UploadCloud className="mr-2 h-4 w-4" /> Upload & Preview</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Dialog open={dialogConfig.open} onOpenChange={(v) => setDialogConfig(prev => ({ ...prev, open: v }))}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className={dialogConfig.isError ? "text-rose-600" : ""}>
              {dialogConfig.title}
            </DialogTitle>
            <DialogDescription>
              {dialogConfig.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => setDialogConfig(prev => ({ ...prev, open: false }))}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
