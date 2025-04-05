import { NextResponse } from "next/server";

// Mock product data
const mockProducts = [
  {
    id: "mock1",
    title: "Test Book 1",
    description: "This is a test book for debugging",
    price: 500,
    discountedPrice: 450,
    isEbook: false,
    stock: 10,
    language: "ENGLISH",
    images: ["/placeholder.svg"],
    category: {
      id: "cat1",
      name: "Programming",
    },
    reviews: [],
  },
  {
    id: "mock2",
    title: "Test Book 2",
    description: "Another test book for debugging",
    price: 750,
    discountedPrice: null,
    isEbook: false,
    stock: 5,
    language: "HINDI",
    images: ["/placeholder.svg"],
    category: {
      id: "cat2",
      name: "Fiction",
    },
    reviews: [],
  },
];

export async function GET() {
  console.log("Test products API called");

  // Return the mock data
  return NextResponse.json({
    products: mockProducts,
  });
}
