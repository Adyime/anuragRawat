"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatDate,
  parseAddress,
  getOrderStatusColor,
} from "@/utils/formatters";

interface OrderCardProps {
  order: {
    id: string;
    total: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    address: string;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      price: number;
      isEbook: boolean;
      product: {
        id: string;
        title: string;
        images: string[];
      };
    }[];
    shipmentDetails?: {
      trackingId: string;
      trackingUrl: string;
    };
  };
}

export default function OrderCard({ order }: OrderCardProps) {
  const formattedDate = formatDate(order.createdAt);
  const address = parseAddress(order.address);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold">
              Order #{order.id.slice(-8)}
            </h3>
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

        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative h-20 w-20 flex-shrink-0">
                <Image
                  src={item.product.images[0]}
                  alt={item.product.title}
                  fill
                  className="object-cover rounded-md"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{item.product.title}</h4>
                <p className="text-sm text-gray-600">
                  {item.isEbook ? "E-Book" : "Physical Book"} × {item.quantity}
                </p>
                <p className="text-sm font-medium">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Shipping Address</p>
              {address.name && <p className="font-medium">{address.name}</p>}
              <p className="text-sm text-gray-600">
                {address.address}
                {address.city && `, ${address.city}`}
              </p>
              {(address.state || address.pincode) && (
                <p className="text-sm text-gray-600">
                  {address.state}
                  {address.pincode && ` - ${address.pincode}`}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-bold">
                ₹{order.total.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            {order.shipmentDetails &&
              (order.status === "SHIPPED" || order.status === "DELIVERED") && (
                <a
                  href={order.shipmentDetails.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Track Order
                </a>
              )}
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
