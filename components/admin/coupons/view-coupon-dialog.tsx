"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Coupon } from "./columns";

interface ViewCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon;
}

export function ViewCouponDialog({
  open,
  onOpenChange,
  coupon,
}: ViewCouponDialogProps) {
  const now = new Date();
  const startDate = new Date(coupon.startDate);
  const endDate = new Date(coupon.endDate);
  const isExpired = now > endDate;
  const isNotStarted = now < startDate;
  const isExhausted = coupon.usedCount >= coupon.usageLimit;

  let status = "active";
  if (!coupon.isActive) status = "inactive";
  else if (isExpired) status = "expired";
  else if (isNotStarted) status = "scheduled";
  else if (isExhausted) status = "exhausted";

  const statusColors = {
    active: "green",
    inactive: "gray",
    expired: "red",
    scheduled: "blue",
    exhausted: "yellow",
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Coupon Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-mono font-bold">{coupon.code}</h3>
              <Badge
                variant="outline"
                className={`bg-${statusColors[status]}-50 text-${statusColors[status]}-700 border-${statusColors[status]}-200`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            {coupon.description && (
              <p className="mt-2 text-muted-foreground">{coupon.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold">Discount</h4>
              <div className="mt-2 space-y-1">
                <p>{coupon?.discountPercent}% off</p>
                <p className="text-sm text-muted-foreground">
                  Maximum discount: ₹
                  {coupon?.maxDiscount?.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Minimum Order</h4>
              <p className="mt-2">
                ₹{coupon?.minOrderValue?.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Usage</h4>
              <div className="mt-2 space-y-1">
                <p>
                  {coupon.usedCount} of {coupon.usageLimit} used
                </p>
                <p className="text-sm text-muted-foreground">
                  {((coupon.usedCount / coupon.usageLimit) * 100).toFixed(1)}%
                  used
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Category</h4>
              <p className="mt-2">
                {coupon.category?.name || "All categories"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold">Start Date</h4>
              <p className="mt-2">
                {startDate?.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div>
              <h4 className="font-semibold">End Date</h4>
              <p className="mt-2">
                {endDate?.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
