"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { DataTableRowActions } from "./data-table-row-actions";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "../products/data-table-column-header";

export type Customer = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  orders: {
    id: string;
    total: number;
    status: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    isApproved: boolean;
  }[];
};

export const columns: ColumnDef<Customer>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const email = row.original.email;
      const name = row.getValue("name") as string | null;

      return (
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>
              {name?.[0]?.toUpperCase() || email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{name || email}</p>
            {name && <p className="text-sm text-muted-foreground">{email}</p>}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
          {role}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "orders",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Orders" />
    ),
    cell: ({ row }) => {
      const orders = row.getValue("orders") as Customer["orders"];
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

      return (
        <div>
          <p className="font-medium">₹{totalSpent.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "reviews",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reviews" />
    ),
    cell: ({ row }) => {
      const reviews = row.getValue("reviews") as Customer["reviews"];
      const approvedReviews = reviews.filter((review) => review.isApproved);
      const avgRating = approvedReviews.length
        ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
          approvedReviews.length
        : 0;

      return (
        <div>
          <p className="font-medium">{avgRating.toFixed(1)} ★</p>
          <p className="text-sm text-muted-foreground">
            {approvedReviews.length} review
            {approvedReviews.length === 1 ? "" : "s"}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground">
          {format(new Date(row.getValue("createdAt")), "PP")}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
