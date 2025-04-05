"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OrdersChartProps {
  data: {
    daily: Array<{ date: string; count: number; status: string }>;
    weekly: Array<{ date: string; count: number; status: string }>;
    monthly: Array<{ date: string; count: number; status: string }>;
  };
}

export function OrdersChart({ data }: OrdersChartProps) {
  const chartData = data?.daily?.map((item) => ({
    name: new Date(item.date).toLocaleDateString(),
    orders: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
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
        />
        <Tooltip />
        <Bar
          dataKey="orders"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
