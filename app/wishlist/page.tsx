"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { removeItem } from "@/store/slices/wishlistSlice";
import { addItem as addToCart } from "@/store/slices/cartSlice";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { items } = useSelector((state: RootState) => state.wishlist);
  const { toast } = useToast();

  const handleRemoveItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const handleMoveToCart = (item: any) => {
    dispatch(
      addToCart({
        id: crypto.randomUUID(),
        productId: item.productId,
        title: item.title,
        price: item.price,
        quantity: 1,
        isEbook: item.isEbook,
        image: item.image,
      })
    );
    dispatch(removeItem(item.id));
    toast({
      title: "Added to cart",
      description: `${item.title} has been moved to your cart.`,
    });
  };

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some books to your wishlist and they will appear here
          </p>
          <Button asChild>
            <Link href="/books">Browse Books</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-lg border p-4">
            <img
              src={item.image}
              alt={item.title}
              className="h-24 w-24 rounded-md object-cover"
            />
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.isEbook ? "E-Book" : "Physical Book"}
                </p>
                <p className="mt-2 font-medium">
                  ₹{item.price.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleMoveToCart(item)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
