"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface CartItemsProps {
  items: any[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  editable?: boolean;
}

export function CartItems({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  editable = true 
}: CartItemsProps) {
  return (
    <div className="space-y-4 mb-8">
      {items.map((item: any) => (
        <div
          key={item.id}
          className="flex items-center gap-4 rounded-lg border p-4"
        >
          <div className="relative h-24 w-20 flex-shrink-0">
            <Image
              src={item.product.images[0]}
              alt={item.product.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-grow">
            <h3 className="font-medium">{item.product.title}</h3>
            <p className="text-sm text-gray-600">
              {item.isEbook ? "eBook" : "Paperback"}
            </p>
            {editable && (
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      onUpdateQuantity(item.id, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      onUpdateQuantity(item.id, item.quantity + 1)
                    }
                    disabled={
                      !item.isEbook && item.quantity >= item.product.stock
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="font-medium">
              ₹
              {item.isEbook
                ? item.product.ebookDiscounted ||
                  item.product.ebookPrice ||
                  item.product.price
                : item.product.discountedPrice || item.product.price}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 