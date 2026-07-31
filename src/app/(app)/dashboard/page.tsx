import { getWallets } from "@/actions/wallets";
import { getTransactions } from "@/actions/transactions";
import { getCategories } from "@/actions/categories";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

// Get current month date range
function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export default async function DashboardPage() {
  const [walletsData, categories] = await Promise.all([
    getWallets(),
    getCategories(),
  ]);

  const { start, end } = getMonthRange();
  const monthlyTx = await getTransactions({ startDate: start, endDate: end });

  const activeWallets = walletsData.filter(w => !w.isArchived);
  const totalBalance = activeWallets.reduce((sum, w) => sum + w.currentBalance, 0);
  const monthlyIncome = monthlyTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpense = monthlyTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTx = monthlyTx.slice(0, 5);
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <div className="px-4 pt-6 pb-4 max-w-md mx-auto space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Total Saldo</p>
        <h1 className="text-3xl font-bold tracking-tight">{formatCurrency(totalBalance)}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Pemasukan Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-lg font-semibold text-emerald-600">{formatCurrency(monthlyIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              Pengeluaran Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-lg font-semibold text-rose-600">{formatCurrency(monthlyExpense)}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Wallet</h2>
        <div className="space-y-2">
          {activeWallets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada wallet aktif. Tambah dulu!</p>
          ) : (
            activeWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-card"
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
            ))
          )}
        </div>
      </div>

      {recentTx.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Transaksi Terbaru</h2>
          <div className="space-y-2">
            {recentTx.map((tx) => {
              const cat = tx.categoryId ? categoryMap[tx.categoryId] : null;
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                  <div>
                    <p className="text-sm font-medium">{tx.note ?? cat?.name ?? "Transaksi"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      {cat && ` · ${cat.name}`}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === "income" ? "text-emerald-600" : tx.type === "expense" ? "text-rose-600" : "text-muted-foreground"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
