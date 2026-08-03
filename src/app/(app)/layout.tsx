import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BottomNav } from "@/components/layout/bottom-nav";

import { processRecurringTransactions } from "@/actions/recurring";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Process recurring transactions
  try {
    await processRecurringTransactions();
  } catch (e) {
    console.error("Failed to process recurring transactions:", e);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
