"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { CategoryDataPoint } from "@/actions/insights";

interface Props {
  data: CategoryDataPoint[];
}

export function InsightDonutChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border rounded-xl bg-card text-muted-foreground text-sm">
        Belum ada data
      </div>
    );
  }

  const total = data.reduce((s, item) => s + item.value, 0);

  return (
    <div className="border rounded-xl bg-card p-4 space-y-4">
      <div className="h-48 relative w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [typeof value === "number" ? formatCurrency(value) : value, undefined]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-bold text-sm">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatCurrency(item.value)}</span>
              <span className="text-xs text-muted-foreground w-8 text-right">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
