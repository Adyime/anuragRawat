"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchProduct } from "@/store/slices/productSlice";
import { addToCart } from "@/store/slices/cartSlice";
import { addItem as addToWishlist } from "@/store/slices/wishlistSlice";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  TruckIcon,
  Download,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const dispatch = useDispatch<AppDispatch>();
  const { currentProduct, loading, error } = useSelector(
    (state: RootState) => state.products
  );
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // Get format from URL search params, default to "book" if not specified
  const format = searchParams.get("format") === "ebook" ? "ebook" : "book";

  // Track if this is an e-book or physical book view
  const isEbookView = format === "ebook";

  useEffect(() => {
    console.log("Fetching product with ID:", params.id);
    dispatch(fetchProduct(params.id));
  }, [dispatch, params.id]);

  // Add debug logging
  useEffect(() => {
    console.log("Current product state:", {
      loading,
      error,
      product: currentProduct,
      format,
    });
  }, [loading, error, currentProduct, format]);

  const handleAddToCart = async (isEbook: boolean) => {
    if (!session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    if (!currentProduct) {
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(
        addToCart({
          productId: currentProduct.id,
          quantity,
          isEbook,
        })
      ).unwrap();

      if (result) {
        toast({
          title: "Added to cart",
          description: `${currentProduct.title} has been added to your cart`,
        });
      }
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      toast({
        title: "Error",
        description:
          error?.message || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToWishlist = () => {
    if (!currentProduct) return;

    dispatch(
      addToWishlist({
        id: crypto.randomUUID(),
        productId: currentProduct.id,
        title: currentProduct.title,
        price: isEbookView
          ? currentProduct.ebookDiscounted || currentProduct.ebookPrice || 0
          : currentProduct.discountedPrice || currentProduct.price,
        isEbook: isEbookView,
        image: currentProduct.images[0],
      })
    );

    toast({
      title: "Added to wishlist",
      description: `${currentProduct.title} has been added to your wishlist.`,
    });
  };

  const handleQuantityIncrease = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    }
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <BookOpen className="h-12 w-12 animate-pulse text-[#f26522]" />
          <p className="text-[#0a0a8c] font-medium">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md p-8 rounded-xl bg-red-50 border border-red-100 text-center">
          <p className="text-red-500 font-medium text-lg mb-2">
            Error loading book details
          </p>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Button
            onClick={() => dispatch(fetchProduct(params.id))}
            className="mt-4 bg-red-500 hover:bg-red-600"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md p-8 rounded-xl bg-red-50 border border-red-100 text-center">
          <p className="text-red-500 font-medium text-lg">Book not found</p>
          <p className="text-red-400 text-sm mt-2">
            The requested book could not be found. Please check the URL and try
            again.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="mt-4 bg-red-500 hover:bg-red-600"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Bar */}
      <div className="bg-[#0a0a8c] text-white text-center py-2 text-sm font-medium">
        <p>
          Free shipping on orders over ₹2500! Use code{" "}
          <span className="font-bold">BOOKWORM</span> for 15% off your first
          order
        </p>
      </div>

      {/* Book Detail Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Book Image */}
            <div className="relative">
              <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center">
                <Image
                  src={currentProduct.images[0] || "/placeholder.svg"}
                  alt={currentProduct.title}
                  width={500}
                  height={500}
                  className="max-h-[500px] w-auto object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
              {currentProduct.discountedPrice && (
                <div className="absolute top-4 left-4 bg-[#f26522] text-white text-sm font-bold px-3 py-1 rounded">
                  {Math.round(
                    ((currentProduct.price - currentProduct.discountedPrice) /
                      currentProduct.price) *
                      100
                  )}
                  % OFF
                </div>
              )}
            </div>

            {/* Book Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-[#0a0a8c] mb-2">
                  {currentProduct.title}
                </h1>
                <p className="text-gray-500 text-lg">
                  {currentProduct.category.name}
                </p>
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < 4
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-300 text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-sm">(120 reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                {isEbookView ? (
                  // E-book pricing
                  <>
                    <span className="text-[#f26522] font-bold text-3xl">
                      {currentProduct.ebookDiscounted
                        ? `₹${currentProduct.ebookDiscounted}`
                        : currentProduct.ebookPrice
                        ? `₹${currentProduct.ebookPrice}`
                        : "Free"}
                    </span>
                    {currentProduct.ebookDiscounted &&
                      currentProduct.ebookPrice && (
                        <span className="text-gray-500 line-through text-xl">
                          ₹{currentProduct.ebookPrice}
                        </span>
                      )}
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-semibold">
                      E-BOOK
                    </span>
                  </>
                ) : (
                  // Physical book pricing
                  <>
                    <span className="text-[#f26522] font-bold text-3xl">
                      ₹{currentProduct.discountedPrice || currentProduct.price}
                    </span>
                    {currentProduct.discountedPrice && (
                      <span className="text-gray-500 line-through text-xl">
                        ₹{currentProduct.price}
                      </span>
                    )}
                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-semibold">
                      PHYSICAL BOOK
                    </span>
                  </>
                )}
              </div>

              {/* Format Toggle */}
              <div className="flex items-center gap-4 mt-4">
                <span className="text-sm font-medium text-gray-700">
                  Format:
                </span>
                <div className="flex rounded-md overflow-hidden border border-[#0a0a8c]">
                  <Link
                    href={`/books/${params.id}?format=book`}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      !isEbookView
                        ? "bg-[#0a0a8c] text-white"
                        : "bg-white text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                    }`}
                  >
                    Physical Book
                  </Link>
                  <Link
                    href={`/books/${params.id}?format=ebook`}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      isEbookView
                        ? "bg-[#0a0a8c] text-white"
                        : "bg-white text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                    }`}
                  >
                    E-Book
                  </Link>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{currentProduct.description}</p>
              </div>

              {/* Purchase Options */}
              <div className="space-y-4">
                {/* Only show quantity selector for physical books */}
                {!isEbookView && (
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 font-medium">Quantity:</span>
                    <div className="flex border border-gray-300 rounded-md">
                      <button
                        onClick={handleQuantityDecrease}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center flex items-center justify-center font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={handleQuantityIncrease}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {currentProduct.stock > 0 ? (
                      <span className="text-green-600 text-sm">
                        In Stock ({currentProduct.stock} available)
                      </span>
                    ) : (
                      <span className="text-red-600 text-sm">Out of Stock</span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {isEbookView ? (
                    /* E-book purchase options */
                    <>
                      <Button
                        onClick={() => handleAddToCart(true)}
                        className="bg-[#f26522] hover:bg-[#f26522]/90 text-white px-6 py-2"
                        disabled={!currentProduct.isEbook}
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Add to Cart
                      </Button>

                      {currentProduct.pdfUrl && (
                        <Button
                          variant="outline"
                          className="border-[#0a0a8c] text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                          onClick={() =>
                            window.open(currentProduct.pdfUrl, "_blank")
                          }
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Preview Sample
                        </Button>
                      )}
                    </>
                  ) : (
                    /* Physical book purchase options */
                    <>
                      <Button
                        onClick={() => handleAddToCart(false)}
                        className="bg-[#f26522] hover:bg-[#f26522]/90 text-white px-6 py-2"
                        disabled={currentProduct.stock <= 0}
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Add to Cart
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="border-[#0a0a8c] text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                    onClick={handleAddToWishlist}
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    Add to Wishlist
                  </Button>
                </div>
              </div>

              {/* Physical book details */}
              {!isEbookView && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <h3 className="font-medium">Delivery Information</h3>
                  <div className="flex items-start gap-2 text-gray-600">
                    <TruckIcon className="h-5 w-5 text-[#0a0a8c] mt-0.5" />
                    <div>
                      <p>Free shipping on orders over ₹2500</p>
                      <p className="text-sm text-gray-500">
                        Standard delivery: 3-5 working days
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* E-book details */}
              {isEbookView && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <h3 className="font-medium">E-Book Information</h3>
                  <div className="flex items-start gap-2 text-gray-600">
                    <Download className="h-5 w-5 text-[#0a0a8c] mt-0.5" />
                    <div>
                      <p>Instant download after purchase</p>
                      <p className="text-sm text-gray-500">
                        Access your e-book in your "My Books" section
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  {
                    icon: <TruckIcon className="h-6 w-6" />,
                    label: "Free Shipping",
                    desc: "Free shipping on orders over ₹2500",
                  },
                  {
                    icon: <ShieldCheck className="h-6 w-6" />,
                    label: "Secure Payment",
                    desc: "100% secure checkout",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-[#0a0a8c] bg-[#0a0a8c]/10 p-2 rounded-full">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-16">
            <div className="border-b border-gray-200">
              <h2 className="text-2xl font-bold text-[#0a0a8c] mb-4">
                Additional Information
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div>
                <h3 className="text-lg font-semibold text-[#0a0a8c] mb-4">
                  Book Details
                </h3>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Language:</span>
                    <span className="font-medium">
                      {currentProduct.language}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">
                      {currentProduct.category.name}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0a0a8c] mb-4">
                  Shipping Information
                </h3>
                <p className="text-gray-600">
                  Free shipping for orders over ₹2500. Standard delivery takes
                  3-5 business days. Express shipping available at checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
