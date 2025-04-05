"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ShoppingCart,
  Search,
  User,
  Menu,
  Heart,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/store/slices/userSlice";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { setFilters } from "@/store/slices/productSlice";
import Image from "next/image";
import { fetchCart } from "@/store/slices/cartSlice";
import items from "razorpay/dist/types/items";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { data: session } = useSession();
  const { cart } = useSelector((state: any) => state.cart);
  const cartItemsCount = cart?.items?.length || 0;
  const { items: wishlistItems } = useSelector((state: any) => state.wishlist);
  const { profile } = useSelector((state: any) => state.user);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (session) {
      dispatch(fetchCart());
    }
  }, [dispatch, session]);

  const isActive = (path: string) =>
    pathname === path
      ? "text-[#0a0a8c] font-semibold"
      : "text-gray-600 hover:text-[#0a0a8c] transition-colors";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    dispatch(logout());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      dispatch(setFilters({ search: searchQuery.trim() }));
      if (pathname !== "/books") {
        router.push("/books");
      }
    }
  };

  // Use session data if available, fallback to Redux profile
  const user = session?.user || profile;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Main Container with Flexbox */}
        <div className="flex items-center w-full gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/Images/dev.jpg"
              alt="BookWorm Logo"
              width={120}
              height={40}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm ml-4">
            <Link href="/books" className={isActive("/books")}>
              Books
            </Link>
            <Link href="/categories" className={isActive("/categories")}>
              Categories
            </Link>
            <Link href="/bestsellers" className={isActive("/bestsellers")}>
              Bestsellers
            </Link>
            <Link href="/deals" className={isActive("/deals")}>
              Deals
            </Link>
          </nav>

          {/* Spacer to push search and actions to the right */}
          <div className="flex-grow"></div>

          {/* Search Bar */}
          <div className="hidden md:block w-[250px] mr-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 border-gray-300 focus:ring-[#f26522] focus:border-[#f26522]"
              />
            </form>
          </div>

          {/* Action Buttons */}
          <nav className="flex items-center gap-2">
            {/* Wishlist Button */}
            <Link href="/wishlist">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-[#f26522]/10"
              >
                <Heart className="h-5 w-5 text-[#0a0a8c]" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[#f26522] text-[10px] font-medium text-white flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart Button */}
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-5 w-5 text-[#0a0a8c]" />
              {cartItemsCount > 0 && (
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[#f26522] text-[10px] font-medium text-white flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Profile/Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-[#f26522]/10"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "Profile"}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#f26522] text-white flex items-center justify-center text-sm font-medium">
                        {user.name?.[0]?.toUpperCase() ||
                          (user.email && user.email[0].toUpperCase()) ||
                          "U"}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.name || user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      My Orders
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/signin">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-[#f26522]/10"
                >
                  <User className="h-5 w-5 text-[#0a0a8c]" />
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5 text-[#0a0a8c]" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
