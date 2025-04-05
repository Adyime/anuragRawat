"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart,
  BookOpen,
  Gift,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    color: "text-sky-500",
  },
  {
    label: "Analytics",
    icon: BarChart,
    href: "/admin/analytics",
    color: "text-violet-500",
  },
  {
    label: "Products",
    icon: Package,
    href: "/admin/products",
    color: "text-pink-700",
  },
  {
    label: "Categories",
    icon: BookOpen,
    href: "/admin/categories",
    color: "text-orange-700",
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    href: "/admin/orders",
    color: "text-green-700",
  },
  {
    label: "Customers",
    icon: Users,
    href: "/admin/customers",
    color: "text-teal-700",
  },
  {
    label: "Reviews",
    icon: MessageSquare,
    href: "/admin/reviews",
    color: "text-yellow-700",
  },
  {
    label: "Coupons",
    icon: Gift,
    href: "/admin/coupons",
    color: "text-rose-700",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-secondary/10 text-secondary-foreground">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                pathname === route.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}