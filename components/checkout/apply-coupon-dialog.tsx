"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { gql, useLazyQuery } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
});

const VALIDATE_COUPON = gql`
  query ValidateCoupon($code: String!, $total: Float!) {
    validateCoupon(code: $code, total: $total) {
      id
      code
      description
      discountPercent
      maxDiscount
      minOrderValue
    }
  }
`;

interface ApplyCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onApplyCoupon: (coupon: any) => void;
}

export function ApplyCouponDialog({
  open,
  onOpenChange,
  total,
  onApplyCoupon,
}: ApplyCouponDialogProps) {
  const { toast } = useToast();
  const [validCoupon, setValidCoupon] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  const [validateCoupon, { loading }] = useLazyQuery(VALIDATE_COUPON, {
    onCompleted: (data) => {
      if (data.validateCoupon) {
        setValidCoupon(data.validateCoupon);
        toast({
          title: "Success",
          description: `Coupon "${data.validateCoupon.code}" applied successfully!`,
        });
      }
    },
    onError: (error) => {
      setValidCoupon(null);
      toast({
        title: "Invalid Coupon",
        description: error.message || "This coupon cannot be applied",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await validateCoupon({
        variables: {
          code: values.code.trim(),
          total,
        },
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleApplyCoupon = () => {
    if (validCoupon) {
      onApplyCoupon(validCoupon);
      onOpenChange(false);
      form.reset();
      setValidCoupon(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Coupon</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Code</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input
                        {...field}
                        placeholder="Enter your coupon code"
                        className="uppercase"
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        className="ml-2"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {validCoupon && (
              <div className="rounded-lg border p-4 mt-4 bg-green-50">
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-medium text-green-800">
                      {validCoupon.code}
                    </h4>
                    {validCoupon.description && (
                      <p className="text-sm text-green-700 mt-1">
                        {validCoupon.description}
                      </p>
                    )}
                    <p className="text-sm text-green-700 mt-1">
                      {validCoupon.discountPercent}% off (max ₹
                      {validCoupon.maxDiscount})
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setValidCoupon(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApplyCoupon}
                disabled={!validCoupon}
              >
                Apply Coupon
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
