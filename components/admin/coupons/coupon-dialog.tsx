"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  description: z.string().optional(),
  discountPercent: z.coerce
    .number()
    .min(0, "Discount must be positive")
    .max(100, "Discount cannot exceed 100%"),
  maxDiscount: z.coerce.number().min(0, "Maximum discount must be positive"),
  minOrderValue: z.coerce
    .number()
    .min(0, "Minimum order value must be positive"),
  usageLimit: z.coerce.number().min(1, "Usage limit must be at least 1"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean(),
  categoryId: z.string().nullable(),
});

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`;

const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CouponInput!) {
    createCoupon(input: $input) {
      id
      code
    }
  }
`;

const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: ID!, $input: CouponInput!) {
    updateCoupon(id: $id, input: $input) {
      id
      code
    }
  }
`;

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  coupon?: any;
}

export function CouponDialog({
  open,
  onOpenChange,
  onSuccess,
  coupon,
}: CouponDialogProps) {
  const { toast } = useToast();

  // Get today's date and 30 days from now in YYYY-MM-DD format
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      description: "",
      discountPercent: 0,
      maxDiscount: 0,
      minOrderValue: 0,
      usageLimit: 1,
      startDate: today.toISOString().split("T")[0],
      endDate: thirtyDaysFromNow.toISOString().split("T")[0],
      isActive: true,
      categoryId: null,
    },
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);

  const [createCoupon, { loading: createLoading }] = useMutation(
    CREATE_COUPON,
    {
      onCompleted: () => {
        toast({
          title: "Success",
          description: "Coupon created successfully",
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  const [updateCoupon, { loading: updateLoading }] = useMutation(
    UPDATE_COUPON,
    {
      onCompleted: () => {
        toast({
          title: "Success",
          description: "Coupon updated successfully",
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  useEffect(() => {
    if (coupon) {
      try {
        // Helper function to parse and validate date
        const parseDateSafely = (dateString: string | null | undefined) => {
          if (!dateString) return new Date();

          try {
            // Try parsing the ISO string first
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
              return date;
            }

            // If that fails, try parsing other formats
            const [year, month, day] = dateString.split(/[-T]/);
            const parsedDate = new Date(
              Number(year),
              Number(month) - 1,
              Number(day)
            );
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate;
            }

            console.warn("Could not parse date:", dateString);
            return new Date();
          } catch (error) {
            console.error("Error parsing date:", error);
            return new Date();
          }
        };

        // Format date to YYYY-MM-DD
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        // Parse dates safely
        const startDate = parseDateSafely(coupon.startDate);
        const endDate = parseDateSafely(coupon.endDate);

        form.reset({
          code: coupon.code || "",
          description: coupon.description || "",
          discountPercent: coupon.discountPercent || 0,
          maxDiscount: coupon.maxDiscount || 0,
          minOrderValue: coupon.minOrderValue || 0,
          usageLimit: coupon.usageLimit || 1,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          isActive: coupon.isActive ?? true,
          categoryId: coupon.category?.id || null,
        });
      } catch (error) {
        console.error("Error parsing dates:", error);
        // Set default dates if parsing fails
        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        form.reset({
          code: coupon.code || "",
          description: coupon.description || "",
          discountPercent: coupon.discountPercent || 0,
          maxDiscount: coupon.maxDiscount || 0,
          minOrderValue: coupon.minOrderValue || 0,
          usageLimit: coupon.usageLimit || 1,
          startDate: today.toISOString().split("T")[0],
          endDate: thirtyDaysFromNow.toISOString().split("T")[0],
          isActive: coupon.isActive ?? true,
          categoryId: coupon.category?.id || null,
        });

        toast({
          title: "Warning",
          description:
            "Some dates were invalid and have been reset to defaults.",
          variant: "default",
        });
      }
    } else {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      form.reset({
        code: "",
        description: "",
        discountPercent: 0,
        maxDiscount: 0,
        minOrderValue: 0,
        usageLimit: 1,
        startDate: today.toISOString().split("T")[0],
        endDate: thirtyDaysFromNow.toISOString().split("T")[0],
        isActive: true,
        categoryId: null,
      });
    }
  }, [coupon, form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Parse and validate dates with timezone handling
      const startDate = new Date(values.startDate);
      const endDate = new Date(values.endDate);

      // Ensure dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date format");
      }

      // Set time to start of day for startDate and end of day for endDate
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);

      if (endDate < startDate) {
        throw new Error("End date must be after start date");
      }

      const input = {
        ...values,
        code: values.code.toUpperCase(),
        categoryId: values.categoryId || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      if (coupon) {
        await updateCoupon({
          variables: {
            id: coupon.id,
            input,
          },
        });
      } else {
        await createCoupon({
          variables: {
            input,
          },
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit" : "Create"} Coupon</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SUMMER2025" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "all" ? null : value)
                      }
                      value={field.value || "all"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categoriesData?.categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Percentage</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Discount</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minOrderValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order Value</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Limit</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Enable or disable this coupon
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createLoading || updateLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading || updateLoading}>
                {createLoading || updateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : coupon ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
