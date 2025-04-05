"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Customer } from "./columns";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
}: CustomerDialogProps) {
  const orderStatusColors = {
    PENDING: "yellow",
    PROCESSING: "blue",
    SHIPPED: "purple",
    DELIVERED: "green",
    CANCELLED: "red",
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {customer.name?.[0]?.toUpperCase() || customer.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">
                {customer.name || customer.email}
              </h3>
              {customer.name && (
                <p className="text-muted-foreground">{customer.email}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={customer.role === "ADMIN" ? "default" : "secondary"}>
                  {customer.role}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Joined {format(new Date(customer.createdAt), "PP")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Order History</h3>
            <div className="space-y-4">
              {customer.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm">{order.id}</p>
                    <Badge
                      variant="outline"
                      className={`mt-1 bg-${orderStatusColors[order.status as keyof typeof orderStatusColors]}-50 text-${orderStatusColors[order.status as keyof typeof orderStatusColors]}-700 border-${orderStatusColors[order.status as keyof typeof orderStatusColors]}-200`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="font-medium">₹{order.total.toLocaleString()}</p>
                </div>
              ))}
              {customer.orders.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No orders yet
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-4">Reviews</h3>
            <div className="space-y-4">
              {customer.reviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.rating} ★</span>
                    <Badge variant={review.isApproved ? "default" : "secondary"}>
                      {review.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
              {customer.reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No reviews yet
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}