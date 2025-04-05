"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number;
  maxDiscount: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  } | null;
};

export const columns: ColumnDef<Coupon>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => {
      const coupon = row.original;
      const now = new Date();

      // Helper function to parse date safely
      const parseDateSafely = (dateString: string) => {
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date;
          }
          console.warn("Invalid date:", dateString);
          return new Date(); // Fallback to current date
        } catch (error) {
          console.error("Error parsing date:", error);
          return new Date(); // Fallback to current date
        }
      };

      const startDate = parseDateSafely(coupon.startDate);
      const endDate = parseDateSafely(coupon.endDate);
      const isExpired = now > endDate;
      const isNotStarted = now < startDate;
      const isExhausted = coupon.usedCount >= coupon.usageLimit;

      type Status =
        | "active"
        | "inactive"
        | "expired"
        | "scheduled"
        | "exhausted";
      let status: Status = "active";
      if (!coupon.isActive) status = "inactive";
      else if (isExpired) status = "expired";
      else if (isNotStarted) status = "scheduled";
      else if (isExhausted) status = "exhausted";

      // Get status color classes
      const getStatusColorClasses = (status: Status) => {
        switch (status) {
          case "active":
            return "bg-green-50 text-green-700 border-green-200";
          case "inactive":
            return "bg-gray-50 text-gray-700 border-gray-200";
          case "expired":
            return "bg-red-50 text-red-700 border-red-200";
          case "scheduled":
            return "bg-blue-50 text-blue-700 border-blue-200";
          case "exhausted":
            return "bg-yellow-50 text-yellow-700 border-yellow-200";
        }
      };

      return (
        <div className="space-y-1">
          <span className="font-mono font-medium">{coupon.code}</span>
          <Badge variant="outline" className={getStatusColorClasses(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "discountPercent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Discount" />
    ),
    cell: ({ row }) => {
      const coupon = row.original;
      const formattedMaxDiscount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(coupon.maxDiscount);

      return (
        <div>
          <p className="font-medium">{coupon.discountPercent}% off</p>
          <p className="text-sm text-muted-foreground">
            Up to {formattedMaxDiscount}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      const coupon = row.original;
      return coupon.category ? (
        <Badge variant="outline">{coupon.category.name}</Badge>
      ) : (
        <span className="text-muted-foreground">All categories</span>
      );
    },
  },
  {
    accessorKey: "usageLimit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usage" />
    ),
    cell: ({ row }) => {
      const coupon = row.original;
      const percentage = (coupon.usedCount / coupon.usageLimit) * 100;
      return (
        <div>
          <p className="font-medium">
            {coupon.usedCount} / {coupon.usageLimit}
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage.toFixed(1)}% used
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ row }) => {
      const coupon = row.original;

      // Helper function to format date safely
      const formatDateSafely = (dateString: string) => {
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
          }
          console.warn("Invalid date:", dateString);
          return "Invalid Date";
        } catch (error) {
          console.error("Error formatting date:", error);
          return "Invalid Date";
        }
      };

      return (
        <div className="space-y-1">
          <p className="text-sm">From: {formatDateSafely(coupon.startDate)}</p>
          <p className="text-sm">To: {formatDateSafely(coupon.endDate)}</p>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
