"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Review } from "./columns";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review;
}

export function ReviewDialog({
  open,
  onOpenChange,
  review,
}: ReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {review.product.images[0] ? (
                <AvatarImage src={review.product.images[0]} alt={review.product.title} />
              ) : (
                <AvatarFallback>{review.product.title[0]}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{review.product.title}</h3>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={review.isApproved ? "default" : "secondary"}>
                  {review.isApproved ? "Approved" : "Pending"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Posted {format(new Date(review.createdAt), "PPp")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Customer</h3>
            <p>{review.user.name || review.user.email}</p>
            {review.user.name && (
              <p className="text-muted-foreground">{review.user.email}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Rating</h3>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl ${
                    i < review.rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {review.comment && (
            <div>
              <h3 className="font-semibold">Comment</h3>
              <p className="mt-2 whitespace-pre-wrap">{review.comment}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}