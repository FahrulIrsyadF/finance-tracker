import { getWallets } from "@/actions/wallets";
import { getCategories } from "@/actions/categories";
import { PDFImportClient } from "./_client";

export default async function PDFImportPage() {
  const wallets = await getWallets();
  const categories = await getCategories();

  return (
    <div className="pb-24">
      <PDFImportClient wallets={wallets} categories={categories} />
    </div>
  );
}
