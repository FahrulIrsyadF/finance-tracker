import { getBudgets } from "@/actions/budgets";
import { getCategories } from "@/actions/categories";
import { BudgetList } from "./_components/budget-list";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const budgets = await getBudgets();
  const categories = await getCategories("expense"); // only expense categories for budgets usually

  return (
    <div className="flex flex-col h-full bg-background max-w-md mx-auto">
      <header className="px-4 py-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
        <h1 className="text-xl font-bold">Batas Anggaran</h1>
        <Button size="sm" nativeButton={false} render={<Link href="/budgets/new" />}>
          <Plus className="h-4 w-4" />
          Baru
        </Button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {budgets.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10">
            <p>Belum ada anggaran yang diatur.</p>
          </div>
        ) : (
          <BudgetList budgets={budgets} categories={categories} />
        )}
      </main>
    </div>
  );
}
