"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import type { AppDispatch, RootState } from "@/store";
import { fetchOrders, updateOrderStatus } from "@/store/slices/orderSlice";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const order = orders.find((o) => o.id === id);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleStatusChange = async (status: string) => {
    try {
      await dispatch(updateOrderStatus({ id: order!.id, status })).unwrap();
      toast.success("Order status updated successfully");
    } catch (error) {
      toast.error(error as string);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#f26522]" />
          <p className="text-[#0a0a8c] font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-[#0a0a8c] font-medium mb-2">Order not found</p>
          <p className="text-gray-500">
            The order you are looking for does not exist
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-[#0a0a8c]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-2xl font-bold text-[#0a0a8c]">
            Order #{order.id}
          </h1>
          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
        </div>
        <Select
          value={order.status}
          onValueChange={handleStatusChange}
          disabled={order.status === "CANCELLED"}
        >
          <SelectTrigger className="w-[180px] border-[#0a0a8c]">
            <SelectValue placeholder="Update status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0a0a8c]">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Placed on {formatDate(order.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Payment Method: {order.paymentMethod}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Payment Status: {order.paymentStatus}
              </span>
            </div>
            {order.coupon && (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Coupon Applied: {order.coupon.code} (
                  {order.coupon.discountPercent}% off)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0a0a8c]">
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{order.user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{order.user.email}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <span className="text-sm">{order.address}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0a0a8c]">
              Shipment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.shipmentDetails ? (
              <>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Courier: {order.shipmentDetails.courierName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Tracking ID: {order.shipmentDetails.trackingId}
                  </span>
                </div>
                {order.shipmentDetails.trackingUrl && (
                  <Button
                    variant="outline"
                    className="w-full border-[#0a0a8c] text-[#0a0a8c]"
                    onClick={() =>
                      window.open(order.shipmentDetails.trackingUrl, "_blank")
                    }
                  >
                    Track Shipment
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">No shipment details yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-[#0a0a8c]">Order Items</CardTitle>
          <CardDescription>
            Total Amount: ₹{order.total.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item: any, index: number) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{item.product.title}</h4>
                    <p className="text-sm text-gray-500">
                      {item.isEbook ? "eBook" : "Physical Book"} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">₹{item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
