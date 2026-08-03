import { getBudgets } from "@/actions/budgets";
import { getCategories } from "@/actions/categories";
import { BudgetForm } from "../_components/budget-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BudgetEditPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  const isNew = categoryId === "new";
  
  const categories = await getCategories("expense");
  const budgets = await getBudgets();

  // If new, we filter out categories that already have budgets
  const usedCategoryIds = budgets.map(b => b.categoryId);
  const availableCategories = isNew 
    ? categories.filter(c => !usedCategoryIds.includes(c.id))
    : categories;

  let initialData = undefined;
  if (!isNew) {
    const b = budgets.find(b => b.categoryId === categoryId);
    if (!b) notFound();
    initialData = {
      categoryId: b.categoryId,
      amount: b.amount,
      period: b.period,
    };
  }

  return (
    <div className="flex flex-col h-full bg-background max-w-md mx-auto w-full">
      <header className="px-4 py-4 border-b flex items-center gap-3 sticky top-0 bg-background z-10">
        <Link href="/budgets" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{isNew ? "Tambah Anggaran" : "Edit Anggaran"}</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {isNew && availableCategories.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10">
            <p>Semua kategori pengeluaran sudah memiliki anggaran.</p>
          </div>
        ) : (
          <BudgetForm 
            categories={availableCategories} 
            initialData={initialData} 
            isNew={isNew} 
          />
        )}
      </main>
    </div>
  );
}
