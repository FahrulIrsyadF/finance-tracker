import { getWallets } from "@/actions/wallets";
import { getCategories } from "@/actions/categories";
import { AIInputClient } from "./_client";

export default async function AIInputPage() {
  const [wallets, categories] = await Promise.all([
    getWallets(),
    getCategories(),
  ]);

  return (
    <div className="pb-24">
      <AIInputClient wallets={wallets} categories={categories} />
    </div>
  );
}
