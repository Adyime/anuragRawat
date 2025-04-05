"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { DataTable } from "@/components/admin/products/data-table";
import { columns } from "@/components/admin/products/columns";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { ProductDialog } from "@/components/admin/products/product-dialog";

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      title
      description
      price
      discountedPrice
      isEbook
      ebookPrice
      ebookDiscounted
      isFree
      language
      stock
      images
      pdfUrl
      category {
        id
        name
      }
      subcategory {
        id
        name
      }
    }
  }
`;

export default function ProductsPage() {
  const [open, setOpen] = useState(false);
  const { loading, error, data } = useQuery(GET_PRODUCTS);

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your physical books and ebooks
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <DataTable columns={columns} data={data?.products || []} />

      <ProductDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
