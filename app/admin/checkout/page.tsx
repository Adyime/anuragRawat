"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchUserAddresses } from "@/store/slices/userSlice";
import {
  setSelectedAddress,
  setPaymentMethod,
  createOrder,
} from "@/store/slices/checkoutSlice";
import { clearCart } from "@/store/slices/cartSlice";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AddressDialog } from "@/components/checkout/address-dialog";
import { CouponDialog } from "@/components/checkout/coupon-dialog";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const { items } = useSelector((state: RootState) => state.cart);
  const { addresses, loading: addressesLoading } = useSelector(
    (state: RootState) => state.user
  );
  const { selectedAddress, paymentMethod, loading } = useSelector(
    (state: RootState) => state.checkout
  );

  useEffect(() => {
    dispatch(fetchUserAddresses());
  }, [dispatch]);

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = items.some((item) => !item.isEbook) ? 50 : 0;
  const total = subtotal + shipping;

  const handlePaymentMethodChange = (value: "CASH_ON_DELIVERY" | "ONLINE") => {
    dispatch(setPaymentMethod(value));
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: "Error",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        isEbook: item.isEbook,
      }));

      const order = await dispatch(
        createOrder({
          items: orderItems,
          addressId: selectedAddress.id,
          paymentMethod,
        })
      ).unwrap();

      if (paymentMethod === "ONLINE") {
        // Initialize Razorpay payment
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.total * 100,
          currency: "INR",
          name: "NextJS eCommerce",
          description: "Book Purchase",
          order_id: order.razorpayOrderId,
          handler: async (response: any) => {
            try {
              await dispatch(
                verifyPayment({
                  orderId: order.id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                })
              ).unwrap();

              dispatch(clearCart());
              router.push(`/orders/${order.id}`);
            } catch (error) {
              console.error("Payment verification failed:", error);
              toast({
                title: "Error",
                description: "Payment verification failed",
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: selectedAddress.name,
            contact: selectedAddress.phone,
          },
          theme: {
            color: "#000000",
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        dispatch(clearCart());
        router.push(`/orders/${order.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          {/* Delivery Address */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Delivery Address</h2>
              <Button
                variant="outline"
                onClick={() => setShowAddressDialog(true)}
              >
                Add New Address
              </Button>
            </div>
            {addressesLoading ? (
              <div className="flex h-[200px] items-center justify-center rounded-lg border">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : addresses.length > 0 ? (
              <RadioGroup
                value={selectedAddress?.id}
                onValueChange={(value) => {
                  const address = addresses.find((a) => a.id === value);
                  if (address) {
                    dispatch(setSelectedAddress(address));
                  }
                }}
                className="grid gap-4"
              >
                {addresses.map((address) => (
                  <div key={address.id}>
                    <RadioGroupItem
                      value={address.id}
                      id={address.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={address.id}
                      className="flex flex-col rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <span className="font-medium">{address.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {address.phone}
                      </span>
                      <span className="mt-1 text-sm">
                        {address.address}, {address.city}, {address.state} -{" "}
                        {address.pincode}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-lg border">
                <p className="text-muted-foreground">No addresses found</p>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <RadioGroup
              value={paymentMethod || ""}
              onValueChange={handlePaymentMethodChange}
              className="grid gap-4"
            >
              <div>
                <RadioGroupItem
                  value="ONLINE"
                  id="online"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="online"
                  className="flex flex-col rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="font-medium">Pay Online</span>
                  <span className="text-sm text-muted-foreground">
                    Pay securely with Razorpay
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="CASH_ON_DELIVERY"
                  id="cod"
                  className="peer sr-only"
                  disabled={items.some((item) => item.isEbook)}
                />
                <Label
                  htmlFor="cod"
                  className="flex flex-col rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="font-medium">Cash on Delivery</span>
                  <span className="text-sm text-muted-foreground">
                    Pay when you receive your order
                  </span>
                  {items.some((item) => item.isEbook) && (
                    <span className="mt-1 text-sm text-destructive">
                      Not available for e-books
                    </span>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.title} × {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {shipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₹{shipping.toLocaleString()}</span>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCouponDialog(true)}
              >
                Apply Coupon
              </Button>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={loading || !selectedAddress || !paymentMethod}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Place Order"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AddressDialog
        open={showAddressDialog}
        onOpenChange={setShowAddressDialog}
      />

      <CouponDialog
        open={showCouponDialog}
        onOpenChange={setShowCouponDialog}
        total={total}
      />
    </div>
  );
}
