"use client";

import { Card } from "@/components/ui/card";
import { Overview } from "@/components/admin/overview";
import { RecentSales } from "@/components/admin/recent-sales";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import {
  CircleDollarSign,
  Package,
  ShoppingCart,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: {
    id: string;
    total: number;
    user: {
      name: string | null;
      email: string;
    };
    createdAt: string;
  }[];
  salesOverview: {
    date: string;
    revenue: number;
  }[];
}

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    totalRevenue
    totalOrders
    totalProducts
    totalCustomers
    recentOrders {
      id
      total
      user {
        name
        email
      }
      createdAt
    }
    salesOverview {
      date
      revenue
    }
  }
`;

export default function AdminDashboard() {
  const { data, loading, error } = useQuery<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    recentOrders: DashboardStats["recentOrders"];
    salesOverview: DashboardStats["salesOverview"];
  }>(GET_DASHBOARD_STATS, {
    pollInterval: 30000, // Poll every 30 seconds to keep data fresh
    fetchPolicy: "cache-and-network",
  });

  // Handle loading state
  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive text-lg">
            Error loading dashboard data
          </p>
          <p className="text-muted-foreground">{error.message}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If we have no data, show empty state
  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">No data available</p>
          <p className="text-muted-foreground">Unable to load dashboard data</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${data.totalRevenue?.toLocaleString() ?? 0}`,
      icon: CircleDollarSign,
    },
    {
      title: "Total Orders",
      value: data.totalOrders ?? 0,
      icon: ShoppingCart,
    },
    {
      title: "Total Products",
      value: data.totalProducts ?? 0,
      icon: Package,
    },
    {
      title: "Total Customers",
      value: data.totalCustomers ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center gap-4">
              <stat.icon className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 p-6">
          <h3 className="text-xl font-semibold mb-4">Overview</h3>
          <Overview data={data.salesOverview ?? []} />
        </Card>
        <Card className="col-span-3 p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Sales</h3>
          <RecentSales orders={data.recentOrders ?? []} />
        </Card>
      </div>
    </div>
  );
}
