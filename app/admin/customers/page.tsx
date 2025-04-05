"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchCustomers } from "@/store/slices/customerSlice";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";

export default function CustomersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { customers, loading, error } = useSelector(
    (state: RootState) => state.customers
  );

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          onClick={() => dispatch(fetchCustomers())}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Customers</h1>
      <DataTable columns={columns} data={customers} />
    </div>
  );
}
