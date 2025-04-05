"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchProducts,
  setFilters,
  resetFilters,
} from "@/store/slices/productSlice";
import { fetchCategories } from "@/store/slices/categorySlice";
import { ArrowRight, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";

export default function BooksPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error, filters } = useSelector(
    (state: RootState) => state.products
  );
  const { categories, loading: categoriesLoading } = useSelector(
    (state: RootState) => state.categories
  );

  const [priceRange, setPriceRange] = useState<number[]>([0, 2000]);
  const [categorySearch, setCategorySearch] = useState("");
  const [formatType, setFormatType] = useState<"book" | "ebook">("book");

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  // Initial data fetch
  useEffect(() => {
    // Initial fetch should be controlled by the format type
    Promise.all([
      dispatch(fetchProducts({ isEbook: formatType === "ebook" })),
      dispatch(fetchCategories()),
    ]);
  }, [dispatch, formatType]);

  const handleCategoryChange = (value: string) => {
    dispatch(
      setFilters({
        ...filters,
        category: value === "all" ? undefined : value,
      })
    );
  };

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    dispatch(
      setFilters({
        ...filters,
        minPrice: value[0],
        maxPrice: value[1],
      })
    );
  };

  const handleFormatChange = (format: "book" | "ebook") => {
    setFormatType(format);
    // Reset filters and set the isEbook filter based on the selected format
    dispatch(resetFilters());
    dispatch(setFilters({ isEbook: format === "ebook" }));
  };

  const clearAllFilters = () => {
    setPriceRange([0, 2000]);
    dispatch(resetFilters());
    // Maintain the current format type when clearing filters
    dispatch(setFilters({ isEbook: formatType === "ebook" }));
  };

  if (loading || categoriesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <BookOpen className="h-12 w-12 animate-pulse text-[#f26522]" />
          <p className="text-[#0a0a8c] font-medium">Loading books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md p-8 rounded-xl bg-red-50 border border-red-100 text-center">
          <p className="text-red-500 font-medium text-lg mb-2">
            Error loading books
          </p>
          <p className="text-red-400 text-sm mb-4 whitespace-pre-wrap">
            {error}
          </p>
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => {
                dispatch(resetFilters());
                dispatch(setFilters({ isEbook: false }));
                dispatch(fetchProducts({ isEbook: false }));
              }}
              className="mt-4 bg-red-500 hover:bg-red-600"
            >
              Try Again with Default Filters
            </Button>

            <Button
              onClick={() => {
                window.location.reload();
              }}
              variant="outline"
              className="border-red-300 text-red-500"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Books Header Section */}
      <section className="bg-gradient-to-r from-[#0a0a8c]/10 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h1 className="text-4xl font-bold text-[#0a0a8c]">
              <span className="bg-[#f26522]/10 p-2 rounded-full text-[#f26522] mr-3 inline-block">
                <BookOpen className="h-8 w-8" />
              </span>
              Our Book Collection
            </h1>
            <Button
              variant="outline"
              className="border-[#0a0a8c] text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
              onClick={clearAllFilters}
            >
              Clear Filters
            </Button>
          </div>

          {/* Format Toggle */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Format:</span>
            <div className="flex rounded-md overflow-hidden border border-[#0a0a8c]">
              <button
                onClick={() => handleFormatChange("book")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  formatType === "book"
                    ? "bg-[#0a0a8c] text-white"
                    : "bg-white text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                }`}
              >
                Physical Books
              </button>
              <button
                onClick={() => handleFormatChange("ebook")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  formatType === "ebook"
                    ? "bg-[#0a0a8c] text-white"
                    : "bg-white text-[#0a0a8c] hover:bg-[#0a0a8c]/5"
                }`}
              >
                E-Books
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Books Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div>
                <h3 className="font-semibold mb-4 text-[#0a0a8c]">Category</h3>
                <Select
                  onValueChange={handleCategoryChange}
                  value={filters.category || "all"}
                >
                  <SelectTrigger className="border-[#0a0a8c]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="border-[#0a0a8c]"
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      <SelectGroup>
                        <SelectItem value="all">All categories</SelectItem>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                        {filteredCategories.length === 0 && (
                          <div className="py-2 px-3 text-sm text-gray-500">
                            No categories found
                          </div>
                        )}
                      </SelectGroup>
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-[#0a0a8c]">
                  Price Range
                </h3>
                <div className="space-y-4">
                  <Slider
                    defaultValue={[0, 2000]}
                    value={priceRange}
                    max={2000}
                    step={50}
                    onValueChange={handlePriceRangeChange}
                    className="my-6"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Books Grid */}
            <div className="md:col-span-3">
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border border-gray-100 p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No books found</p>
                  <Button onClick={clearAllFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[3/4] w-full relative overflow-hidden bg-gray-100">
                        <Image
                          src={
                            product.images[0] ||
                            "https://via.placeholder.com/300x400?text=No+Image"
                          }
                          alt={product.title}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                        />
                        {product.discountedPrice && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {Math.round(
                              ((product.price - product.discountedPrice) /
                                product.price) *
                                100
                            )}
                            % OFF
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-[#0a0a8c]">
                          {product.category.name}
                        </p>
                        <h3 className="font-medium text-gray-900 mt-1 line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center mt-2">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-600">
                            {product.reviews.length > 0
                              ? (
                                  product.reviews.reduce(
                                    (acc, review) => acc + review.rating,
                                    0
                                  ) / product.reviews.length
                                ).toFixed(1)
                              : "No reviews"}
                          </span>
                        </div>

                        {/* Format and Price Section */}
                        <div className="mt-3">
                          {/* If current format is book, show physical book price */}
                          {formatType === "book" && (
                            <div className="mb-2">
                              {product.discountedPrice ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-[#f26522]">
                                    ₹{product.discountedPrice}
                                  </span>
                                  <span className="text-sm line-through text-gray-400">
                                    ₹{product.price}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-[#f26522]">
                                  ₹{product.price}
                                </span>
                              )}
                            </div>
                          )}

                          {/* If current format is ebook, show ebook price */}
                          {formatType === "ebook" && (
                            <div className="mb-2">
                              {product.ebookDiscounted ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-[#f26522]">
                                    ₹{product.ebookDiscounted}
                                  </span>
                                  <span className="text-sm line-through text-gray-400">
                                    ₹{product.ebookPrice}
                                  </span>
                                </div>
                              ) : product.ebookPrice ? (
                                <span className="text-lg font-bold text-[#f26522]">
                                  ₹{product.ebookPrice}
                                </span>
                              ) : (
                                <span className="text-lg font-bold text-[#f26522]">
                                  Free
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* View Button with Format Parameter */}
                        <div className="mt-2 flex justify-end">
                          <Link
                            href={`/books/${product.id}?format=${formatType}`}
                          >
                            <Button
                              variant="ghost"
                              className="text-[#0a0a8c] p-0 h-auto"
                            >
                              View <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
