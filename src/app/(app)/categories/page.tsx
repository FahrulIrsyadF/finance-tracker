import { getCategories } from "@/actions/categories";
import { CategoriesClient } from "./_client";

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient initialCategories={categories} />;
}
