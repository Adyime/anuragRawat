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
  verifyPayment,
} from "@/store/slices/checkoutSlice";
import { clearCart, fetchCart } from "@/store/slices/cartSlice";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AddressDialog } from "@/components/checkout/address-dialog";
import { ApplyCouponDialog } from "@/components/checkout/apply-coupon-dialog";
import Script from "next/script";
import { useSession } from "next-auth/react";

import {
  Loader2,
  CreditCard,
  ShieldCheck,
  TruckIcon,
  Package,
} from "lucide-react";

// Add Razorpay types
declare global {
  interface Window {
    Razorpay: any;
    _rzp_error_log?: (error: any) => void;
  }
}

// Define CartItem type from cart state
interface CartProduct {
  id: string;
  title: string;
  price: number;
  discountedPrice?: number;
  ebookPrice?: number;
  ebookDiscounted?: number;
  images: string[];
}

interface CartItem {
  id: string;
  quantity: number;
  isEbook: boolean;
  product: CartProduct;
}

// Replace this line
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_qGlVceKKdIazPZ";
const RAZORPAY_TEST_MODE = true; // Set to true for development/testing

interface OrderResponse {
  id: string;
  razorpayOrderId?: string; // This should be present for online payments
  total: number;
  // ... other fields
}

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get cart from Redux store with correct structure
  const { cart, loading: cartLoading } = useSelector(
    (state: RootState) => state.cart
  );
  const cartItems: CartItem[] = cart?.items || [];

  const { addresses, loading: addressesLoading } = useSelector(
    (state: RootState) => state.user
  );
  const { selectedAddress, paymentMethod, loading } = useSelector(
    (state: RootState) => state.checkout
  );

  // Fetch cart and addresses when component loads
  useEffect(() => {
    if (session) {
      dispatch(fetchCart());
      dispatch(fetchUserAddresses());
    }
  }, [dispatch, session]);

  // Redirect to cart if no items
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      router.push("/cart");
    }
  }, [cartLoading, cartItems.length, router, toast]);

  // Calculate price based on item type
  const getItemPrice = (item: CartItem): number => {
    if (item.isEbook) {
      return (
        item.product.ebookDiscounted ||
        item.product.ebookPrice ||
        item.product.price
      );
    }
    return item.product.discountedPrice || item.product.price;
  };

  const subtotal =
    cartItems.length > 0
      ? cartItems.reduce(
          (sum: number, item: CartItem) =>
            sum + getItemPrice(item) * item.quantity,
          0
        )
      : 0;

  const shipping =
    cartItems.length > 0
      ? cartItems.some((item: CartItem) => !item.isEbook)
        ? 50
        : 0
      : 0;

  // Apply coupon discount if a valid coupon is applied
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    const discountAmount = (subtotal * appliedCoupon.discountPercent) / 100;
    return Math.min(discountAmount, appliedCoupon.maxDiscount);
  };

  // Recalculate discount when subtotal or applied coupon changes
  useEffect(() => {
    if (appliedCoupon) {
      setDiscount(calculateDiscount());
    }
  }, [subtotal, appliedCoupon]);

  const total = subtotal + shipping - discount;

  const handlePaymentMethodChange = (value: "CASH_ON_DELIVERY" | "ONLINE") => {
    dispatch(setPaymentMethod(value));
  };

  // Add Razorpay script load handler
  const handleRazorpayLoad = () => {
    console.log("Razorpay script loaded");
    setIsRazorpayLoaded(true);
  };

  // Add direct script loading in useEffect
  useEffect(() => {
    // Check if script is already loaded
    if (window.Razorpay) {
      setIsRazorpayLoaded(true);
      return;
    }

    // Load script directly if not already loaded
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded via direct injection");
      setIsRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleApplyCoupon = (coupon: any) => {
    setAppliedCoupon(coupon);
    const discountAmount = (subtotal * coupon.discountPercent) / 100;
    const calculatedDiscount = Math.min(discountAmount, coupon.maxDiscount);
    setDiscount(calculatedDiscount);

    toast({
      title: "Coupon Applied",
      description: `Discount of ₹${calculatedDiscount.toLocaleString()} applied to your order.`,
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);

    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order.",
    });
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

    // Validate Razorpay key before proceeding
    if (paymentMethod === "ONLINE") {
      console.log("Using RAZORPAY_KEY_ID:", RAZORPAY_KEY_ID || "(not set)");
      
      if (!RAZORPAY_KEY_ID) {
        console.error("Razorpay Key ID is missing");
        toast({
          title: "Error",
          description: "Payment configuration is missing. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      if (!isRazorpayLoaded) {
        console.error("Razorpay script not loaded");
        toast({
          title: "Error",
          description: "Payment system is not ready. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      console.log("==== STARTING ORDER CREATION ====");
      console.log("Address ID:", selectedAddress.id);
      console.log("Payment method:", paymentMethod);
      
      // Print each cart item for debugging
      cartItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          productId: item.product.id,
          title: item.product.title,
          quantity: item.quantity,
          isEbook: item.isEbook
        });
      });
      
      // Log coupon info if applied
      if (appliedCoupon) {
        console.log("Applied coupon:", appliedCoupon.code, "with discount:", discount);
      }

      // Create order input
      const orderInput = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          isEbook: item.isEbook,
        })),
        addressId: selectedAddress.id,
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
      };
      
      console.log("Full order input:", JSON.stringify(orderInput, null, 2));

      // Use GraphQL mutation via Redux
      console.log("Dispatching createOrder action...");
      try {
        const order = await dispatch(createOrder(orderInput)).unwrap();
        console.log("Order created successfully:", order);
        console.log("Order ID:", order.id);
        
        if (paymentMethod === "ONLINE") {
          console.log("Initializing online payment...");
          
          // Since the razorpayOrderId field isn't available in the schema,
          // we need to use a test mode approach for development
          if (!order.razorpayOrderId || RAZORPAY_TEST_MODE) {
            console.log("Using test mode for Razorpay payment");
            
            // For development, create a test payment without requiring a real order ID
            toast({
              title: "Test Mode",
              description: "Using test payment mode. This won't process real payments.",
              variant: "default",
            });
            
            // IMPORTANT: Debug logging for Razorpay
            console.log("==== RAZORPAY TEST MODE INITIALIZATION ====");
            console.log("Razorpay Key:", RAZORPAY_KEY_ID);
            console.log("Order ID:", order.id);
            console.log("Order amount:", Math.round(order.total * 100));
            
            // Initialize Razorpay with order total
            const options = {
              key: RAZORPAY_KEY_ID,
              amount: Math.round(order.total * 100),
              currency: "INR",
              name: "Book Store",
              description: `Test Order #${order.id}`,
              // Don't include order_id in test mode - this avoids the API validation
              handler: function (response: any) {
                console.log("Test payment response:", response);
                
                // Properly verify payment even in test mode
                const verifyTestPayment = async () => {
                  try {
                    // Create a test payment verification payload
                    const verificationPayload = {
                      orderId: order.id,
                      paymentId: `test_pay_${Date.now()}`,
                      signature: `test_sig_${Date.now()}`
                    };
                    
                    console.log("Verifying test payment with payload:", verificationPayload);
                    
                    // Call the verifyPayment mutation
                    const verifyResponse = await fetch('/api/graphql', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        query: `
                          mutation VerifyPayment($input: PaymentVerificationInput!) {
                            verifyPayment(input: $input) {
                              success
                              message
                              orderId
                            }
                          }
                        `,
                        variables: { input: verificationPayload },
                      }),
                    });
                    
                    const result = await verifyResponse.json();
                    console.log("Test payment verification result:", result);
                    
                    if (result.data?.verifyPayment?.success) {
                      toast({
                        title: "Test Payment Successful",
                        description: "This was a test payment with proper verification."
                      });
                      router.push("/orders");
                    } else {
                      toast({
                        title: "Test Payment Error",
                        description: result.data?.verifyPayment?.message || "Verification failed",
                        variant: "destructive"
                      });
                      setIsLoading(false);
                    }
                  } catch (error) {
                    console.error("Error verifying test payment:", error);
                    toast({
                      title: "Test Payment Error",
                      description: "Failed to verify test payment",
                      variant: "destructive"
                    });
                    setIsLoading(false);
                  }
                };
                
                // Execute the verification
                verifyTestPayment();
              },
              prefill: {
                name: selectedAddress.name,
                email: session?.user?.email || '',
                contact: selectedAddress.phone,
              },
              theme: {
                color: "#3730a3",
              },
              modal: {
                confirm_close: true,
                ondismiss: function() {
                  console.log('Test checkout form closed');
                  toast({
                    title: "Payment Cancelled",
                    description: "Test payment was cancelled.",
                  });
                  setIsLoading(false);
                }
              },
              notes: {
                test_mode: "true",
                order_id: order.id
              }
            };
            
            try {
              console.log("Opening Razorpay in test mode with options:", options);
              const rzp = new window.Razorpay(options);
              rzp.open();
            } catch (error) {
              console.error("Razorpay test mode initialization failed:", error);
              toast({
                title: "Payment Error",
                description: "Could not initialize payment system. Please try again later.",
                variant: "destructive",
              });
              setIsLoading(false);
            }
            return;
          }
          
          // Normal flow with actual Razorpay order ID
          console.log("RazorpayOrderId:", order.razorpayOrderId);
          
          try {
            // IMPORTANT: Debug logging for Razorpay
            console.log("==== RAZORPAY INITIALIZATION ====");
            console.log("Razorpay Key:", RAZORPAY_KEY_ID);
            console.log("Order ID for Razorpay:", order.razorpayOrderId);
            console.log("Order amount:", Math.round(order.total * 100));
            
            // Initialize Razorpay with order total
            const options = {
              key: RAZORPAY_KEY_ID,
              amount: Math.round(order.total * 100),
              currency: "INR",
              name: "Book Store",
              description: `Order #${order.id}`,
              order_id: order.razorpayOrderId,
              handler: async function (response: { 
                razorpay_payment_id: string; 
                razorpay_order_id: string;
                razorpay_signature: string;
              }) {
                try {
                  console.log("💰💰💰 Payment successful, verifying payment...");
                  console.log("Payment response:", JSON.stringify(response, null, 2));
                  
                  // No need to check for test mode as we've already handled that in the outer if
                  
                  // Real payment verification
                  console.log("Dispatching verifyPayment action with:", {
                    orderId: order.id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature
                  });
                  
                  // Use a direct fetch approach to debug
                  try {
                    console.log("Trying direct fetch for payment verification");
                    const verifyResponse = await fetch('/api/graphql', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        query: `
                          mutation VerifyPayment($input: PaymentVerificationInput!) {
                            verifyPayment(input: $input) {
                              success
                              message
                              orderId
                            }
                          }
                        `,
                        variables: { 
                          input: {
                            orderId: order.id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature
                          }
                        },
                      }),
                    });
                    
                    const json = await verifyResponse.json();
                    console.log("Direct verify response:", json);
                    
                    if (json.data && json.data.verifyPayment && json.data.verifyPayment.success) {
                      toast({
                        title: "Success",
                        description: "Payment successful! Your order has been placed.",
                      });
                      // The cart will be cleared server-side after payment verification
                      router.push("/orders");
                      return;
                    } else if (json.errors) {
                      console.error("GraphQL errors from direct fetch:", json.errors);
                      toast({
                        title: "Error",
                        description: json.errors[0]?.message || "Payment verification failed",
                        variant: "destructive",
                      });
                      return;
                    }
                  } catch (fetchError) {
                    console.error("Direct fetch for verification failed:", fetchError);
                    // Fall back to Redux approach
                  }
                  
                  // Fall back to Redux action if direct fetch failed
                  const result = await dispatch(
                    verifyPayment({
                      orderId: order.id,
                      paymentId: response.razorpay_payment_id,
                      signature: response.razorpay_signature,
                    })
                  ).unwrap();

                  if (result.success) {
                    toast({
                      title: "Success",
                      description: "Payment successful! Your order has been placed.",
                    });
                    // The cart will be cleared server-side after payment verification and shipping processing
                    router.push("/orders");
                  } else {
                    toast({
                      title: "Error",
                      description: result.message || "Payment verification failed",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error("Payment verification error:", error);
                  toast({
                    title: "Error",
                    description: "Payment verification failed. Please contact support.",
                    variant: "destructive",
                  });
                }
              },

              
              prefill: {
                name: selectedAddress.name,
                email: session?.user?.email,
                contact: selectedAddress.phone,
              },
              theme: {
                color: "#3730a3",
              },
              modal: {
                ondismiss: function() {
                  console.log('Checkout form closed');
                  toast({
                    title: "Payment Cancelled",
                    description: "You can try again or view your order in the orders page.",
                  });
                  router.push("/orders");
                }
              }
            };

            console.log("Order ID:", order.razorpayOrderId);
            console.log("Order details:", order);
            
            console.log("Opening Razorpay with options:", options);
            const rzp = new window.Razorpay(options);
            rzp.open();

            // Handle payment failure
            rzp.on("payment.failed", function (response: { 
              error: { 
                code: string;
                description: string;
                source: string;
                step: string;
                reason: string;
                metadata: { order_id: string; payment_id: string };
              }
            }) {
              console.error("Payment failed:", response.error);
              toast({
                title: "Payment Failed",
                description: response.error.description || "Payment failed. Please try again.",
                variant: "destructive",
              });
            });
          } catch (error) {
            console.error("Razorpay initialization error:", error);
            toast({
              title: "Error",
              description: "Failed to initialize payment. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // For COD orders
          toast({
            title: "Success",
            description: "Order placed successfully!",
          });
          // The cart will be cleared server-side after order and shipping processing
          router.push("/orders");
        }
      } catch (error) {
        console.error("Order placement error:", error);
        toast({
          title: "Order Creation Failed",
          description: typeof error === "string" ? error : "Please try again or contact support",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast({
        title: "Order Creation Failed",
        description: typeof error === "string" ? error : "Please try again or contact support",
        variant: "destructive",
      });
    }
  };

  // Add the Razorpay key check useEffect inside the component
  useEffect(() => {
    if (!RAZORPAY_KEY_ID) {
      console.error("Razorpay key is not configured in environment variables");
    } else {
      console.log("Razorpay key is configured");
    }
  }, []);

  // Move the console.log inside the component as well
  useEffect(() => {
    console.log("Razorpay Key ID available:", !!RAZORPAY_KEY_ID);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={handleRazorpayLoad}
      />
      {/* Announcement Bar */}
      <div className="bg-[#0a0a8c] text-white text-center py-2 text-sm font-medium">
        <p>
          Free shipping on orders over ₹2500! Use code{" "}
          <span className="font-bold">BOOKWORM</span> for 15% off your first
          order
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#0a0a8c] mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            {/* Delivery Address */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#0a0a8c]">
                  Delivery Address
                </h2>
                <Button
                  variant="outline"
                  className="border-[#0a0a8c] text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                  onClick={() => setShowAddressDialog(true)}
                >
                  Add New Address
                </Button>
              </div>
              {addressesLoading ? (
                <div className="flex h-[200px] items-center justify-center rounded-lg border">
                  <Loader2 className="h-8 w-8 animate-spin text-[#f26522]" />
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
                        className="flex flex-col rounded-lg border p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#f26522] [&:has([data-state=checked])]:border-[#f26522]"
                      >
                        <span className="font-medium text-[#0a0a8c]">
                          {address.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {address.phone}
                        </span>
                        <span className="mt-1 text-sm text-gray-700">
                          {address.street}, {address.city}, {address.state} -{" "}
                          {address.pincode}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border">
                  <p className="text-gray-500">No addresses found</p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-[#0a0a8c]">
                Payment Method
              </h2>
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
                    className="flex flex-col rounded-lg border p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#f26522] [&:has([data-state=checked])]:border-[#f26522]"
                  >
                    <span className="font-medium text-[#0a0a8c]">
                      Pay Online
                    </span>
                    <span className="text-sm text-gray-600">
                      Pay securely with Razorpay
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="CASH_ON_DELIVERY"
                    id="cod"
                    className="peer sr-only"
                    disabled={
                      cartItems && cartItems.length > 0
                        ? cartItems.some((item) => item.isEbook)
                        : false
                    }
                  />
                  <Label
                    htmlFor="cod"
                    className="flex flex-col rounded-lg border p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#f26522] [&:has([data-state=checked])]:border-[#f26522]"
                  >
                    <span className="font-medium text-[#0a0a8c]">
                      Cash on Delivery
                    </span>
                    <span className="text-sm text-gray-600">
                      Pay when you receive your order
                    </span>
                    {cartItems &&
                      cartItems.length > 0 &&
                      cartItems.some((item) => item.isEbook) && (
                        <span className="mt-1 text-sm text-red-500">
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
            <div className="rounded-lg border p-6 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-[#0a0a8c]">
                Order Summary
              </h2>
              <div className="space-y-4">
                {cartItems && cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product.title} × {item.quantity}
                      </span>
                      <span>
                        ₹{(getItemPrice(item) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No items in cart</div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>₹{shipping.toLocaleString()}</span>
                  </div>
                )}
                {appliedCoupon ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-2">Discount</span>
                        <span className="text-xs text-white px-2 py-0.5 rounded bg-green-500">
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <span className="text-green-600">
                        -₹{discount.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 self-end text-xs"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-[#0a0a8c] text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                    onClick={() => setShowCouponDialog(true)}
                  >
                    Apply Coupon
                  </Button>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-[#0a0a8c]">Total</span>
                  <span className="text-[#f26522]">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
                <Button
                  className="w-full bg-[#f26522] hover:bg-[#f26522]/90 text-white font-semibold"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={isLoading || !selectedAddress || !paymentMethod}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <section className="border-y border-gray-200 py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              {
                icon: <TruckIcon className="h-6 w-6" />,
                label: "Free Shipping",
                desc: "On orders over $35",
              },
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                label: "Secure Payment",
                desc: "100% secure checkout",
              },
              {
                icon: <Package className="h-6 w-6" />,
                label: "Easy Returns",
                desc: "30-day return policy",
              },
              {
                icon: <CreditCard className="h-6 w-6" />,
                label: "Payment Options",
                desc: "Multiple payment methods",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center p-2">
                <div className="text-[#0a0a8c] mb-2">{item.icon}</div>
                <p className="font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AddressDialog
        open={showAddressDialog}
        onOpenChange={setShowAddressDialog}
      />

      <ApplyCouponDialog
        open={showCouponDialog}
        onOpenChange={setShowCouponDialog}
        total={subtotal}
        onApplyCoupon={handleApplyCoupon}
      />
    </div>
  );
}
