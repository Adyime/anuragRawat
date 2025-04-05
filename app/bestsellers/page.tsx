"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { ArrowRight, BookOpen, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { fetchBestsellers } from "@/store/slices/bestsellersSlice";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  orderPercentage: number;
}

export default function BestsellersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading } = useSelector(
    (state: RootState) => state.bestsellers
  );

  useEffect(() => {
    dispatch(fetchBestsellers());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-white">
      {/* Bestsellers Header Section */}
      <section className="bg-gradient-to-r from-[#0a0a8c]/10 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-[#0a0a8c]">
              <span className="bg-[#f26522]/10 p-2 rounded-full text-[#f26522] mr-3 inline-block">
                <BookOpen className="h-8 w-8" />
              </span>
              Bestselling Books
            </h1>
          </div>
          <p className="text-gray-600">
            Our most popular books, ordered in at least 1% of all orders
          </p>
        </div>
      </section>

      {/* Bestsellers Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#f26522]" />
                <p className="text-[#0a0a8c] font-medium">
                  Loading bestsellers...
                </p>
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {products.map((product: Product) => (
                <div
                  key={product.id}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-64 overflow-hidden">
                    <Image
                      src={product.images[0] || `/placeholder.svg`}
                      alt={product.title}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < 4
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-300 text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-gray-500 text-xs ml-1">(120)</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 text-gray-800">
                      {product.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-2">
                      {product.category.name}
                    </p>
                    <p className="text-[#f26522] text-sm mb-3">
                      Ordered in {Math.round(product.orderPercentage * 100)}% of
                      all orders
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[#f26522] font-bold text-xl">
                          ₹{product.discountedPrice || product.price}
                        </span>
                        {product.discountedPrice && (
                          <span className="text-gray-500 line-through text-sm">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                      <Button
                        asChild
                        variant="ghost"
                        className="text-[#0a0a8c] hover:text-[#f26522] hover:bg-transparent p-0"
                      >
                        <Link href={`/books/${product.id}`}>
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center">
              <div className="text-center">
                <p className="text-[#0a0a8c] font-medium mb-2">
                  No bestsellers found
                </p>
                <p className="text-gray-500">
                  Check back later for our most popular books
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
