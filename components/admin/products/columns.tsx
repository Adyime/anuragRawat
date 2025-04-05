"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export type Product = {
  id: string;
  title: string;
  price: number;
  discountedPrice?: number;
  isEbook: boolean;
  ebookPrice?: number;
  ebookDiscounted?: number;
  isFree: boolean;
  language: string;
  stock: number;
  category: {
    id: string;
    name: string;
  };
  subcategory?: {
    id: string;
    name: string;
  };
};

export const columns: ColumnDef<Product>[] = [
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
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const discountedPrice = row.original.discountedPrice;
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(price);

      return (
        <div className="font-medium">
          {discountedPrice ? (
            <div>
              <span className="text-muted-foreground line-through">
                {formatted}
              </span>
              <span className="ml-2">₹{discountedPrice.toLocaleString()}</span>
            </div>
          ) : (
            formatted
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
  },
  {
    accessorKey: "language",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Language" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("language")}</Badge>
    ),
  },
  {
    accessorKey: "isEbook",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const isEbook = row.getValue("isEbook");
      return (
        <Badge variant={isEbook ? "default" : "secondary"}>
          {isEbook ? "E-Book" : "Physical"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
