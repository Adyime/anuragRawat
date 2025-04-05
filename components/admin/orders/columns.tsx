"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { DataTableRowActions } from "./data-table-row-actions";
import { format } from "date-fns";
import { DataTableColumnHeader } from "../products/data-table-column-header";

export type Order = {
  id: string;
  total: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  address: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    isEbook: boolean;
    product: {
      title: string;
    };
  }[];
  coupon?: {
    code: string;
    discountPercent: number;
  };
};

const statusColors = {
  PENDING: "yellow",
  PROCESSING: "blue",
  SHIPPED: "purple",
  DELIVERED: "green",
  CANCELLED: "red",
} as const;

const paymentStatusColors = {
  PENDING: "yellow",
  PAID: "green",
  FAILED: "red",
} as const;

export const columns: ColumnDef<Order>[] = [
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
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order ID" />
    ),
    cell: ({ row }) => <span className="font-mono">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const user = row.getValue("user") as Order["user"];
      return (
        <div>
          <p className="font-medium">{user.name || user.email}</p>
          {user.name && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"));
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);

      return <span className="font-medium">{formatted}</span>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Order["status"];
      return (
        <Badge
          variant="outline"
          className={`bg-${statusColors[status]}-50 text-${statusColors[status]}-700 border-${statusColors[status]}-200`}
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("paymentStatus") as Order["paymentStatus"];
      return (
        <Badge
          variant="outline"
          className={`bg-${paymentStatusColors[status]}-50 text-${paymentStatusColors[status]}-700 border-${paymentStatusColors[status]}-200`}
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-muted-foreground">
          {format(new Date(row.getValue("createdAt")), "PPp")}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
