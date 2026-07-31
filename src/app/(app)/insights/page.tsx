import { getInsightData } from "@/actions/insights";
import { InsightsClient } from "./_client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, setDate } from "date-fns";

export const metadata = {
  title: "Insight — FinanceTracker",
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
  
  const baseDate = new Date(dateParam);
  let from = new Date();
  let to = new Date();
  let groupBy: "day" | "month" = "day";

  if (rangeType === "weekly") {
    // 7 days, week starts on Monday
    from = startOfWeek(baseDate, { weekStarts: 1 });
    to = endOfWeek(baseDate, { weekStarts: 1 });
    groupBy = "day";
  } else if (rangeType === "yearly") {
    from = startOfYear(baseDate);
    to = endOfYear(baseDate);
    groupBy = "month";
  } else {
    // monthly
    groupBy = "day";
    if (startDayParam === 1) {
      from = startOfMonth(baseDate);
      to = endOfMonth(baseDate);
    } else {
      // custom start date, e.g. 25.
      from = setDate(baseDate, startDayParam);
      // to is next month, one day before startDay
      const nextMonth = addMonths(from, 1);
      to = setDate(nextMonth, startDayParam - 1);
      // Adjust times
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
    }
  }

  // Ensure full day coverage
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const data = await getInsightData({ from, to }, groupBy);

  return (
    <InsightsClient
      initialData={data}
      currentRange={rangeType as "weekly" | "monthly" | "yearly"}
      currentDate={baseDate.toISOString().split("T")[0]}
      currentStartDay={startDayParam}
      fromLabel={from.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
      toLabel={to.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
    />
  );
}
