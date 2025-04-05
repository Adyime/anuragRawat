"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubcategoryDialog } from "./subcategory-dialog";

const DELETE_SUBCATEGORY = gql`
  mutation DeleteSubcategory($id: ID!) {
    deleteSubcategory(id: $id)
  }
`;

interface SubcategoryCardProps {
  subcategory: {
    id: string;
    name: string;
    description?: string;
    products: {
      id: string;
    }[];
  };
  categoryId: string;
}

export function SubcategoryCard({
  subcategory,
  categoryId,
}: SubcategoryCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const [deleteSubcategory] = useMutation(DELETE_SUBCATEGORY, {
    onCompleted: () => {
      toast({
        title: "Success",
        description: "Subcategory deleted successfully",
      });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    refetchQueries: ["GetCategory"],
  });

  const handleDelete = async () => {
    await deleteSubcategory({
      variables: { id: subcategory.id },
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            {subcategory.name}
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subcategory.description && (
            <CardDescription className="mt-2">
              {subcategory.description}
            </CardDescription>
          )}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Products
            </h4>
            <p className="mt-1 text-2xl font-bold">
              {subcategory.products.length}
            </p>
          </div>
        </CardContent>
      </Card>

      <SubcategoryDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        categoryId={categoryId}
        subcategory={subcategory}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subcategory and remove its data from our servers.
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
