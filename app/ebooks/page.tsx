"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchProducts,
  setFilters,
  clearFilters,
} from "@/store/slices/productSlice";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, X } from "lucide-react";

export default function EBooksPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, filters } = useSelector(
    (state: RootState) => state.products
  );

  useEffect(() => {
    dispatch(fetchProducts({ ...filters, isEbook: true }));
  }, [dispatch, filters]);

  const handleSortChange = (value: string) => {
    dispatch(setFilters({ sort: value }));
  };

  const handleLanguageChange = (value: string) => {
    dispatch(setFilters({ language: value }));
  };

  const handlePriceChange = (value: number[]) => {
    dispatch(setFilters({ minPrice: value[0], maxPrice: value[1] }));
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
  };

  const ebooks = products.filter((product) => product.isEbook);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">E-Books</h1>
        <div className="flex items-center gap-4">
          <Select onValueChange={handleSortChange} value={filters.sort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
          {Object.keys(filters).length > 0 && (
            <Button variant="ghost" onClick={clearAllFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Language</h3>
            <Select
              onValueChange={handleLanguageChange}
              value={filters.language}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENGLISH">English</SelectItem>
                <SelectItem value="HINDI">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Price Range</h3>
            <Slider
              defaultValue={[0, 2000]}
              max={2000}
              step={50}
              onValueChange={handlePriceChange}
            />
            <div className="flex items-center justify-between mt-2 text-sm">
              <span>₹{filters.minPrice || 0}</span>
              <span>₹{filters.maxPrice || 2000}</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ebooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ebooks.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-muted-foreground">No e-books found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
