import { getInsightData } from "@/actions/insights";
import { getWallets } from "@/actions/wallets";
import { InsightsClient } from "./_client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, setDate } from "date-fns";

export const metadata = {
  title: "Insight",
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const rangeType = (params.range as string) || "monthly";
  const dateParam = (params.date as string) || new Date().toISOString().split("T")[0];
  const startDayParam = parseInt((params.startDay as string) || "1", 10);
  const walletIdParam = (params.walletId as string) || undefined;
  
  const baseDate = new Date(dateParam);
  let from = new Date();
  let to = new Date();
  let groupBy: "day" | "month" = "day";

  if (rangeType === "weekly") {
    from = startOfWeek(baseDate, { weekStartsOn: 1 });
    to = endOfWeek(baseDate, { weekStartsOn: 1 });
    groupBy = "day";
  } else if (rangeType === "yearly") {
    from = startOfYear(baseDate);
    to = endOfYear(baseDate);
    groupBy = "month";
  } else {
    groupBy = "day";
    if (startDayParam === 1) {
      from = startOfMonth(baseDate);
      to = endOfMonth(baseDate);
    } else {
      from = setDate(baseDate, startDayParam);
      const nextMonth = addMonths(from, 1);
      to = setDate(nextMonth, startDayParam - 1);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
    }
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const [data, walletsData] = await Promise.all([
    getInsightData({ from, to }, groupBy, walletIdParam),
    getWallets(),
  ]);

  const activeWallets = walletsData.filter((w) => !w.isArchived);

  return (
    <InsightsClient
      initialData={data}
      currentRange={rangeType as "weekly" | "monthly" | "yearly"}
      currentDate={baseDate.toISOString().split("T")[0]}
      currentStartDay={startDayParam}
      currentWalletId={walletIdParam}
      fromLabel={from.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
      toLabel={to.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
      wallets={activeWallets.map((w) => ({ id: w.id, name: w.name, color: w.color }))}
    />
  );
}
