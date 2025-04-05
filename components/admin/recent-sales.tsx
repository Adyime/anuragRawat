"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface RecentSalesProps {
  orders: {
    id: string;
    total: number;
    user: {
      name: string | null;
      email: string;
    };
    createdAt: string;
  }[];
}

export function RecentSales({ orders }: RecentSalesProps) {
  return (
    <div className="space-y-8">
      {orders?.map((order) => (
        <div key={order.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {order.user.name?.[0]?.toUpperCase() ||
                order.user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {order.user.name || order.user.email}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(order.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div className="ml-auto font-medium">
            +₹{order.total.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
