"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchCategories } from "@/store/slices/categorySlice";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryDialog } from "@/components/admin/categories/category-dialog";
import { CategoryCard } from "@/components/admin/categories/category-card";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Loader2 } from "lucide-react";

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
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
      products {
        id
      }
    }
  }
`;

export default function CategoriesPage() {
  const [open, setOpen] = useState(false);
  const { loading, error, data } = useQuery(GET_CATEGORIES);

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
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage your product categories and subcategories
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.categories.map((category: any) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      <CategoryDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
