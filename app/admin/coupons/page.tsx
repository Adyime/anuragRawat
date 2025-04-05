"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { DataTable } from "@/components/admin/coupons/data-table";
import { columns } from "@/components/admin/coupons/columns";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { CouponDialog } from "@/components/admin/coupons/coupon-dialog";

const GET_COUPONS = gql`
  query GetCoupons {
    coupons {
      id
      code
      description
      discountPercent
      maxDiscount
      minOrderValue
      usageLimit
      usedCount
      startDate
      endDate
      isActive
      category {
        id
        name
      }
    }
  }
`;

export default function CouponsPage() {
  const [open, setOpen] = useState(false);
  const { loading, error, data, refetch } = useQuery(GET_COUPONS, {
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coupons</h2>
          <p className="text-muted-foreground">Manage discount coupons</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      <DataTable columns={columns} data={data?.coupons || []} />

      <CouponDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          refetch();
          setOpen(false);
        }}
      />
    </div>
  );
}
