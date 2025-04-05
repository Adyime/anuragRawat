"use client";

import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Eye, MoreHorizontal, Trash, X } from "lucide-react";
import { useState } from "react";
import { ReviewDialog } from "./review-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { gql, useMutation } from "@apollo/client";
import { useToast } from "@/hooks/use-toast";
import { Review } from "./columns";

const APPROVE_REVIEW = gql`
  mutation ApproveReview($id: ID!) {
    approveReview(id: $id) {
      id
      isApproved
    }
  }
`;

const DELETE_REVIEW = gql`
  mutation DeleteReview($id: ID!) {
    deleteReview(id: $id)
  }
`;

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const [approveReview] = useMutation(APPROVE_REVIEW, {
    onCompleted: () => {
      toast({
        title: "Review approved",
        description: "The review has been approved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    refetchQueries: ["GetReviews"],
  });

  const [deleteReview] = useMutation(DELETE_REVIEW, {
    onCompleted: () => {
      toast({
        title: "Review deleted",
        description: "The review has been deleted successfully.",
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
    refetchQueries: ["GetReviews"],
  });

  const handleApprove = async () => {
    const review = row.original as Review;
    await approveReview({
      variables: { id: review.id },
    });
  };

  const handleDelete = async () => {
    const review = row.original as Review;
    await deleteReview({
      variables: { id: review.id },
    });
  };

  const review = row.original as Review;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          {!review.isApproved && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleApprove}>
                <Check className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReviewDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        review={review}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              review.
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