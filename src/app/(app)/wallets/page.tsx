import { getWallets } from "@/actions/wallets";
import { WalletsClient } from "./_client";

export default async function WalletsPage() {
  const wallets = await getWallets();
  return <WalletsClient initialWallets={wallets} />;
}
