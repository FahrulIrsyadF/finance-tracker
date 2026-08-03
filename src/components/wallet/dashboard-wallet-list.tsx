"use client";

import { useState } from "react";
import { WalletDetailDialog } from "@/components/wallet/wallet-detail-dialog";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

type WalletRow = {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  currentBalance: number;
  color: string | null;
  icon: string | null;
  isArchived: boolean;
};

export function DashboardWalletList({ wallets }: { wallets: WalletRow[] }) {
  const [detailWallet, setDetailWallet] = useState<WalletRow | null>(null);

  if (wallets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Belum ada wallet aktif. Tambah dulu!
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            onClick={() => setDetailWallet(wallet)}
            className="flex items-center justify-between p-3 rounded-xl border bg-card cursor-pointer hover:bg-muted/40 active:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: wallet.color ?? "#6B7280" }}
              >
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">{wallet.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
              </div>
            </div>
            <p className="text-sm font-semibold">{formatCurrency(wallet.currentBalance)}</p>
          </div>
        ))}
      </div>

      <WalletDetailDialog
        wallet={detailWallet}
        open={!!detailWallet}
        onClose={() => setDetailWallet(null)}
      />
    </>
  );
}
