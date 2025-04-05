"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { fetchProducts } from "@/store/slices/productSlice";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  Loader2,
  Package,
  ShieldCheck,
  ShoppingCart,
  Star,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error } = useSelector(
    (state: RootState) => state.products
  );

  useEffect(() => {
    dispatch(fetchProducts({ sort: "newest" }));
  }, [dispatch]);

  const newArrivals = products.slice(0, 4);
  const featuredBooks = products.slice(4, 8);
  const bestSellers = products.slice(0, 3);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#f26522]" />
          <p className="text-[#0a0a8c] font-medium">
            Loading your bookstore...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md p-8 rounded-xl bg-red-50 border border-red-100 text-center">
          <p className="text-red-500 font-medium text-lg">Error: {error}</p>
          <Button
            onClick={() => dispatch(fetchProducts({ sort: "newest" }))}
            className="mt-4 bg-red-500 hover:bg-red-600"
          >
            Try Again
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

      {/* Hero Section with Featured Product */}
      <section className="relative bg-gradient-to-r from-[#0a0a8c]/10 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-[#f26522]/10 text-[#f26522] px-4 py-1 rounded-full text-sm font-semibold">
                Limited Time Offer
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#0a0a8c] leading-tight">
                Summer Reading Sale: 30% Off Bestsellers
              </h1>
              <p className="text-lg text-gray-700">
                Discover your next favorite book at unbeatable prices. Our
                summer collection features award-winning titles from renowned
                authors.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-sm">(2,500+ reviews)</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-[#f26522] hover:bg-[#f26522]/90 text-white font-semibold text-lg"
                  asChild
                >
                  <Link href="/books">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Shop Now
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#0a0a8c] text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                  asChild
                >
                  <Link href="/bestsellers">View Bestsellers</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1507842217343-583bb7270b66"
                  alt="Featured Books Collection"
                  width={800}
                  height={600}
                  className="w-full h-[300px] sm:h-[400px] object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white font-bold text-xl">
                        Summer Collection
                      </p>
                      <p className="text-white/80">Starting at ₹899</p>
                    </div>
                    <div className="bg-white text-[#f26522] font-bold text-xl px-4 py-2 rounded-full">
                      -30%
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#f26522] text-white px-4 py-2 rounded-lg shadow-lg z-20 font-semibold">
                Limited Stock!
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Today's Deals */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a0a8c] flex items-center">
              <span className="bg-[#f26522]/10 p-2 rounded-full text-[#f26522] mr-3">
                <ShoppingCart className="h-6 w-6" />
              </span>
              Today&apos;s Best Deals
            </h2>
            <div className="hidden sm:block">
              <div className="bg-[#0a0a8c]/10 px-4 py-2 rounded-lg text-[#0a0a8c] font-semibold">
                Ends in: 23:45:12
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bestSellers.map((product, index) => (
              <div
                key={product.id}
                className="group relative bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="absolute top-4 left-4 z-10 bg-[#f26522] text-white text-sm font-bold px-2 py-1 rounded">
                  SAVE 25%
                </div>
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
                  <p className="text-gray-500 text-sm mb-3">
                    {product.category.name}
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
                      size="sm"
                      className="bg-[#0a0a8c] hover:bg-[#0a0a8c]/90 text-white rounded-full"
                      asChild
                    >
                      <Link href={`/books/${product.id}`}>
                        <ShoppingCart className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              className="bg-[#0a0a8c] hover:bg-[#0a0a8c]/90 text-white px-8"
              asChild
            >
              <Link href="/deals">
                View All Deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a0a8c] flex items-center">
              <span className="bg-[#f26522]/10 p-2 rounded-full text-[#f26522] mr-3">
                <BookOpen className="h-6 w-6" />
              </span>
              New Arrivals
            </h2>
            <Button
              variant="ghost"
              className="text-[#0a0a8c] hover:bg-[#0a0a8c]/10"
              asChild
            >
              <Link href="/new-arrivals">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((product, index) => (
              <div
                key={product.id}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    NEW
                  </div>
                )}
                <div className="h-48 sm:h-56 overflow-hidden">
                  <Image
                    src={product.images[0] || `/placeholder.svg`}
                    alt={product.title}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-medium text-sm sm:text-base mb-1 text-gray-800 line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm mb-2">
                    {product.category.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#0a0a8c] font-semibold">
                      ₹{product.discountedPrice || product.price}
                    </span>
                    <Button
                      size="sm"
                      className="bg-[#f26522] hover:bg-[#f26522]/90 text-white h-8 w-8 rounded-full p-0"
                      asChild
                    >
                      <Link href={`/books/${product.id}`}>
                        <ShoppingCart className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a0a8c] flex items-center">
              <span className="bg-[#f26522]/10 p-2 rounded-full text-[#f26522] mr-3">
                <Star className="h-6 w-6" />
              </span>
              Featured Books
            </h2>
            <Button
              variant="ghost"
              className="text-[#0a0a8c] hover:bg-[#0a0a8c]/10"
              asChild
            >
              <Link href="/featured">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredBooks.map((product, index) => (
              <div
                key={product.id}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 sm:h-56 overflow-hidden">
                  <Image
                    src={product.images[0] || `/placeholder.svg`}
                    alt={product.title}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < 4
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-300 text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <h3 className="font-medium text-sm sm:text-base mb-1 text-gray-800 line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm mb-2">
                    {product.category.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#0a0a8c] font-semibold">
                      ₹{product.discountedPrice || product.price}
                    </span>
                    <Button
                      size="sm"
                      className="bg-[#f26522] hover:bg-[#f26522]/90 text-white h-8 w-8 rounded-full p-0"
                      asChild
                    >
                      <Link href={`/books/${product.id}`}>
                        <ShoppingCart className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a0a8c] flex items-center">
              <span className="bg-[#f26522]/10 p-2 rounded-full text-[#f26522] mr-3">
                <BookOpen className="h-6 w-6" />
              </span>
              Shop by Category
            </h2>
            <Button
              variant="ghost"
              className="text-[#0a0a8c] hover:bg-[#0a0a8c]/10"
              asChild
            >
              <Link href="/categories">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Fiction",
                desc: "Explore imaginative worlds",
                img: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1",
                count: "2,500+ books",
              },
              {
                title: "Non-Fiction",
                desc: "Discover real-world insights",
                img: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d",
                count: "1,800+ books",
              },
              {
                title: "Academic",
                desc: "Advance your knowledge",
                img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6",
                count: "1,200+ books",
              },
            ].map((category, index) => (
              <Link
                key={index}
                href={`/categories/${category.title.toLowerCase()}`}
                className="group relative h-64 rounded-xl overflow-hidden shadow-md"
              >
                <Image
                  src={category.img || "/placeholder.svg"}
                  alt={category.title}
                  width={600}
                  height={400}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white text-xl font-bold mb-1">
                    {category.title}
                  </h3>
                  <p className="text-white/80 text-sm mb-3">{category.desc}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-xs">
                      {category.count}
                    </span>
                    <span className="bg-white text-[#0a0a8c] rounded-full px-3 py-1 text-xs font-medium group-hover:bg-[#f26522] group-hover:text-white transition-colors duration-300">
                      Shop Now
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a0a8c]">
              What Our Customers Say
            </h2>
            <p className="text-gray-600 mt-2">
              Trusted by thousands of book lovers worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Johnson",
                role: "Avid Reader",
                quote:
                  "The selection of books is amazing and the delivery was super fast. I've found so many hidden gems that I wouldn't have discovered elsewhere!",
                rating: 5,
              },
              {
                name: "Michael Chen",
                role: "Book Collector",
                quote:
                  "I've been ordering from this store for years. Their customer service is exceptional and the books always arrive in perfect condition.",
                rating: 5,
              },
              {
                name: "Emily Rodriguez",
                role: "Literature Student",
                quote:
                  "As a literature student, I need specific editions. This store always has what I need at reasonable prices. Highly recommended!",
                rating: 4,
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="bg-gray-50 p-6 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-300 text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">{testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="bg-[#0a0a8c] text-white h-10 w-10 rounded-full flex items-center justify-center font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {testimonial.name}
                    </p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter with Discount */}
      <section className="py-12 bg-[#0a0a8c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-block bg-[#f26522]/10 text-[#f26522] px-4 py-1 rounded-full text-sm font-semibold mb-4">
                  EXCLUSIVE OFFER
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#0a0a8c] mb-4">
                  Get 20% Off Your First Order
                </h2>
                <p className="text-gray-600 mb-6">
                  Subscribe to our newsletter and receive a special discount
                  code for your first purchase. Stay updated with new releases
                  and exclusive deals.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="px-4 py-3 rounded-lg border border-gray-300 flex-grow focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                  />
                  <Button className="bg-[#f26522] hover:bg-[#f26522]/90 text-white font-semibold">
                    Subscribe & Save
                  </Button>
                </div>
                <p className="text-gray-500 text-xs mt-3">
                  By subscribing, you agree to receive marketing emails. You can
                  unsubscribe at any time.
                </p>
              </div>
              <div className="hidden md:block relative">
                <Image
                  src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d"
                  alt="Books collection"
                  width={600}
                  height={400}
                  className="rounded-xl shadow-lg"
                />
                <div className="absolute -top-6 -right-6 bg-[#f26522] text-white text-xl font-bold h-20 w-20 rounded-full flex items-center justify-center transform rotate-12">
                  20% OFF
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
