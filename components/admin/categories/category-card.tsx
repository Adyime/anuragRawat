"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { deleteCategory } from "@/store/slices/categorySlice";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronRight, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CategoryDialog } from "./category-dialog";

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    description?: string;
    subcategories: {
      id: string;
      name: string;
    }[];
    products: {
      id: string;
    }[];
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await dispatch(deleteCategory(category.id)).unwrap();
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card
        className="hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => router.push(`/admin/categories/${category.id}`)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">{category.name}</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowEditDialog(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {category.description && (
            <CardDescription className="mt-2">
              {category.description}
            </CardDescription>
          )}
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Subcategories ({category.subcategories.length})
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {category.subcategories.map((subcategory) => (
                  <Badge key={subcategory.id} variant="secondary">
                    {subcategory.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Products
              </h4>
              <p className="mt-1 text-2xl font-bold">
                {category.products.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CategoryDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        category={category}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category and all its subcategories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
