export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  isEbook: boolean;
  product: Product;
}

export interface Coupon {
  code: string;
  discountPercent: number;
}

export interface ShipmentDetails {
  trackingId: string;
  provider: string;
  status: string;
  trackingUrl: string;
  awbCode: string;
  orderId: string;
  courierName: string;
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentMethod = "CASH_ON_DELIVERY" | "ONLINE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  address: string;
  createdAt: string;
  user: User;
  items: OrderItem[];
  coupon?: Coupon;
  shipmentDetails?: ShipmentDetails;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}
