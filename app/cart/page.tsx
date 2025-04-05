"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
} from "@/store/slices/cartSlice";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CartItems } from "@/components/cart/cart-items";
import { CartSummary } from "@/components/cart/cart-summary";
import { UpsellSection } from "@/components/cart/upsell-section";

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session } = useSession();
  const { cart, loading, error } = useSelector((state: any) => state.cart);
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      dispatch(fetchCart());
    }
  }, [dispatch, session]);

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      await dispatch(updateCartItem({ id, quantity })).unwrap();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await dispatch(removeFromCart(id)).unwrap();
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <h2 className="mb-2 text-2xl font-bold">Please sign in</h2>
        <p className="mb-4 text-gray-600">Sign in to view your cart</p>
        <Link href="/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#f26522] border-t-transparent"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button
            onClick={() => dispatch(fetchCart())}
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <h2 className="mb-2 text-2xl font-bold">Your cart is empty</h2>
        <p className="mb-4 text-gray-600">Add some books to get started</p>
        <Link href="/books">
          <Button>Browse Books</Button>
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum: number, item: any) => {
    const price = item.isEbook
      ? item.product.ebookDiscounted ||
        item.product.ebookPrice ||
        item.product.price
      : item.product.discountedPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CartItems 
            items={cart.items} 
            onUpdateQuantity={handleUpdateQuantity} 
            onRemoveItem={handleRemoveItem} 
          />
          
          <UpsellSection cartItems={cart.items} />
        </div>
        <div className="lg:col-span-4">
          <CartSummary subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}
