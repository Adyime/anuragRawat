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
import {
  Eye,
  Edit,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { ViewCouponDialog } from "./view-coupon-dialog";
import { CouponDialog } from "./coupon-dialog";
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
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { deleteCoupon, updateCoupon } from "@/store/slices/couponSlice";
import { useToast } from "@/hooks/use-toast";
import { Coupon } from "./columns";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const coupon = row.original as Coupon;

  const handleDelete = async () => {
    try {
      await dispatch(deleteCoupon(coupon.id)).unwrap();
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
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

  const toggleActive = async () => {
    try {
      await dispatch(
        updateCoupon({
          id: coupon.id,
          input: {
            ...coupon,
            isActive: !coupon.isActive,
            startDate: new Date(coupon.startDate).toISOString().split("T")[0],
            endDate: new Date(coupon.endDate).toISOString().split("T")[0],
            categoryId: coupon.category?.id || undefined,
          },
        })
      ).unwrap();
      toast({
        title: "Success",
        description: `Coupon ${
          coupon.isActive ? "deactivated" : "activated"
        } successfully`,
      });
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
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleActive}>
            {coupon.isActive ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>
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

      <ViewCouponDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        coupon={coupon}
      />

      <CouponDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        coupon={coupon}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              coupon and remove its data from our servers.
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
