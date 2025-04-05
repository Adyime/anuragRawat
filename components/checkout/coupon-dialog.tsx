import { prisma } from "@/lib/prisma";
import { GraphQLError } from "graphql";
import {
  getCachedProducts,
  setCachedProducts,
  invalidateProductCache,
} from "@/lib/redis";
import Razorpay from "razorpay";
import { shiprocket } from "@/lib/shiprocket";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      return prisma.user.findUnique({
        where: { id: user.id },
        include: {
          orders: true,
          addresses: true,
        },
      });
    },

    categories: async () => {
      try {
        const categories = await prisma.category.findMany({
          include: {
            subcategories: {
              include: {
                products: true,
              },
            },
            products: true,
          },
        });

        if (!categories) {
          return [];
        }

        return categories;
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw new GraphQLError("Failed to fetch categories");
      }
    },

    products: async (_, { input }) => {
      try {
        const cachedProducts = await getCachedProducts();
        if (cachedProducts) {
          return filterProducts(cachedProducts, input);
        }

        const products = await prisma.product.findMany({
          include: {
            category: true,
            subcategory: true,
            reviews: true,
          },
        });

        await setCachedProducts(products);
        return filterProducts(products, input);
      } catch (error) {
        console.error("Error fetching products:", error);
        throw new GraphQLError("Failed to fetch products");
      }
    },

    product: async (_, { id }) => {
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
            },
          },
        });

        if (!product) {
          throw new GraphQLError("Product not found");
        }

        const relatedProducts = await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: product.id },
          },
          take: 4,
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

    userOrders: async (_, __, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        return prisma.order.findMany({
          where: { userId: user.id },
          include: {
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

    userAddresses: async (_, __, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

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

    validateCoupon: async (_, { code, total }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        const coupon = await prisma.coupon.findUnique({
          where: { code: code.toUpperCase() },
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

        if (total < coupon.minOrderValue) {
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
  },

  Mutation: {
    updateProfile: async (_, { input }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        return prisma.user.update({
          where: { id: user.id },
          data: input,
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        throw new GraphQLError("Failed to update profile");
      }
    },

    createAddress: async (_, { input }, { user }) => {
      if (!user) {
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

        return prisma.address.create({
          data: {
            ...input,
            user: { connect: { id: user.id } },
          },
        });
      } catch (error) {
        console.error("Error adding address:", error);
        throw new GraphQLError("Failed to add address");
      }
    },

    updateAddress: async (_, { id, input }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        const address = await prisma.address.findUnique({
          where: { id },
        });

        if (!address || address.userId !== user.id) {
          throw new GraphQLError("Address not found");
        }

        if (input.isDefault) {
          await prisma.address.updateMany({
            where: { userId: user.id },
            data: { isDefault: false },
          });
        }

        return prisma.address.update({
          where: { id },
          data: input,
        });
      } catch (error) {
        console.error("Error updating address:", error);
        throw new GraphQLError("Failed to update address");
      }
    },

    deleteAddress: async (_, { id }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        const address = await prisma.address.findUnique({
          where: { id },
        });

        if (!address || address.userId !== user.id) {
          throw new GraphQLError("Address not found");
        }

        await prisma.address.delete({
          where: { id },
        });

        return true;
      } catch (error) {
        console.error("Error deleting address:", error);
        throw new GraphQLError("Failed to delete address");
      }
    },

    setDefaultAddress: async (_, { id }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        const address = await prisma.address.findUnique({
          where: { id },
        });

        if (!address || address.userId !== user.id) {
          throw new GraphQLError("Address not found");
        }

        await prisma.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });

        return prisma.address.update({
          where: { id },
          data: { isDefault: true },
        });
      } catch (error) {
        console.error("Error setting default address:", error);
        throw new GraphQLError("Failed to set default address");
      }
    },

    createOrder: async (_, { input }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        const address = await prisma.address.findUnique({
          where: { id: input.addressId },
        });

        if (!address || address.userId !== user.id) {
          throw new GraphQLError("Invalid address");
        }

        // Calculate total and validate products
        let total = 0;
        const productIds = input.items.map((item) => item.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
        });

        const orderItems = input.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) {
            throw new GraphQLError(`Product not found: ${item.productId}`);
          }

          if (!item.isEbook && item.quantity > product.stock) {
            throw new GraphQLError(`Insufficient stock for ${product.title}`);
          }

          const price = item.isEbook
            ? product.ebookDiscounted || product.ebookPrice
            : product.discountedPrice || product.price;

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
        if (input.couponCode) {
          coupon = await prisma.coupon.findUnique({
            where: { code: input.couponCode.toUpperCase() },
          });

          if (coupon) {
            const discount = Math.min(
              (total * coupon.discountPercent) / 100,
              coupon.maxDiscount
            );
            total -= discount;
          }
        }

        // Create order
        const order = await prisma.order.create({
          data: {
            user: { connect: { id: user.id } },
            total,
            status: "PENDING",
            paymentMethod: input.paymentMethod,
            paymentStatus: "PENDING",
            address: `${address.name}, ${address.address}, ${address.city}, ${address.state} - ${address.pincode}`,
            coupon: coupon ? { connect: { id: coupon.id } } : undefined,
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

        // Create Razorpay order if payment method is online
        if (input.paymentMethod === "ONLINE") {
          const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(total * 100), // Convert to paise
            currency: "INR",
            receipt: order.id,
          });

          // Update order with Razorpay order ID
          await prisma.order.update({
            where: { id: order.id },
            data: { razorpayOrderId: razorpayOrder.id },
          });
        }

        // Create shipment for physical books
        const physicalItems = orderItems.filter((item) => !item.isEbook);
        if (physicalItems.length > 0) {
          const shipment = await shiprocket.createOrder({
            order_id: order.id,
            order_date: new Date().toISOString(),
            pickup_location: "Primary",
            billing_customer_name: address.name,
            billing_address: address.address,
            billing_city: address.city,
            billing_state: address.state,
            billing_pincode: address.pincode,
            billing_country: "India",
            billing_phone: address.phone,
            shipping_is_billing: true,
            order_items: physicalItems.map((item) => ({
              name: item.product.title,
              sku: item.product.id,
              units: item.quantity,
              selling_price: item.price,
            })),
            payment_method:
              input.paymentMethod === "ONLINE" ? "Prepaid" : "COD",
            sub_total: total,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5,
          });

          // Update order with shipment details
          await prisma.order.update({
            where: { id: order.id },
            data: {
              shipmentDetails: {
                trackingId: shipment.tracking_number,
                provider: shipment.courier_name,
                status: shipment.status,
                trackingUrl: shipment.tracking_url,
              },
            },
          });
        } else {
          // Auto-mark e-books as delivered
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "DELIVERED",
              paymentStatus:
                input.paymentMethod === "ONLINE" ? "PENDING" : "PAID",
            },
          });
        }

        return order;
      } catch (error) {
        console.error("Error creating order:", error);
        throw new GraphQLError("Failed to create order");
      }
    },

    cancelOrder: async (_, { id }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

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

        // Cancel shipment if exists
        // if (order.shipmentDetails?.trackingId) {
        //   await shiprocket.cancelOrder(order.shipmentDetails.trackingId);
        // }

        // Refund payment if paid
        if (order.paymentStatus === "PAID") {
          await razorpay.payments.refund(order.razorpayPaymentId!, {
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

    verifyPayment: async (_, { input }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        const order = await prisma.order.findUnique({
          where: { id: input.orderId },
        });

        if (!order || order.userId !== user.id) {
          throw new GraphQLError("Order not found");
        }

        // Verify payment signature
        const shasum = crypto.createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET!
        );
        shasum.update(`${order.razorpayOrderId}|${input.paymentId}`);
        const digest = shasum.digest("hex");

        if (digest !== input.signature) {
          throw new GraphQLError("Invalid payment signature");
        }

        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            razorpayPaymentId: input.paymentId,
          },
        });

        return {
          success: true,
          message: "Payment verified successfully",
          orderId: order.id,
        };
      } catch (error) {
        console.error("Error verifying payment:", error);
        throw new GraphQLError("Failed to verify payment");
      }
    },

    createReview: async (_, { input }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        // Check if user has purchased the product
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

        // Check if user has already reviewed the product
        const existingReview = await prisma.review.findFirst({
          where: {
            userId: user.id,
            productId: input.productId,
          },
        });

        if (existingReview) {
          throw new GraphQLError("You have already reviewed this product");
        }

        return prisma.review.create({
          data: {
            ...input,
            user: { connect: { id: user.id } },
            product: { connect: { id: input.productId } },
          },
        });
      } catch (error) {
        console.error("Error creating review:", error);
        throw new GraphQLError("Failed to create review");
      }
    },

    updateReview: async (_, { id, input }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

      try {
        const review = await prisma.review.findUnique({
          where: { id },
        });

        if (!review || review.userId !== user.id) {
          throw new GraphQLError("Review not found");
        }

        return prisma.review.update({
          where: { id },
          data: input,
        });
      } catch (error) {
        console.error("Error updating review:", error);
        throw new GraphQLError("Failed to update review");
      }
    },

    deleteReview: async (_, { id }, { user }) => {
      // if (!user) {
      //   throw new GraphQLError("Not authenticated");
      // }

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
  },
};

// Helper function to filter products based on input criteria
function filterProducts(products: any[], input: any) {
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
