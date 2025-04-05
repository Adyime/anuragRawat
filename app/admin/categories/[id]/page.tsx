"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { SubcategoryDialog } from "@/components/admin/categories/subcategory-dialog";
import { SubcategoryCard } from "@/components/admin/categories/subcategory-card";

const GET_CATEGORY = gql`
  query GetCategory($id: ID!) {
    category(id: $id) {
      id
      name
      description
      subcategories {
        id
        name
        description
        products {
          id
        }
      }
    }
  }
`;

export default function CategoryPage() {
  const params = useParams();
  const [open, setOpen] = useState(false);
  const { loading, error, data } = useQuery(GET_CATEGORY, {
    variables: { id: params.id },
  });

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

  const category = data?.category;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{category.name}</h2>
          {category.description && (
            <p className="mt-2 text-muted-foreground">{category.description}</p>
          )}
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subcategory
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {category?.subcategories.map((subcategory: any) => (
          <SubcategoryCard
            key={subcategory.id}
            subcategory={subcategory}
            categoryId={category.id}
          />
        ))}
        {category?.subcategories.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            No subcategories found. Create one to get started.
          </p>
        )}
      </div>

      <SubcategoryDialog
        open={open}
        onOpenChange={setOpen}
        categoryId={category.id}
      />
    </div>
  );
}
