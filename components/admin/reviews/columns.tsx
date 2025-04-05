"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { DataTableRowActions } from "./data-table-row-actions";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "../products/data-table-column-header";

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  product: {
    id: string;
    title: string;
    images: string[];
  };
};

export const columns: ColumnDef<Review>[] = [
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
    accessorKey: "product",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      const product = row.getValue("product") as Review["product"];
      return (
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            {product.images[0] ? (
              <AvatarImage src={product.images[0]} alt={product.title} />
            ) : (
              <AvatarFallback>{product.title[0]}</AvatarFallback>
            )}
          </Avatar>
          <span className="font-medium">{product.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const user = row.getValue("user") as Review["user"];
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
    accessorKey: "rating",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rating" />
    ),
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number;
      return (
        <div className="font-medium">
          {rating} <span className="text-yellow-500">★</span>
        </div>
      );
    },
  },
  {
    accessorKey: "comment",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Comment" />
    ),
    cell: ({ row }) => {
      const comment = row.getValue("comment") as string;
      return comment ? (
        <span className="line-clamp-2 text-sm">{comment}</span>
      ) : (
        <span className="text-sm text-muted-foreground">No comment</span>
      );
    },
  },
  {
    accessorKey: "isApproved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isApproved = row.getValue("isApproved") as boolean;
      return (
        <Badge variant={isApproved ? "default" : "secondary"}>
          {isApproved ? "Approved" : "Pending"}
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
          {format(new Date(row.getValue("createdAt")), "PP")}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
