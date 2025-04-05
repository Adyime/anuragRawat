"use client";

import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { addToCart } from "@/store/slices/cartSlice";
import { addItem as addToWishlist } from "@/store/slices/wishlistSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    discountedPrice?: number;
    isEbook: boolean;
    ebookPrice?: number;
    ebookDiscounted?: number;
    images: string[];
    category: {
      name: string;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch<AppDispatch>();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(
      addToCart({
        productId: product.id,
        quantity: 1,
        isEbook: false
      })
    );
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(
      addToWishlist({
        id: crypto.randomUUID(),
        productId: product.id,
        title: product.title,
        price: product.discountedPrice || product.price,
        isEbook: false,
        image: product.images[0],
      })
    );
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group overflow-hidden">
        <div className="relative aspect-[3/4]">
          <img
            src={product.images[0]}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="secondary" size="icon" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleAddToWishlist}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <Badge variant="secondary" className="mb-2">
            {product.category.name}
          </Badge>
          <h3 className="font-semibold truncate">{product.title}</h3>
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">
                ₹{(product.discountedPrice || product.price).toLocaleString()}
              </span>
              {product.discountedPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>
            {product.isEbook && (
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">E-Book:</span>
                <span className="font-medium">
                  ₹
                  {(
                    product.ebookDiscounted ||
                    product.ebookPrice ||
                    0
                  ).toLocaleString()}
                </span>
                {product.ebookDiscounted && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.ebookPrice?.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
