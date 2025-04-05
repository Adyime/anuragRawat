"use client";

import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { OrdersChart } from "@/components/admin/analytics/orders-chart";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const GET_ANALYTICS = gql`
  query GetAnalytics {
    analytics {
      revenue {
        daily {
          date
          amount
        }
        weekly {
          date
          amount
        }
        monthly {
          date
          amount
        }
      }
      orders {
        daily {
          date
          count
          status
        }
        weekly {
          date
          count
          status
        }
        monthly {
          date
          count
          status
        }
      }
      topProducts {
        id
        title
        totalSales
        totalRevenue
      }
      topCategories {
        id
        name
        totalSales
        totalRevenue
      }
    }
  }
`;

export default function AnalyticsPage() {
  const { data, loading } = useQuery(GET_ANALYTICS);

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Detailed insights into your business performance
        </p>
      </div>

      <Tabs defaultValue="revenue" className="space-y-8">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today&apos;s Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹
                  {data?.analytics.revenue.daily[0]?.amount.toLocaleString() ||
                    0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "MMMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Weekly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹
                  {data?.analytics.revenue.weekly
                    .reduce((acc: number, curr: any) => acc + curr.amount, 0)
                    .toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹
                  {data?.analytics.revenue.monthly
                    .reduce((acc: number, curr: any) => acc + curr.amount, 0)
                    .toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "MMMM yyyy")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹
                  {Math.round(
                    data?.analytics.revenue.monthly.reduce(
                      (acc: number, curr: any) => acc + curr.amount,
                      0
                    ) /
                      data?.analytics.orders.monthly.reduce(
                        (acc: number, curr: any) => acc + curr.count,
                        0
                      )
                  ).toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <RevenueChart data={data?.analytics.revenue} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today&apos;s Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.analytics.orders.daily[0]?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "MMMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Weekly Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.analytics.orders.weekly.reduce(
                    (acc: number, curr: any) => acc + curr.count,
                    0
                  ) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.analytics.orders.monthly.reduce(
                    (acc: number, curr: any) => acc + curr.count,
                    0
                  ) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "MMMM yyyy")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Fulfillment Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    (data?.analytics.orders.monthly.filter(
                      (o: any) => o.status === "DELIVERED"
                    ).length /
                      data?.analytics.orders.monthly.length) *
                      100
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Orders Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <OrdersChart data={data?.analytics.orders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.analytics.topProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {product.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.totalSales} sales
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ₹{product.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.analytics.topCategories.map((category: any) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {category.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {category.totalSales} sales
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ₹{category.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
