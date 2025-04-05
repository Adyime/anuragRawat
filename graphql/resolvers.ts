import { prisma } from "@/lib/prisma";
import { GraphQLError } from "graphql";
import {
  Language,
  Prisma,
  OrderStatus,
  PaymentStatus,
  PrismaClient,
  Order,
} from "@prisma/client";
import Razorpay from "razorpay";
import { shiprocket } from "@/lib/shiprocket";
import crypto from "crypto";
import { cartQueries, cartMutations } from "./cart";
import bcrypt from "bcryptjs";
import { User } from "lucide-react";
import products from "razorpay/dist/types/products";
import { any } from "zod";
import items from "razorpay/dist/types/items";
import axios from "axios";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET!,
});

console.log("Razorpay initialized with:", {
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET ? "[SECRET]" : "undefined",
});

interface Context {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  prisma: PrismaClient;
  isAuthenticated: boolean;
}

interface OrderInput {
  items: {
    productId: string;
    quantity: number;
    isEbook: boolean;
  }[];
  addressId: string;
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE";
  couponCode?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

interface OrderItemInput {
  productId: string;
  quantity: number;
  isEbook: boolean;
}

interface ValidateCouponArgs {
  code: string;
  total: number;
}

interface CategoryInput {
  name: string;
  description?: string;
}

interface SubcategoryInput extends CategoryInput {
  categoryId: string;
}

interface ProductInput {
  title: string;
  description: string;
  price: number;
  discountedPrice?: number;
  isEbook: boolean;
  ebookPrice?: number;
  ebookDiscounted?: number;
  isFree: boolean;
  language: Language;
  stock: number;
  images: string[];
  pdfUrl?: string;
  categoryId: string;
  subcategoryId?: string;
}

interface CouponInput {
  code: string;
  description?: string;
  discountPercent: number;
  maxDiscount: number;
  minOrderValue: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  categoryId?: string;
}

interface ReviewInput {
  productId: string;
  rating: number;
  comment?: string;
}

interface AddressInput {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

interface ProfileInput {
  name?: string;
  image?: string;
}

interface PaymentVerificationInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

interface ProductFilterInput {
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  language?: Language;
  isEbook?: boolean;
  sort?: "price_asc" | "price_desc" | "newest";
}

interface ShipmentDetails {
  trackingId: string;
  provider: string;
  status: number;
  trackingUrl: string;
  awbCode: string;
  orderId: string;
  courierName: string;
}

interface CartItem {
  product: {
    ebookDiscounted?: number | null;
    ebookPrice?: number | null;
    discountedPrice?: number | null;
    price: number;
  };
  isEbook: boolean;
  quantity: number;
}

const calculateCartTotal = (items: CartItem[]) => {
  return items.reduce((total, item) => {
    let price = item.product.price; // Default to regular price
    if (item.isEbook) {
      price =
        item.product.ebookDiscounted ||
        item.product.ebookPrice ||
        item.product.price;
    } else {
      price = item.product.discountedPrice || item.product.price;
    }
    return total + price * item.quantity;
  }, 0);
};

export const resolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, { user }: Context) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      return prisma.user.findUnique({
        where: { id: user.id },
        include: {
          orders: true,
          addresses: true,
        },
      });
    },

    customers: async (_parent: unknown, _args: unknown, { user }: Context) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      // Check if user is an admin
      const userWithRole = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!userWithRole || userWithRole.role !== "ADMIN") {
        throw new GraphQLError("Not authorized. Admin access required.");
      }

      try {
        const customers = await prisma.user.findMany({
          where: {
            role: "USER", // Only fetch users, not admins
          },
          include: {
            orders: {
              include: {
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
            reviews: {
              include: {
                product: true,
              },
            },
            addresses: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Format dates and ensure all required fields are present
        return customers.map((customer) => ({
          ...customer,
          createdAt: customer.createdAt.toISOString(),
          orders: customer.orders.map((order) => ({
            ...order,
            createdAt: order.createdAt.toISOString(),
          })),
          reviews: customer.reviews.map((review) => ({
            ...review,
            createdAt: review.createdAt.toISOString(),
          })),
          // Ensure required fields from the User type are present
          name: customer.name || "",
          email: customer.email,
          image: customer.image || null,
          role: customer.role,
        }));
      } catch (error) {
        console.error("Error fetching customers:", error);
        throw new GraphQLError("Failed to fetch customers");
      }
    },

    orders: async (_parent: unknown, _args: unknown, { user }: Context) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      // Check if user is an admin
      const userWithRole = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!userWithRole || userWithRole.role !== "ADMIN") {
        throw new GraphQLError("Not authorized. Admin access required.");
      }

      try {
        return await prisma.order.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
            coupon: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw new GraphQLError("Failed to fetch orders");
      }
    },

    totalRevenue: async (
      _parent: unknown,
      _args: unknown,
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const result = await prisma.order.aggregate({
          _sum: {
            total: true,
          },
          where: {
            status: {
              not: "CANCELLED",
            },
          },
        });

        return result._sum.total || 0;
      } catch (error) {
        console.error("Error calculating total revenue:", error);
        throw new GraphQLError("Failed to calculate total revenue");
      }
    },

    totalOrders: async (
      _parent: unknown,
      _args: unknown,
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        return await prisma.order.count();
      } catch (error) {
        console.error("Error counting orders:", error);
        throw new GraphQLError("Failed to count orders");
      }
    },

    totalProducts: async (
      _parent: unknown,
      _args: unknown,
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        return await prisma.product.count();
      } catch (error) {
        console.error("Error counting products:", error);
        throw new GraphQLError("Failed to count products");
      }
    },

    totalCustomers: async (
      _parent: unknown,
      _args: unknown,
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        return await prisma.user.count({
          where: {
            role: "USER",
          },
        });
      } catch (error) {
        console.error("Error counting customers:", error);
        throw new GraphQLError("Failed to count customers");
      }
    },

    recentOrders: async (
      _parent: unknown,
      _args: unknown,
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        return await prisma.order.findMany({
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: true,
          },
        });
      } catch (error) {
        console.error("Error fetching recent orders:", error);
        throw new GraphQLError("Failed to fetch recent orders");
      }
    },

    salesOverview: async (
      _parent: unknown,
      _args: unknown,
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
            status: {
              not: "CANCELLED",
            },
          },
          select: {
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        const salesByDate = orders.reduce(
          (acc: { [key: string]: number }, order) => {
            const date = order.createdAt.toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + order.total;
            return acc;
          },
          {}
        );

        return Object.entries(salesByDate).map(([date, revenue]) => ({
          date,
          revenue,
        }));
      } catch (error) {
        console.error("Error calculating sales overview:", error);
        throw new GraphQLError("Failed to calculate sales overview");
      }
    },

    products: async (
      _parent: unknown,
      {
        search,
        category,
        language,
        minPrice,
        maxPrice,
        isEbook,
        sort,
      }: {
        search?: string;
        category?: string;
        language?: Language;
        minPrice?: number;
        maxPrice?: number;
        isEbook?: boolean;
        sort?: "newest" | "price_asc" | "price_desc";
      }
    ) => {
      try {
        console.log("Fetching products with filters:", {
          search,
          category,
          language,
          minPrice,
          maxPrice,
          isEbook,
          sort,
        });

        const where: Prisma.ProductWhereInput = {
          ...(search && {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(category && { categoryId: category }),
          ...(language && { language }),
          ...(isEbook !== undefined && { isEbook }),
          ...(minPrice !== undefined && { price: { gte: minPrice } }),
          ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
        };

        const orderBy: Prisma.ProductOrderByWithRelationInput = {
          ...(sort === "price_asc" && { price: "asc" }),
          ...(sort === "price_desc" && { price: "desc" }),
          ...(sort === "newest" && { createdAt: "desc" }),
        };

        const products = await prisma.product.findMany({
          where,
          orderBy:
            Object.keys(orderBy).length > 0 ? orderBy : { createdAt: "desc" },
          include: {
            category: true,
            subcategory: true,
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        console.log(`Found ${products.length} products`);
        return products;
      } catch (error) {
        console.error("Error fetching products:", error);
        throw new GraphQLError("Failed to fetch products");
      }
    },

    product: async (_parent: unknown, { id }: { id: string }) => {
      try {
        const product = await prisma.product.findUnique({
          where: { id },
          include: {
            category: true,
            subcategory: true,
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        });

        if (!product) {
          throw new GraphQLError("Product not found");
        }

        // Fetch related products from the same category
        const relatedProducts = await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: product.id },
          },
          take: 4,
          include: {
            category: true,
            reviews: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          ...product,
          relatedProducts,
        };
      } catch (error) {
        console.error("Error fetching product:", error);
        throw new GraphQLError("Failed to fetch product");
      }
    },

    categories: async (_parent: unknown, _args: unknown) => {
      try {
        return await prisma.category.findMany({
          include: {
            subcategories: {
              include: {
                products: true,
              },
            },
            products: true,
          },
        });
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw new GraphQLError("Failed to fetch categories");
      }
    },

    category: async (_parent: unknown, { id }: { id: string }) => {
      try {
        const category = await prisma.category.findUnique({
          where: { id },
          include: {
            subcategories: {
              include: {
                products: true,
              },
            },
            products: true,
          },
        });

        if (!category) {
          throw new GraphQLError("Category not found");
        }

        return category;
      } catch (error) {
        console.error("Error fetching category:", error);
        throw new GraphQLError("Failed to fetch category");
      }
    },

    userOrders: async (_parent: unknown, _args: unknown, { user }: Context) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const orders = await prisma.order.findMany({
          where: { userId: user.id },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                    reviews: true,
                  },
                },
              },
            },
            user: true,
            coupon: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Parse and transform shipment details for each order
        return orders.map((order) => {
          let parsedShipmentDetails = null;
          if (order.shipmentDetails) {
            try {
              const rawDetails =
                typeof order.shipmentDetails === "string"
                  ? JSON.parse(order.shipmentDetails)
                  : order.shipmentDetails;

              // Transform to match GraphQL schema
              parsedShipmentDetails = {
                trackingId:
                  rawDetails.trackingId ||
                  rawDetails.awb_code ||
                  rawDetails.awbCode,
                provider: rawDetails.provider || rawDetails.courierName,
                status: String(rawDetails.status || ""),
                estimatedDelivery: rawDetails.estimatedDelivery || null,
                trackingUrl: rawDetails.trackingUrl || null,
              };
            } catch (error) {
              console.error("Error parsing shipment details:", error);
            }
          }

          return {
            ...order,
            shipmentDetails: parsedShipmentDetails,
          };
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw new GraphQLError("Failed to fetch orders");
      }
    },

    order: async (
      _parent: unknown,
      { id }: { id: string },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const order = await prisma.order.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            user: true,
            coupon: true,
          },
        });

        if (!order || order.userId !== user.id) {
          throw new GraphQLError("Order not found");
        }

        // Parse and transform shipment details if they exist
        let parsedShipmentDetails = {
          trackingId: "NOT_AVAILABLE",
          provider: "NOT_ASSIGNED",
          status: "PENDING",
          trackingUrl: "",
          awbCode: "",
          orderId: order.id,
          courierName: "NOT_ASSIGNED",
        };

        if (order.shipmentDetails) {
          try {
            const rawDetails =
              typeof order.shipmentDetails === "string"
                ? JSON.parse(order.shipmentDetails)
                : order.shipmentDetails;

            // Transform to match GraphQL schema with default values
            parsedShipmentDetails = {
              trackingId:
                rawDetails.tracking_id ||
                rawDetails.awb_code ||
                rawDetails.awbCode ||
                "NOT_AVAILABLE",
              provider:
                rawDetails.courier_name ||
                rawDetails.provider ||
                rawDetails.courierName ||
                "NOT_ASSIGNED",
              status: String(rawDetails.status || "PENDING"),
              trackingUrl:
                rawDetails.tracking_url || rawDetails.trackingUrl || "",
              awbCode: rawDetails.awb_code || rawDetails.awbCode || "",
              orderId: rawDetails.order_id || rawDetails.orderId || order.id,
              courierName:
                rawDetails.courier_name ||
                rawDetails.courierName ||
                "NOT_ASSIGNED",
            };
          } catch (error) {
            console.error("Error parsing shipment details:", error);
            // Use default values if parsing fails
          }
        }

        return {
          ...order,
          shipmentDetails: parsedShipmentDetails,
        };
      } catch (error) {
        console.error("Error fetching order:", error);
        throw new GraphQLError("Failed to fetch order");
      }
    },

    userAddresses: async (
      _parent: unknown,
      _args: unknown,
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        return prisma.address.findMany({
          where: { userId: user.id },
          orderBy: {
            isDefault: "desc",
          },
        });
      } catch (error) {
        console.error("Error fetching addresses:", error);
        throw new GraphQLError("Failed to fetch addresses");
      }
    },

    coupons: async (_parent: unknown, _args: unknown) => {
      try {
        const coupons = await prisma.coupon.findMany({
          include: {
            category: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Format dates before returning
        return coupons.map((coupon) => ({
          ...coupon,
          startDate:
            coupon.startDate instanceof Date
              ? coupon.startDate.toISOString()
              : coupon.startDate,
          endDate:
            coupon.endDate instanceof Date
              ? coupon.endDate.toISOString()
              : coupon.endDate,
        }));
      } catch (error) {
        console.error("Error fetching coupons:", error);
        throw new GraphQLError("Failed to fetch coupons");
      }
    },

    validateCoupon: async (
      _parent: unknown,
      args: ValidateCouponArgs,
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const coupon = await prisma.coupon.findUnique({
          where: { code: args.code.toUpperCase() },
          include: { category: true },
        });

        if (!coupon) {
          throw new GraphQLError("Invalid coupon code");
        }

        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
          throw new GraphQLError("Coupon is not active");
        }

        if (!coupon.isActive) {
          throw new GraphQLError("Coupon is disabled");
        }

        if (coupon.usedCount >= coupon.usageLimit) {
          throw new GraphQLError("Coupon usage limit reached");
        }

        if (args.total < coupon.minOrderValue) {
          throw new GraphQLError(
            `Minimum order value is ₹${coupon.minOrderValue}`
          );
        }

        return coupon;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error("Error validating coupon:", error);
        throw new GraphQLError("Failed to validate coupon");
      }
    },

    analytics: async (_parent: unknown, _args: unknown, { user }: Context) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        // Get the date range for analytics
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        // Get all orders within the last 30 days
        const orders = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Helper function to group orders by date
        const groupOrdersByDate = (
          orders: any[],
          dateFormat: "daily" | "weekly" | "monthly"
        ) => {
          const grouped = orders.reduce((acc: any, order) => {
            let dateKey;
            const date = new Date(order.createdAt);

            if (dateFormat === "daily") {
              dateKey = date.toISOString().split("T")[0];
            } else if (dateFormat === "weekly") {
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              dateKey = weekStart.toISOString().split("T")[0];
            } else {
              dateKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1
              ).padStart(2, "0")}`;
            }

            if (!acc[dateKey]) {
              acc[dateKey] = {
                date: dateKey,
                amount: 0,
                count: 0,
                status: order.status,
              };
            }

            acc[dateKey].amount += order.total;
            acc[dateKey].count += 1;
            return acc;
          }, {});

          return Object.values(grouped);
        };

        // Calculate revenue analytics
        const revenue = {
          daily: groupOrdersByDate(
            orders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo),
            "daily"
          ),
          weekly: groupOrdersByDate(orders, "weekly"),
          monthly: groupOrdersByDate(orders, "monthly"),
        };

        // Calculate order analytics
        const orderAnalytics = {
          daily: groupOrdersByDate(
            orders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo),
            "daily"
          ),
          weekly: groupOrdersByDate(orders, "weekly"),
          monthly: groupOrdersByDate(orders, "monthly"),
        };

        // Calculate top products
        const productStats = orders.reduce((acc: any, order) => {
          order.items.forEach((item) => {
            if (!acc[item.product.id]) {
              acc[item.product.id] = {
                id: item.product.id,
                title: item.product.title,
                totalSales: 0,
                totalRevenue: 0,
              };
            }
            acc[item.product.id].totalSales += item.quantity;
            acc[item.product.id].totalRevenue += item.price * item.quantity;
          });
          return acc;
        }, {});

        // Calculate top categories
        const categoryStats = orders.reduce((acc: any, order) => {
          order.items.forEach((item) => {
            const categoryId = item.product.category.id;
            if (!acc[categoryId]) {
              acc[categoryId] = {
                id: categoryId,
                name: item.product.category.name,
                totalSales: 0,
                totalRevenue: 0,
              };
            }
            acc[categoryId].totalSales += item.quantity;
            acc[categoryId].totalRevenue += item.price * item.quantity;
          });
          return acc;
        }, {});

        return {
          revenue,
          orders: orderAnalytics,
          topProducts: Object.values(productStats)
            .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5),
          topCategories: Object.values(categoryStats)
            .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5),
        };
      } catch (error) {
        console.error("Error fetching analytics:", error);
        throw new GraphQLError("Failed to fetch analytics");
      }
    },

    bestsellers: async (
      _parent: any,
      _args: any,
      { prisma }: { prisma: PrismaClient }
    ) => {
      // Get total number of orders
      const totalOrders = await prisma.order.count({
        where: {
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
      });

      // Get all products with their order counts
      const productsWithOrderCounts = await prisma.product.findMany({
        where: {
          isEbook: false,
        },
        include: {
          category: true,
          _count: {
            select: {
              orderItems: {
                where: {
                  order: {
                    status: {
                      not: OrderStatus.CANCELLED,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Filter products that appear in at least 1% of orders
      const bestsellers = productsWithOrderCounts
        .map((product: any) => ({
          ...product,
          orderPercentage:
            totalOrders > 0 ? product._count.orderItems / totalOrders : 0,
        }))
        .filter((product: any) => product.orderPercentage >= 0.01) // Changed from 0.2 to 0.01 for 1%
        .sort((a: any, b: any) => b.orderPercentage - a.orderPercentage);

      return bestsellers;
    },

    cart: cartQueries.cart,

    myEbooks: async (_parent: unknown, _args: unknown, { user }: Context) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        // Find all orders that should include e-books for the user
        const orders = await prisma.order.findMany({
          where: {
            userId: user.id,
            OR: [
              // Include all orders with PAID status
              { paymentStatus: "PAID" },

              // Include all online payment orders that have been verified
              {
                paymentMethod: "ONLINE",
                razorpayPaymentId: { not: null },
              },

              // Include all COD orders regardless of status
              // This ensures e-books from COD orders show up immediately
              {
                paymentMethod: "CASH_ON_DELIVERY",
              },
            ],
          },
          include: {
            items: {
              where: {
                isEbook: true, // Only include e-books
              },
              include: {
                product: true, // Include product details
              },
            },
          },
        });

        // Flatten and deduplicate items from all orders (in case same e-book was purchased multiple times)
        const ebookItems = orders.flatMap((order) => order.items);

        // Optional: Remove duplicates if a user purchased the same e-book multiple times
        const uniqueEbooks = ebookItems.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.productId === item.productId)
        );

        console.log(
          `Found ${uniqueEbooks.length} unique e-books for user ${user.id}`
        );
        return uniqueEbooks;
      } catch (error) {
        console.error("Error fetching user's e-books:", error);
        throw new GraphQLError("Failed to fetch your e-books");
      }
    },
  },

  Mutation: {
    createProduct: async (
      _parent: unknown,
      { input }: { input: ProductInput },
      { user }: Context
    ) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        const productData: Prisma.ProductCreateInput = {
          title: input.title,
          description: input.description,
          price: input.price,
          discountedPrice: input.discountedPrice,
          isEbook: input.isEbook,
          ebookPrice: input.ebookPrice,
          ebookDiscounted: input.ebookDiscounted,
          isFree: input.isFree,
          language: input.language,
          stock: input.stock,
          images: input.images,
          pdfUrl: input.pdfUrl,
          category: { connect: { id: input.categoryId } },
          ...(input.subcategoryId && {
            subcategory: { connect: { id: input.subcategoryId } },
          }),
        };

        const product = await prisma.product.create({
          data: productData,
          include: {
            category: true,
            subcategory: true,
            reviews: true,
          },
        });

        return product;
      } catch (error) {
        console.error("Error creating product:", error);
        throw new GraphQLError("Failed to create product");
      }
    },

    updateProduct: async (
      _parent: unknown,
      { id, input }: { id: string; input: ProductInput },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const productData: Prisma.ProductUpdateInput = {
          title: input.title,
          description: input.description,
          price: input.price,
          discountedPrice: input.discountedPrice,
          isEbook: input.isEbook,
          ebookPrice: input.ebookPrice,
          ebookDiscounted: input.ebookDiscounted,
          isFree: input.isFree,
          language: input.language,
          stock: input.stock,
          images: input.images,
          pdfUrl: input.pdfUrl,
          category: { connect: { id: input.categoryId } },
          ...(input.subcategoryId && {
            subcategory: { connect: { id: input.subcategoryId } },
          }),
        };

        const product = await prisma.product.update({
          where: { id },
          data: productData,
          include: {
            category: true,
            subcategory: true,
            reviews: true,
          },
        });

        return product;
      } catch (error) {
        console.error("Error updating product:", error);
        throw new GraphQLError("Failed to update product");
      }
    },

    deleteProduct: async (
      _parent: unknown,
      { id }: { id: string },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        await prisma.product.delete({
          where: { id },
        });

        return true;
      } catch (error) {
        console.error("Error deleting product:", error);
        throw new GraphQLError("Failed to delete product");
      }
    },

    createReview: async (
      _parent: unknown,
      { input }: { input: ReviewInput },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const order = await prisma.order.findFirst({
          where: {
            userId: user.id,
            status: "DELIVERED",
            items: {
              some: {
                productId: input.productId,
              },
            },
          },
        });

        if (!order) {
          throw new GraphQLError(
            "You can only review products you have purchased"
          );
        }

        const existingReview = await prisma.review.findFirst({
          where: {
            userId: user.id,
            productId: input.productId,
          },
        });

        if (existingReview) {
          throw new GraphQLError("You have already reviewed this product");
        }

        const reviewData: Prisma.ReviewCreateInput = {
          rating: input.rating,
          comment: input.comment,
          user: { connect: { id: user.id } },
          product: { connect: { id: input.productId } },
        };

        const review = await prisma.review.create({
          data: reviewData,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return review;
      } catch (error) {
        console.error("Error creating review:", error);
        throw new GraphQLError("Failed to create review");
      }
    },

    updateReview: async (
      _parent: unknown,
      { id, input }: { id: string; input: ReviewInput },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const review = await prisma.review.findUnique({
          where: { id },
        });

        if (!review || review.userId !== user.id) {
          throw new GraphQLError("Review not found");
        }

        const updatedReview = await prisma.review.update({
          where: { id },
          data: {
            rating: input.rating,
            comment: input.comment,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return updatedReview;
      } catch (error) {
        console.error("Error updating review:", error);
        throw new GraphQLError("Failed to update review");
      }
    },

    deleteReview: async (
      _parent: unknown,
      { id }: { id: string },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const review = await prisma.review.findUnique({
          where: { id },
        });

        if (!review || review.userId !== user.id) {
          throw new GraphQLError("Review not found");
        }

        await prisma.review.delete({
          where: { id },
        });

        return true;
      } catch (error) {
        console.error("Error deleting review:", error);
        throw new GraphQLError("Failed to delete review");
      }
    },

    createCoupon: async (
      _parent: unknown,
      { input }: { input: CouponInput },
      { user }: Context
    ) => {
      try {
        // Check if coupon with same code already exists
        const existingCoupon = await prisma.coupon.findUnique({
          where: { code: input.code.toUpperCase() },
        });

        if (existingCoupon) {
          throw new GraphQLError("A coupon with this code already exists");
        }

        // Parse and validate dates
        let startDate: Date;
        let endDate: Date;

        try {
          startDate = new Date(input.startDate);
          endDate = new Date(input.endDate);

          // Ensure dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Invalid date format");
          }

          // Set time to start of day for startDate and end of day for endDate
          startDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate(),
            0,
            0,
            0
          );
          endDate = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
            23,
            59,
            59,
            999
          );

          if (endDate < startDate) {
            throw new GraphQLError("End date must be after start date");
          }
        } catch (error) {
          throw new GraphQLError("Invalid date format provided");
        }

        const coupon = await prisma.coupon.create({
          data: {
            code: input.code.toUpperCase(),
            description: input.description,
            discountPercent: input.discountPercent,
            maxDiscount: input.maxDiscount,
            minOrderValue: input.minOrderValue,
            usageLimit: input.usageLimit,
            startDate,
            endDate,
            isActive: input.isActive,
            categoryId: input.categoryId,
          },
          include: {
            category: true,
          },
        });

        // Format dates in the response
        return {
          ...coupon,
          startDate: coupon.startDate.toISOString(),
          endDate: coupon.endDate.toISOString(),
        };
      } catch (error) {
        console.error("Error creating coupon:", error);
        if (error instanceof GraphQLError) throw error;
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new GraphQLError("A coupon with this code already exists");
        }
        throw new GraphQLError("Failed to create coupon");
      }
    },

    updateCoupon: async (
      _parent: unknown,
      { id, input }: { id: string; input: CouponInput },
      { user }: Context
    ) => {
      try {
        // Parse and validate dates
        let startDate: Date;
        let endDate: Date;

        try {
          startDate = new Date(input.startDate);
          endDate = new Date(input.endDate);

          // Ensure dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Invalid date format");
          }

          // Set time to start of day for startDate and end of day for endDate
          startDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate(),
            0,
            0,
            0
          );
          endDate = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
            23,
            59,
            59,
            999
          );

          if (endDate < startDate) {
            throw new GraphQLError("End date must be after start date");
          }
        } catch (error) {
          throw new GraphQLError("Invalid date format provided");
        }

        const coupon = await prisma.coupon.update({
          where: { id },
          data: {
            code: input.code.toUpperCase(),
            description: input.description,
            discountPercent: input.discountPercent,
            maxDiscount: input.maxDiscount,
            minOrderValue: input.minOrderValue,
            usageLimit: input.usageLimit,
            startDate,
            endDate,
            isActive: input.isActive,
            categoryId: input.categoryId,
          },
          include: {
            category: true,
          },
        });

        // Format dates in the response
        return {
          ...coupon,
          startDate: coupon.startDate.toISOString(),
          endDate: coupon.endDate.toISOString(),
        };
      } catch (error) {
        console.error("Error updating coupon:", error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Failed to update coupon");
      }
    },

    deleteCoupon: async (
      _parent: unknown,
      { id }: { id: string },
      { user }: Context
    ) => {
      // if (!user || user.role !== 'ADMIN') {
      //   throw new GraphQLError('Not authorized');
      // }

      try {
        await prisma.coupon.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error("Error deleting coupon:", error);
        throw new GraphQLError("Failed to delete coupon");
      }
    },

    cancelOrder: async (
      _parent: unknown,
      { id }: { id: string },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const order = await prisma.order.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!order || order.userId !== user.id) {
          throw new GraphQLError("Order not found");
        }

        if (!["PENDING", "PROCESSING"].includes(order.status)) {
          throw new GraphQLError("Order cannot be cancelled");
        }

        // Cancel shipment in Shiprocket if exists
        if (order.shipmentDetails) {
          const details = order.shipmentDetails as unknown as ShipmentDetails;
          try {
            await shiprocket.cancelOrder(details.orderId);
          } catch (error) {
            console.error("Error cancelling Shiprocket order:", error);
            // Continue with order cancellation even if Shiprocket fails
          }
        }

        // Refund payment if paid
        if (order.paymentStatus === "PAID" && order.razorpayPaymentId) {
          await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(order.total * 100),
          });
        }

        // Restore stock for physical books
        for (const item of order.items) {
          if (!item.isEbook) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }

        return prisma.order.update({
          where: { id },
          data: {
            status: "CANCELLED",
          },
        });
      } catch (error) {
        console.error("Error cancelling order:", error);
        throw new GraphQLError("Failed to cancel order");
      }
    },

    createOrder: async (
      parent: unknown,
      args: { input: OrderInput },
      ctx: Context
    ): Promise<any> => {
      // Get user from context
      const user = ctx?.user;
      
      // Check authentication
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        // Find and validate address
        const address = await prisma.address.findUnique({
          where: { id: args.input.addressId },
        });

        if (!address || address.userId !== user.id) {
          throw new GraphQLError("Invalid address");
        }

        // Calculate total and validate products
        let total = 0;
        const productIds = args.input.items.map((item: OrderItemInput) => item.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
        });

        const orderItems = args.input.items.map((item: OrderItemInput) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) {
            throw new GraphQLError(`Product not found: ${item.productId}`);
          }

          if (!item.isEbook && item.quantity > product.stock) {
            throw new GraphQLError(`Insufficient stock for ${product.title}`);
          }

          const price = item.isEbook
            ? product.ebookDiscounted || product.ebookPrice || 0
            : product.discountedPrice || product.price || 0;

          total += price * item.quantity;
          return {
            productId: item.productId,
            quantity: item.quantity,
            price,
            isEbook: item.isEbook,
          };
        });

        // Apply coupon if provided
        let coupon;
        if (args.input.couponCode) {
          coupon = await prisma.coupon.findUnique({
            where: { code: args.input.couponCode.toUpperCase() },
          });

          if (coupon) {
            const discount = Math.min(
              (total * coupon.discountPercent) / 100,
              coupon.maxDiscount
            );
            total -= discount;
          }
        }

        // Create the order in the database
        const order = await prisma.order.create({
          data: {
            total,
            status: "PENDING",
            paymentMethod: args.input.paymentMethod,
            paymentStatus:
              args.input.paymentMethod === "CASH_ON_DELIVERY"
                ? "PENDING"
                : "PENDING",
            address: JSON.stringify(address),
            userId: user.id,
            couponId: coupon?.id,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        // Update coupon usage if used
        if (coupon) {
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }

        // Decrease stock for physical products
        for (const item of orderItems) {
          if (!item.isEbook) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // For ONLINE payment, create Razorpay order
        if (args.input.paymentMethod === "ONLINE") {
          try {
            // Validate Razorpay configuration
            if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET) {
              console.error("Razorpay configuration missing");
              throw new GraphQLError("Payment configuration error");
            }

            const razorpayOrder = await razorpay.orders.create({
              amount: Math.round(total * 100), // Convert to paise and ensure it's an integer
              currency: "INR",
              receipt: order.id,
            });

            if (!razorpayOrder || !razorpayOrder.id) {
              console.error("Invalid Razorpay order response:", razorpayOrder);
              throw new GraphQLError("Failed to create payment order");
            }

            // Update order with Razorpay order ID
            await prisma.order.update({
              where: { id: order.id },
              data: { razorpayOrderId: razorpayOrder.id },
            });

            // Return the updated order with razorpayOrderId
            return {
              ...order,
              razorpayOrderId: razorpayOrder.id
            };
          } catch (error) {
            console.error("Error creating Razorpay order:", error);
            
            // Update order status to indicate payment initialization failure
            await prisma.order.update({
              where: { id: order.id },
              data: { 
                status: "CANCELLED",
                paymentStatus: "FAILED"
              },
            });

            throw new GraphQLError(
              error instanceof GraphQLError 
                ? error.message 
                : "Failed to create payment order"
            );
          }
        } else {
          // Create shipment for physical books for COD orders
          const physicalItems = orderItems.filter((item) => !item.isEbook);
          if (physicalItems.length > 0) {
            try {
              // Parse address from order
              const addressStr = order.address;
              let address;
              try {
                address = JSON.parse(
                  typeof addressStr === "string"
                    ? addressStr
                    : JSON.stringify(addressStr)
                );
              } catch (e) {
                console.error("Error parsing address:", e);
                throw new GraphQLError("Invalid address format");
              }

              // Get pickup location from Shiprocket
              let pickupLocation = "Primary"; // Default fallback
              try {
                const locations = await shiprocket.getPickupLocations();
                console.log(`Found ${locations?.length || 0} pickup locations:`, locations);
                
                if (locations && locations.length > 0) {
                  pickupLocation = locations[0].pickup_location || locations[0].name;
                  console.log(`Using pickup location: ${pickupLocation}`);
                } else {
                  console.warn("No pickup locations found, using default 'Primary'");
                }

                const orderId = `ORDER-COD-${order.id}-${Date.now()}`;
                
                // Prepare Shiprocket order data
                const shiprocketOrderData = {
                  order_id: orderId,
                  order_date: new Date().toISOString().split("T")[0],
                  pickup_location: pickupLocation,
                  channel_id: "",
                  comment: "Order created via website - COD",
                  billing_customer_name: address.name,
                  billing_last_name: "",
                  billing_address: address.address || address.street,
                  billing_address_2: address.street2 || "",
                  billing_city: address.city,
                  billing_pincode: address.pincode || address.zip,
                  billing_state: address.state,
                  billing_country: "India",
                  billing_email: user.email || "",
                  billing_phone: address.phone,
                  shipping_is_billing: true,
                  shipping_customer_name: address.name,
                  shipping_last_name: "",
                  shipping_address: address.address || address.street,
                  shipping_address_2: address.street2 || "",
                  shipping_city: address.city,
                  shipping_pincode: address.pincode || address.zip,
                  shipping_state: address.state,
                  shipping_country: "India",
                  shipping_email: user.email || "",
                  shipping_phone: address.phone,
                  order_items: physicalItems.map((item) => ({
                    name: products.find(p => p.id === item.productId)?.title || "",
                    sku: item.productId || "",
                    units: item.quantity,
                    selling_price: Math.round(item.price || 0),
                    discount: 0,
                    tax: 0,
                    hsn: 4901,
                  })),
                  payment_method: "COD",
                  shipping_charges: 0,
                  giftwrap_charges: 0,
                  transaction_charges: 0,
                  total_discount: 0,
                  sub_total: Math.round(total),
                  // Required dimensions and weight
                  length: 20,
                  breadth: 15,
                  height: 10,
                  weight: 0.5,
                };

                console.log("Creating Shiprocket order with data:", JSON.stringify(shiprocketOrderData, null, 2));
                
                const shiprocketResponse = await shiprocket.createOrder(shiprocketOrderData);
                console.log("Shiprocket Response:", JSON.stringify(shiprocketResponse, null, 2));

                if (shiprocketResponse) {
                  await prisma.order.update({
                    where: { id: order.id },
                    data: {
                      shipmentDetails: JSON.stringify({
                        trackingId: shiprocketResponse.shipment_id?.toString() || "",
                        provider: "Shiprocket",
                        status: shiprocketResponse.status || "PROCESSING",
                        trackingUrl: shiprocketResponse.label_url || "",
                        awbCode: shiprocketResponse.awb_code || "",
                        orderId: shiprocketResponse.order_id || "",
                        courierName: shiprocketResponse.courier_name || "",
                        estimatedDelivery: shiprocketResponse.expected_delivery_date || null
                      }),
                    },
                  });
                }
              } catch (shiprocketError: any) {
                console.error("Shiprocket API error:", shiprocketError);
                if (axios.isAxiosError(shiprocketError) && shiprocketError.response) {
                  console.error("Shiprocket error response:", shiprocketError.response.data);
                  console.error("Shiprocket error status:", shiprocketError.response.status);
                }
                // Save error info instead of just logging
                await prisma.order.update({
                  where: { id: order.id },
                  data: {
                    shipmentDetails: JSON.stringify({
                      error: true,
                      message: "Failed to create shipment: " + (shiprocketError.message || "Unknown error"),
                      timestamp: new Date().toISOString()
                    })
                  }
                });
                console.error("Failed to create shipment, but proceeding with order");
              }
            } catch (error: any) {
              console.error("Error creating shipment:", error);
              // Don't roll back the order in this case, just log the error
            }
          } else {
            // Auto-mark e-books as delivered for COD orders
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "DELIVERED",
                paymentStatus: "PAID", // For COD ebooks, mark as paid
              },
            });
          }
        }

        return order;
      } catch (error) {
        console.error("Order creation error:", error);
        throw new Error("Failed to create order");
      }
    },

    verifyPayment: async (
      _: unknown,
      { input }: { input: PaymentVerificationInput },
      { user }: Context
    ) => {
      // Log at the very entry point
      console.log("🔥 verifyPayment resolver called with input:", JSON.stringify(input, null, 2));
      console.log("🔥 User authenticated:", !!user);

      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      // Immediate database check before any async operations
      try {
        console.log("🔍 Finding order:", input.orderId);
        const immediateOrder = await prisma.order.findUnique({
          where: { id: input.orderId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!immediateOrder) {
          console.error("❌ Order not found immediately:", input.orderId);
        } else {
          console.log("✅ Order found immediately:", immediateOrder.id);
          console.log("📦 Order has physical items:", immediateOrder.items.some(item => !item.isEbook));

          // For physical orders, process Shiprocket immediately regardless of payment verification
          if (immediateOrder.items.some(item => !item.isEbook) && 
              immediateOrder.userId === user.id &&
              immediateOrder.paymentMethod === "ONLINE" &&
              immediateOrder.shipmentDetails === null) {
            
            console.log("🚚 Processing immediate Shiprocket order for online payment");
            
            // Start a background process to handle Shiprocket order
            // This won't block the payment verification flow
            (async () => {
              try {
                // Parse address from order
                const addressStr = immediateOrder.address;
                let address;
                try {
                  address = JSON.parse(
                    typeof addressStr === "string"
                      ? addressStr
                      : JSON.stringify(addressStr)
                  );
                } catch (e) {
                  console.error("Error parsing address:", e);
                  return;
                }

                console.log("🏠 Address parsed successfully");

                // Get pickup location
                let pickupLocation = "Primary";
                try {
                  const locations = await shiprocket.getPickupLocations();
                  if (locations && locations.length > 0) {
                    pickupLocation = locations[0].pickup_location || locations[0].name;
                    console.log(`Using pickup location: ${pickupLocation}`);
                  }
                } catch (error) {
                  console.error("Error fetching locations:", error);
                }

                const orderId = `ORDER-ONLINE-${immediateOrder.id}-${Date.now()}`;
                
                // Prepare Shiprocket order data
                const shiprocketOrderData = {
                  order_id: orderId,
                  order_date: new Date().toISOString().split("T")[0],
                  pickup_location: pickupLocation,
                  channel_id: "",
                  comment: "Order created via website - Paid Online DIRECT",
                  billing_customer_name: address.name,
                  billing_last_name: "",
                  billing_address: address.address || address.street,
                  billing_address_2: address.street2 || "",
                  billing_city: address.city,
                  billing_pincode: address.pincode || address.zip,
                  billing_state: address.state,
                  billing_country: "India",
                  billing_email: user?.email || "",
                  billing_phone: address.phone,
                  shipping_is_billing: true,
                  shipping_customer_name: address.name,
                  shipping_last_name: "",
                  shipping_address: address.address || address.street,
                  shipping_address_2: address.street2 || "",
                  shipping_city: address.city,
                  shipping_pincode: address.pincode || address.zip,
                  shipping_state: address.state,
                  shipping_country: "India",
                  shipping_email: user?.email || "",
                  shipping_phone: address.phone,
                  order_items: immediateOrder.items.filter(item => !item.isEbook).map((item) => ({
                    name: item.product.title,
                    sku: item.product.id || "",
                    units: item.quantity,
                    selling_price: Math.round(item.price || 0),
                    discount: 0,
                    tax: 0,
                    hsn: 4901,
                  })),
                  payment_method: "Prepaid",
                  shipping_charges: 0,
                  giftwrap_charges: 0,
                  transaction_charges: 0,
                  total_discount: 0,
                  sub_total: Math.round(immediateOrder.total),
                  length: 20,
                  breadth: 15,
                  height: 10,
                  weight: 0.5,
                };

                console.log("📝 DIRECT Creating Shiprocket order with data:", JSON.stringify(shiprocketOrderData, null, 2));
                
                try {
                  const shiprocketResponse = await shiprocket.createOrder(shiprocketOrderData);
                  
                  console.log("✅ DIRECT Shiprocket order created successfully:", JSON.stringify(shiprocketResponse, null, 2));

                  // Update order with Shiprocket details
                  await prisma.order.update({
                    where: { id: immediateOrder.id },
                    data: {
                      shipmentDetails: JSON.stringify({
                        trackingId: shiprocketResponse.shipment_id?.toString() || "",
                        provider: "Shiprocket",
                        status: shiprocketResponse.status || "PROCESSING",
                        trackingUrl: shiprocketResponse.label_url || "",
                        awbCode: shiprocketResponse.awb_code || "",
                        orderId: shiprocketResponse.order_id || "",
                        courierName: shiprocketResponse.courier_name || "",
                        estimatedDelivery: shiprocketResponse.expected_delivery_date || null
                      }),
                    },
                  });
                  
                  console.log("✅ DIRECT Updated order with Shiprocket details");
                } catch (shipError: any) {
                  console.error("❌ DIRECT Error in Shiprocket order creation:", shipError);
                  
                  try {
                    // Save error info
                    await prisma.order.update({
                      where: { id: immediateOrder.id },
                      data: {
                        shipmentDetails: JSON.stringify({
                          error: true,
                          message: "Failed to create shipment: " + (shipError.message || "Unknown error"),
                          timestamp: new Date().toISOString()
                        })
                      }
                    });
                    console.log("✅ DIRECT Saved error info in order");
                  } catch (updateError) {
                    console.error("❌ DIRECT Failed to update order with error info:", updateError);
                  }
                }
              } catch (error) {
                console.error("❌ DIRECT Background process error:", error);
              }
            })().catch(error => {
              console.error("❌ DIRECT Unhandled error in background process:", error);
            });
          }
        }
      } catch (immediateError) {
        console.error("❌ Error in immediate order check:", immediateError);
      }

      let orderSuccess = false;
      let shiprocketResponse: any = null;
      let errorMessage = "";

      try {
        // Regular flow continues...
        // ... rest of existing verifyPayment code

        console.log("⭐⭐⭐ VERIFYING PAYMENT - START ⭐⭐⭐");
        console.log("Processing payment verification for order:", input.orderId);
        console.log("Payment details:", {orderId: input.orderId, paymentId: input.paymentId});
        
        const order = await prisma.order.findUnique({
          where: { id: input.orderId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!order || order.userId !== user.id) {
          console.error("❌ Order not found or doesn't belong to user");
          throw new GraphQLError("Order not found");
        }

        console.log("📦 Retrieved order:", { 
          id: order.id, 
          total: order.total,
          items: order.items.length,
          physical: order.items.filter(i => !i.isEbook).length
        });

        if (!order.razorpayOrderId) {
          console.error("❌ Razorpay order ID not found");
          throw new GraphQLError("Razorpay order ID not found");
        }

        // Verify payment signature
        const shasum = crypto.createHmac(
          "sha256",
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET!
        );
        const data = `${order.razorpayOrderId}|${input.paymentId}`;
        shasum.update(data);
        const digest = shasum.digest("hex");

        console.log("🔐 Verifying payment signature:");
        console.log("Data:", data);
        console.log("Generated digest:", digest);
        console.log("Received signature:", input.signature);

        if (digest !== input.signature) {
          console.error("❌ Signature verification failed");
          console.error("Expected:", digest);
          console.error("Received:", input.signature);

          // If payment verification fails, restore stock for physical books
          for (const item of order.items) {
            if (!item.isEbook) {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }

          // Delete the order since payment failed
          await prisma.order.delete({
            where: { id: order.id },
          });

          return {
            success: false,
            message: "Payment verification failed",
            orderId: order.id,
          };
        }

        console.log("✅ Payment signature verified successfully for order:", order.id);

        // First update order payment status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            razorpayPaymentId: input.paymentId,
          },
        });
        
        console.log("💰 Order payment status updated to PAID");

        // Filter physical items for Shiprocket order
        const physicalItems = order.items.filter((item) => !item.isEbook);
        console.log(`📦 Order has ${physicalItems.length} physical items`);

        // Only create Shiprocket order for physical products
        if (physicalItems.length > 0) {
          console.log("🚚 Creating Shiprocket order for physical items");
          
          try {
            // Parse address from order
            const addressStr = order.address;
            let address: any;
            try {
              address = JSON.parse(
                typeof addressStr === "string"
                  ? addressStr
                  : JSON.stringify(addressStr)
              );
              console.log("📍 Successfully parsed address:", JSON.stringify(address, null, 2));
            } catch (e) {
              console.error("❌ Error parsing address:", e);
              errorMessage = "Invalid address format";
              throw new Error("Invalid address format");
            }

            // Get pickup location from Shiprocket API
            let pickupLocation = "Primary"; // Default fallback
            try {
              console.log("🏬 Fetching pickup locations from Shiprocket");
              const defaultLocation = await shiprocket.getDefaultPickupLocation();
              console.log("🏬 Default pickup location retrieved:", defaultLocation);
              
              if (defaultLocation && defaultLocation !== "Primary") {
                pickupLocation = defaultLocation;
                console.log(`🏬 Using pickup location: ${pickupLocation}`);
              } else {
                console.warn("⚠️ Using fallback pickup location 'Primary'");
              }
            } catch (locationError) {
              console.error("❌ Error fetching pickup locations:", locationError);
              console.warn("⚠️ Using default pickup location 'Primary'");
            }

            const orderId = `ORDER-ONLINE-${order.id}-${Date.now()}`;
            console.log("🔢 Generated Shiprocket order ID:", orderId);
            
            // Prepare Shiprocket order data
            const shiprocketOrderData = {
              order_id: orderId,
              order_date: new Date().toISOString().split("T")[0],
              pickup_location: pickupLocation,
              channel_id: "",
              comment: "Order created via website - Paid Online",
              billing_customer_name: address.name,
              billing_last_name: "",
              billing_address: address.address || address.street,
              billing_address_2: address.street2 || "",
              billing_city: address.city,
              billing_pincode: address.pincode || address.zip,
              billing_state: address.state,
              billing_country: "India",
              billing_email: user?.email || "",
              billing_phone: address.phone,
              shipping_is_billing: true,
              shipping_customer_name: address.name,
              shipping_last_name: "",
              shipping_address: address.address || address.street,
              shipping_address_2: address.street2 || "",
              shipping_city: address.city,
              shipping_pincode: address.pincode || address.zip,
              shipping_state: address.state,
              shipping_country: "India",
              shipping_email: user?.email || "",
              shipping_phone: address.phone,
              order_items: physicalItems.map((item) => ({
                name: item.product.title,
                sku: item.product.id || "",
                units: item.quantity,
                selling_price: Math.round(item.price || 0),
                discount: 0,
                tax: 0,
                hsn: 4901,
              })),
              payment_method: "Prepaid",
              shipping_charges: 0,
              giftwrap_charges: 0,
              transaction_charges: 0,
              total_discount: 0,
              sub_total: Math.round(order.total),
              length: 20,
              breadth: 15,
              height: 10,
              weight: 0.5,
            };

            console.log(
              "📝 Creating Shiprocket order with data:",
              JSON.stringify(shiprocketOrderData, null, 2)
            );

            console.log("🚀 ABOUT TO CALL SHIPROCKET API - createOrder");
            try {
              shiprocketResponse = await shiprocket.createOrder(shiprocketOrderData);
              
            console.log(
                "✅ Shiprocket order creation successful:",
              JSON.stringify(shiprocketResponse, null, 2)
            );

            if (!shiprocketResponse) {
              throw new Error(
                "Failed to create Shiprocket order - no response received"
              );
            }

            // Update order with Shiprocket details
            await prisma.order.update({
              where: { id: order.id },
              data: {
                shipmentDetails: JSON.stringify({
                  trackingId: shiprocketResponse.shipment_id?.toString() || "",
                  provider: "Shiprocket",
                    status: shiprocketResponse.status || "PROCESSING",
                  trackingUrl: shiprocketResponse.label_url || "",
                  awbCode: shiprocketResponse.awb_code || "",
                  orderId: shiprocketResponse.order_id || "",
                  courierName: shiprocketResponse.courier_name || "",
                    estimatedDelivery: shiprocketResponse.expected_delivery_date || null
                }),
              },
            });

              console.log("✅ Successfully added Shiprocket details to order");
            } catch (shipError: any) {
              console.error("❌ Error in Shiprocket order creation:", shipError);
              if (axios.isAxiosError(shipError) && shipError.response) {
            console.error(
              "Error details:",
                  shipError.response.data
                );
              } else {
                console.error("Error message:", shipError.message);
              }
              
              // Save error info instead of failing
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  shipmentDetails: JSON.stringify({
                    error: true,
                    message: "Failed to create shipment: " + (shipError.message || "Unknown error"),
                    timestamp: new Date().toISOString()
                  })
                }
              });
              
              errorMessage = "Failed to create shipment with Shiprocket: " + (shipError.message || "Unknown error");
            }
          } catch (error: any) {
            console.error("❌ Error in payment verification/shipment flow:", error);
            errorMessage = "Error during payment process: " + (error.message || "Unknown error");
          }
        } else {
          console.log("📚 Order contains only e-books, no shipment needed");
        }
        
        // Mark order as success regardless of Shiprocket issues
        orderSuccess = true;
        console.log("✅ Order marked as successful despite any Shiprocket issues");

        // Clear cart only after successful payment verification
        if (orderSuccess) {
          try {
            const userCart = await prisma.cart.findFirst({
              where: { userId: user.id },
            });

            if (userCart) {
              await prisma.$transaction([
                prisma.cartItem.deleteMany({
                  where: { cartId: userCart.id },
                }),
                prisma.cart.delete({
                  where: { id: userCart.id },
                }),
              ]);
              console.log("🛒 User cart cleared successfully");
            }
          } catch (error) {
            console.error("Failed to clear cart:", error);
          }
        }

        console.log("⭐⭐⭐ VERIFYING PAYMENT - END ⭐⭐⭐");
        return {
          success: true,
          message: shiprocketResponse
            ? "Payment verified successfully and shipment created"
            : errorMessage 
              ? `Payment verified successfully, but ${errorMessage}`
            : "Payment verified successfully",
          orderId: order.id,
        };
      } catch (error: any) {
        console.error("❌ Error verifying payment:", error);
        return {
          success: false,
          message:
            error instanceof GraphQLError
              ? error.message
              : "Failed to verify payment: " + (error.message || "Unknown error"),
          orderId: input.orderId,
        };
      }
    },

    createCategory: async (
      _parent: unknown,
      { input }: { input: CategoryInput },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const category = await prisma.category.create({
          data: {
            name: input.name,
            description: input.description,
          },
          include: {
            subcategories: true,
            products: true,
          },
        });

        return category;
      } catch (error) {
        console.error("Error creating category:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new GraphQLError("A category with this name already exists");
          }
        }
        throw new GraphQLError("Failed to create category");
      }
    },

    createSubcategory: async (
      _parent: unknown,
      { input }: { input: { name: string; description?: string; categoryId: string } },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }
    
      try {
        const subcategory = await prisma.subcategory.create({
          data: {
            name: input.name,
            description: input.description,
            category: {
              connect: { id: input.categoryId },
            },
          },
          include: {
            category: true,
            products: true,
          },
        });
    
        return subcategory;
      } catch (error) {
        console.error("Error creating subcategory:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new GraphQLError("A subcategory with this name already exists in the selected category");
          }
        }
        throw new GraphQLError("Failed to create subcategory");
      }
    },
    

    updateCategory: async (
      _parent: unknown,
      { id, input }: { id: string; input: CategoryInput },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        const category = await prisma.category.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
          },
          include: {
            subcategories: true,
            products: true,
          },
        });

        return category;
      } catch (error) {
        console.error("Error updating category:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new GraphQLError("A category with this name already exists");
          }
          if (error.code === "P2025") {
            throw new GraphQLError("Category not found");
          }
        }
        throw new GraphQLError("Failed to update category");
      }
    },

    deleteCategory: async (
      _parent: unknown,
      { id }: { id: string },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      try {
        await prisma.category.delete({
          where: { id },
        });

        return true;
      } catch (error) {
        console.error("Error deleting category:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new GraphQLError("Category not found");
          }
          if (error.code === "P2003") {
            throw new GraphQLError(
              "Cannot delete category because it has related products or subcategories"
            );
          }
        }
        throw new GraphQLError("Failed to delete category");
      }
    },

    updateOrderStatus: async (
      _parent: unknown,
      { id, status }: { id: string; status: OrderStatus },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      // Check if user is an admin
      const userWithRole = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!userWithRole || userWithRole.role !== "ADMIN") {
        throw new GraphQLError("Not authorized. Admin access required.");
      }

      try {
        // Get the current order
        const currentOrder = await prisma.order.findUnique({
          where: { id },
          include: {
            items: true,
          },
        });

        if (!currentOrder) {
          throw new GraphQLError("Order not found");
        }

        // Validate status transition
        const validTransitions: { [key: string]: OrderStatus[] } = {
          PENDING: ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
          PROCESSING: ["SHIPPED", "DELIVERED", "CANCELLED"],
          SHIPPED: ["DELIVERED", "CANCELLED"],
          DELIVERED: ["CANCELLED"], // Allow cancellation of delivered orders if needed
          CANCELLED: [], // No transitions allowed from cancelled state
        };

        if (!validTransitions[currentOrder.status].includes(status)) {
          throw new GraphQLError(
            `Invalid status transition from ${currentOrder.status} to ${status}`
          );
        }

        // Handle special cases for status changes
        if (status === "CANCELLED") {
          // Restore stock for physical books if order is cancelled
          for (const item of currentOrder.items) {
            if (!item.isEbook) {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }

          // Handle refund if payment was made
          if (
            currentOrder.paymentStatus === "PAID" &&
            currentOrder.razorpayPaymentId
          ) {
            try {
              await razorpay.payments.refund(currentOrder.razorpayPaymentId, {
                amount: Math.round(currentOrder.total * 100),
              });
            } catch (error) {
              console.error("Error processing refund:", error);
              throw new GraphQLError("Failed to process refund");
            }
          }
        }

        // Update the order status
        const updatedOrder = await prisma.order.update({
          where: { id },
          data: { status },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: true,
            coupon: true,
          },
        });

        return updatedOrder;
      } catch (error) {
        console.error("Error updating order status:", error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Failed to update order status");
      }
    },


    updateSubcategory: async (
      _parent: unknown,
      { id, input }: { id: string; input: { name: string; description?: string; categoryId: string } },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }
    
      try {
        const subcategory = await prisma.subcategory.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
            category: {
              connect: { id: input.categoryId },
            },
          },
          include: {
            category: true,
            products: true,
          },
        });
    
        return subcategory;
      } catch (error) {
        console.error("Error updating subcategory:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new GraphQLError("A subcategory with this name already exists in the selected category");
          }
          if (error.code === "P2025") {
            throw new GraphQLError("Subcategory not found");
          }
        }
        throw new GraphQLError("Failed to update subcategory");
      }
    },

    deleteSubcategory: async (
      _parent: unknown,
      { id }: { id: string },
      { user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }
    
      try {
        await prisma.subcategory.delete({
          where: { id },
        });
    
        return true;
      } catch (error) {
        console.error("Error deleting subcategory:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new GraphQLError("Subcategory not found");
          }
          if (error.code === "P2003") {
            throw new GraphQLError(
              "Cannot delete subcategory because it has related products"
            );
          }
        }
        throw new GraphQLError("Failed to delete subcategory");
      }
    },
    
    

    addToCart: cartMutations.addToCart,
    updateCartItem: cartMutations.updateCartItem,
    removeFromCart: cartMutations.removeFromCart,
    clearCart: cartMutations.clearCart,

    register: async (
      _parent: unknown,
      {
        email,
        password,
        name,
      }: { email: string; password: string; name?: string }
    ) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          throw new GraphQLError("User with this email already exists");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: "USER",
          },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } catch (error) {
        console.error("Error registering user:", error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Failed to register user");
      }
    },

    createAddress: async (
      _parent: unknown,
      { input }: { input: AddressInput },
      context: Context
    ) => {
      // Safely access user from context
      const user = context?.user;

      // Check for authentication
      if (!user || !user.id) {
        console.error(
          "Authentication error: No user in context or missing user ID"
        );
        throw new GraphQLError("Not authenticated");
      }

      try {
        // If this is the first address or isDefault is true, update other addresses
        if (input.isDefault) {
          await prisma.address.updateMany({
            where: { userId: user.id },
            data: { isDefault: false },
          });
        }

        // Create the address with explicit error handling
        const newAddress = await prisma.address.create({
          data: {
            ...input,
            user: { connect: { id: user.id } },
          },
        });

        // Ensure we're not returning null
        if (!newAddress) {
          throw new Error("Failed to create address record");
        }

        return newAddress;
      } catch (error) {
        console.error("Error adding address:", error);
        throw new GraphQLError("Failed to add address");
      }
    },
  },

  Order: {
    createdAt: (parent: { createdAt: Date | string }) => {
      if (parent.createdAt instanceof Date) {
        return parent.createdAt.toISOString();
      }
      return parent.createdAt;
    },
  },

  User: {
    createdAt: (parent: { createdAt: Date | string }) => {
      if (parent.createdAt instanceof Date) {
        return parent.createdAt.toISOString();
      }
      return parent.createdAt;
    },
  },
};

function filterProducts(products: any[], input: ProductFilterInput | null) {
  if (!input) return products;

  return products
    .filter((product) => {
      if (input.category && product.categoryId !== input.category) return false;
      if (input.subcategory && product.subcategoryId !== input.subcategory)
        return false;
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        const titleMatch = product.title.toLowerCase().includes(searchLower);
        const descMatch = product.description
          .toLowerCase()
          .includes(searchLower);
        if (!titleMatch && !descMatch) return false;
      }
      if (input.minPrice && product.price < input.minPrice) return false;
      if (input.maxPrice && product.price > input.maxPrice) return false;
      if (input.language && product.language !== input.language) return false;
      if (
        typeof input.isEbook === "boolean" &&
        product.isEbook !== input.isEbook
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (!input.sort) return 0;
      switch (input.sort) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });
}
