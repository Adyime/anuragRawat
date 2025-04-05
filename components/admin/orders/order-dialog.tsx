"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Order } from "./columns";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export function OrderDialog({ open, onOpenChange, order }: OrderDialogProps) {
  const statusColors = {
    PENDING: "yellow",
    PROCESSING: "blue",
    SHIPPED: "purple",
    DELIVERED: "green",
    CANCELLED: "red",
  } as const;

  const paymentStatusColors = {
    PENDING: "yellow",
    PAID: "green",
    FAILED: "red",
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-medium">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(order.createdAt), "PPp")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className={`bg-${statusColors[order.status]}-50 text-${
                statusColors[order.status]
              }-700 border-${statusColors[order.status]}-200`}
            >
              {order.status}
            </Badge>
            <Badge
              variant="outline"
              className={`bg-${
                paymentStatusColors[order.paymentStatus]
              }-50 text-${
                paymentStatusColors[order.paymentStatus]
              }-700 border-${paymentStatusColors[order.paymentStatus]}-200`}
            >
              {order.paymentStatus}
            </Badge>
            <Badge variant="outline">{order.paymentMethod}</Badge>
          </div>

          <div>
            <h3 className="font-semibold">Customer</h3>
            <p>{order.user.name || order.user.email}</p>
            {order.user.name && <p className="text-muted-foreground">{order.user.email}</p>}
          </div>

          <div>
            <h3 className="font-semibold">Shipping Address</h3>
            <p className="whitespace-pre-wrap">{order.address}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p>{item.product.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.isEbook ? "E-Book" : "Physical Book"} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            {order.coupon && (
              <div className="flex justify-between text-muted-foreground">
                <p>Discount ({order.coupon.code})</p>
                <p>-{order.coupon.discountPercent}%</p>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <p>Total</p>
              <p>₹{order.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}