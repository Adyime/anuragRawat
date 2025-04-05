"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  updateProfile,
  fetchUserOrders,
  fetchUserAddresses,
} from "@/store/slices/userSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  User,
  MapPin,
  Phone,
  Mail,
  Plus,
  Edit,
  Star,
  ShoppingBag,
  BookOpen,
  Heart,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { AddressDialog } from "@/components/profile/address-dialog";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
});

export default function ProfilePage() {
  const { data: session } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const { profile, addresses, orders, loading } = useSelector(
    (state: RootState) => state.user
  );
  const { items: wishlistItems = [] } = useSelector(
    (state: RootState) => state.wishlist
  );
  const { cart } = useSelector((state: RootState) => state.cart);
  const cartItems = cart?.items || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    },
  });

  useEffect(() => {
    if (session?.user) {
      form.reset({
        name: session.user.name || "",
        email: session.user.email || "",
      });
      dispatch(fetchUserOrders());
      dispatch(fetchUserAddresses());
    }
  }, [session, form, dispatch]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await dispatch(updateProfile(values)).unwrap();
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#f26522]" />
          <p className="text-[#0a0a8c] font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-[#f26522] text-white flex items-center justify-center text-3xl font-medium">
              {session?.user?.name?.[0]?.toUpperCase() ||
                session?.user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0a0a8c]">
                {session?.user?.name || "Welcome"}
              </h1>
              <p className="text-gray-600">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <ShoppingBag className="h-5 w-5" />,
              label: "Orders",
              value: orders.length.toString(),
              href: "/orders",
            },
            {
              icon: <Heart className="h-5 w-5" />,
              label: "Wishlist",
              value: wishlistItems.length.toString(),
              href: "/wishlist",
            },
            {
              icon: <ShoppingBag className="h-5 w-5" />,
              label: "Cart Items",
              value: cartItems.length.toString(),
              href: "/cart",
            },
            {
              icon: <BookOpen className="h-5 w-5" />,
              label: "My E-Books",
              value: "View",
              href: "/profile/my-books",
            },
          ].map((stat, index) => (
            <Link
              key={index}
              href={stat.href}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#f26522]/20 hover:bg-[#f26522]/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#f26522]/10 text-[#f26522]">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#0a0a8c]">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Profile Information */}
          <Card className="md:col-span-2 border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#0a0a8c]/10 to-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#f26522]" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="border-gray-200 focus:border-[#f26522] focus:ring-[#f26522]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            className="border-gray-200 bg-gray-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#f26522] hover:bg-[#f26522]/90 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#0a0a8c]/10 to-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#f26522]" />
                  <CardTitle>Addresses</CardTitle>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAddressDialog(true)}
                  className="border-[#f26522] text-[#f26522] hover:bg-[#f26522]/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </div>
              <CardDescription>Manage your delivery addresses</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {loading ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#f26522]" />
                  </div>
                ) : addresses.length > 0 ? (
                  addresses.map((address) => (
                    <div
                      key={address.id}
                      className="rounded-xl border border-gray-200 p-4 hover:border-[#f26522]/20 hover:bg-[#f26522]/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-[#0a0a8c]">
                            {address.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.phone}
                          </p>
                        </div>
                        {address.isDefault && (
                          <span className="text-xs bg-[#f26522]/10 text-[#f26522] px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <Separator className="my-2" />
                      <p className="text-sm text-gray-600">
                        {address.street}, {address.city}, {address.state} -{" "}
                        {address.pincode}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">
                      No addresses found
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Add a new address to get started
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddressDialog(true)}
                      className="border-[#f26522] text-[#f26522] hover:bg-[#f26522]/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Address
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddressDialog
        open={showAddressDialog}
        onOpenChange={setShowAddressDialog}
      />
    </div>
  );
}
