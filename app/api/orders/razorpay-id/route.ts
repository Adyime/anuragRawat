import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get order ID from request body
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find the order in the database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        razorpayOrderId: true,
      },
    });

    // Check if order exists and belongs to the user
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== token.sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if razorpayOrderId exists
    if (!order.razorpayOrderId) {
      return NextResponse.json(
        { error: "Razorpay order ID not found for this order" },
        { status: 404 }
      );
    }

    // Return the razorpayOrderId
    return NextResponse.json({
      razorpayOrderId: order.razorpayOrderId,
    });
  } catch (error) {
    console.error("Error fetching Razorpay order ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch Razorpay order ID" },
      { status: 500 }
    );
  }
} 