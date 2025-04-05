"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  updateCustomerRole,
  deleteCustomer,
} from "@/store/slices/customerSlice";

interface Customer {
  id: string;
  name: string;
  email: string;
  role: string;
  orders: any[];
  reviews: any[];
  createdAt: string;
}

function CustomerActions({ customer }: { customer: Customer }) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() =>
            dispatch(
              updateCustomerRole({
                id: customer.id,
                role: customer.role === "ADMIN" ? "USER" : "ADMIN",
              })
            )
          }
        >
          {customer.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => dispatch(deleteCustomer(customer.id))}
        >
          Delete Customer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={role === "ADMIN" ? "destructive" : "secondary"}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "orders",
    header: "Orders",
    cell: ({ row }) => {
      const orders = row.getValue("orders") as any[];
      return orders?.length || 0;
    },
  },
  {
    accessorKey: "reviews",
    header: "Reviews",
    cell: ({ row }) => {
      const reviews = row.getValue("reviews") as any[];
      return reviews?.length || 0;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      return new Date(row.getValue("createdAt")).toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CustomerActions customer={row.original} />,
  },
];
