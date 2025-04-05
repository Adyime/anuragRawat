"use client";

import OrderCard from "@/components/OrderCard";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorAlert from "@/components/ErrorAlert";

const GET_USER_ORDERS = gql`
  query GetUserOrders {
    userOrders {
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
          price
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
        estimatedDelivery
        trackingUrl
      }
    }
  }
`;

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const { data, loading, error, refetch } = useQuery(GET_USER_ORDERS, {
    onCompleted: (data) => {
      console.log(
        "Order dates:",
        data?.userOrders?.map((order) => order.createdAt)
      );
    },
  });

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (!session) {
    redirect("/auth/signin?callbackUrl=/orders");
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorAlert
        message="Failed to fetch orders"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  const orders = data?.userOrders || [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
        <p className="text-gray-600 mb-4">
          Start shopping to see your orders here
        </p>
        <a
          href="/"
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Browse Products
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
      <div className="space-y-6">
        {orders.map((order: any) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
