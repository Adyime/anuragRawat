"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueChartProps {
  data: {
    daily: Array<{ date: string; amount: number }>;
    weekly: Array<{ date: string; amount: number }>;
    monthly: Array<{ date: string; amount: number }>;
  };
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data?.daily?.map((item) => ({
    name: new Date(item.date).toLocaleDateString(),
    revenue: item.amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="currentColor"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
