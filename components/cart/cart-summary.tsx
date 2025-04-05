"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CartSummaryProps {
  subtotal: number;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
  return (
    <div className="rounded-lg border bg-gray-50 p-6">
      <h2 className="text-lg font-medium">Order Summary</h2>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <Link href="/checkout">
        <Button className="mt-6 w-full bg-[#f26522] hover:bg-[#f26522]/90">
          Proceed to Checkout
        </Button>
      </Link>
    </div>
  );
} 