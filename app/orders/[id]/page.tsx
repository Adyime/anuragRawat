"use client";

import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Image from "next/image";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorAlert from "@/components/ErrorAlert";
import {
  formatDate,
  parseAddress,
  getOrderStatusColor,
} from "@/utils/formatters";

const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($id: ID!) {
    order(id: $id) {
      id
      total
      status
      paymentMethod
      paymentStatus
      address
      createdAt
      items {
        id
        quantity
        price
        isEbook
        product {
          id
          title
          description
          images
          category {
            id
            name
          }
        }
      }
      coupon {
        id
        code
        discountPercent
      }
      shipmentDetails {
        trackingId
        provider
        status
        trackingUrl
        awbCode
        orderId
        courierName
      }
    }
  }
`;

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  isEbook: boolean;
  product: {
    id: string;
    title: string;
    description: string;
    images: string[];
    category: {
      id: string;
      name: string;
    };
  };
}

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const { data, loading, error } = useQuery(GET_ORDER_DETAILS, {
    variables: { id: params.id },
  });

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (!session) {
    redirect("/auth/signin?callbackUrl=/orders/" + params.id);
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorAlert
        message="Failed to fetch order details"
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const order = data?.order;
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-2xl font-semibold mb-2">Order not found</h2>
        <p className="text-gray-600 mb-4">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have permission to view it
        </p>
        <a
          href="/orders"
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          View All Orders
        </a>
      </div>
    );
  }

  const formattedDate = formatDate(order.createdAt);
  const address = parseAddress(order.address);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Order #{order.id.slice(-8)}
              </h1>
              <p className="text-gray-600">{formattedDate}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(
                  order.paymentStatus
                )}`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item: OrderItem) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.title}
                        fill
                        className="object-cover rounded-md"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{item.product.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.product.category.name} •{" "}
                        {item.isEbook ? "E-Book" : "Physical Book"}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="font-medium">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                <div className="p-4 border border-gray-200 rounded-lg">
                  {address.name && (
                    <p className="font-medium mb-1">{address.name}</p>
                  )}
                  <p className="text-gray-600">
                    {address.address}
                    {address.city && `, ${address.city}`}
                  </p>
                  {(address.state || address.pincode) && (
                    <p className="text-gray-600">
                      {address.state}
                      {address.pincode && ` - ${address.pincode}`}
                    </p>
                  )}
                  {address.phone && (
                    <p className="text-gray-600 mt-2">Phone: {address.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-medium">
                        {order.paymentMethod === "CASH_ON_DELIVERY"
                          ? "Cash on Delivery"
                          : "Online Payment"}
                      </span>
                    </div>
                    {order.coupon && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coupon Applied</span>
                        <span className="font-medium text-green-600">
                          {order.coupon.code} ({order.coupon.discountPercent}%
                          OFF)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium">Total Amount</span>
                      <span className="text-xl font-bold">
                        ₹{order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {order.shipmentDetails &&
              (order.status === "SHIPPED" || order.status === "DELIVERED") && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Shipment Details
                  </h2>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking ID</span>
                        <span className="font-medium">
                          {order.shipmentDetails.trackingId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Courier</span>
                        <span className="font-medium">
                          {order.shipmentDetails.provider}
                        </span>
                      </div>
                      {order.shipmentDetails.estimatedDelivery && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Estimated Delivery
                          </span>
                          <span className="font-medium">
                            {formatDate(
                              order.shipmentDetails.estimatedDelivery
                            )}
                          </span>
                        </div>
                      )}
                      <div className="pt-2">
                        <a
                          href={order.shipmentDetails.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Track Shipment
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
