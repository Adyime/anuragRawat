// import Redis from "ioredis";

// // Create Redis client with better error handling and reconnection strategy
// const redis = new Redis(process.env.REDIS_URL!, {
//   maxRetriesPerRequest: null,
//   enableReadyCheck: true,
//   retryStrategy(times) {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
//   reconnectOnError(err) {
//     const targetError = "READONLY";
//     if (err.message.includes(targetError)) {
//       return true;
//     }
//     return false;
//   },
// });

// // Error handling
// redis.on("error", (error) => {
//   console.error("Redis connection error:", error);
// });

// redis.on("connect", () => {
//   console.log("Connected to Redis");
// });

// // Cache TTL values (in seconds)
// export const CATEGORY_CACHE_TTL = 300; // 5 minutes
// export const PRODUCT_CACHE_TTL = 300; // 5 minutes
// export const ORDER_CACHE_TTL = 60; // 1 minute
// export const COUPON_CACHE_TTL = 300; // 5 minutes

// // Coupon cache functions
// export async function getCachedCoupons() {
//   try {
//     const cached = await redis.get("coupons");
//     return cached ? JSON.parse(cached) : null;
//   } catch (error) {
//     console.error("Error getting cached coupons:", error);
//     return null;
//   }
// }

// export async function setCachedCoupons(coupons: any[]) {
//   try {
//     await redis.setex("coupons", COUPON_CACHE_TTL, JSON.stringify(coupons));
//   } catch (error) {
//     console.error("Error setting cached coupons:", error);
//   }
// }

// export async function invalidateCouponCache() {
//   try {
//     await redis.del("coupons");
//   } catch (error) {
//     console.error("Error invalidating coupon cache:", error);
//   }
// }

// // Order cache functions
// export async function getCachedOrders() {
//   try {
//     const cached = await redis.get("orders");
//     return cached ? JSON.parse(cached) : null;
//   } catch (error) {
//     console.error("Error getting cached orders:", error);
//     return null;
//   }
// }

// export async function setCachedOrders(orders: any[]) {
//   try {
//     await redis.setex("orders", ORDER_CACHE_TTL, JSON.stringify(orders));
//   } catch (error) {
//     console.error("Error setting cached orders:", error);
//   }
// }

// export async function invalidateOrderCache() {
//   try {
//     await redis.del("orders");
//   } catch (error) {
//     console.error("Error invalidating order cache:", error);
//   }
// }

// // Category cache functions
// export async function getCachedCategories() {
//   try {
//     const cached = await redis.get("categories");
//     return cached ? JSON.parse(cached) : null;
//   } catch (error) {
//     console.error("Error getting cached categories:", error);
//     return null;
//   }
// }

// export async function setCachedCategories(categories: any[]) {
//   try {
//     await redis.setex(
//       "categories",
//       CATEGORY_CACHE_TTL,
//       JSON.stringify(categories)
//     );
//   } catch (error) {
//     console.error("Error setting cached categories:", error);
//   }
// }

// export async function invalidateCategoryCache() {
//   try {
//     await redis.del("categories");
//   } catch (error) {
//     console.error("Error invalidating category cache:", error);
//   }
// }

// // Product cache functions
// export async function getCachedProducts() {
//   try {
//     const cached = await redis.get("products");
//     return cached ? JSON.parse(cached) : null;
//   } catch (error) {
//     console.error("Error getting cached products:", error);
//     return null;
//   }
// }

// export async function setCachedProducts(products: any[]) {
//   try {
//     await redis.setex("products", PRODUCT_CACHE_TTL, JSON.stringify(products));
//   } catch (error) {
//     console.error("Error setting cached products:", error);
//   }
// }

// export async function invalidateProductCache() {
//   try {
//     await redis.del("products");
//   } catch (error) {
//     console.error("Error invalidating product cache:", error);
//   }
// }

// // Graceful shutdown
// process.on("SIGTERM", () => {
//   console.log("Closing Redis connection...");
//   redis.quit();
// });

// export default redis;
import Redis from "ioredis";
import RedisMock from "redis-mock";

let redis: Redis;

if (process.env.NODE_ENV === "production") {
  redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
} else {
  // Use redis-mock for development/testing
  const client = RedisMock.createClient();
  redis = client as unknown as Redis;
}

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  PRODUCTS: 300, // 5 minutes
  CATEGORIES: 300,
  ORDERS: 60,
  COUPONS: 300,
};

// Product cache functions
export async function getCachedProducts() {
  try {
    const cached = await redis.get("products");
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Redis error getting products:", error);
    return null;
  }
}

export async function setCachedProducts(products: any[]) {
  try {
    await redis.setex("products", CACHE_TTL.PRODUCTS, JSON.stringify(products));
  } catch (error) {
    console.error("Redis error setting products:", error);
  }
}

export async function invalidateProductCache() {
  try {
    await redis.del("products");
  } catch (error) {
    console.error("Redis error invalidating products:", error);
  }
}

// Category cache functions
export async function getCachedCategories() {
  try {
    const cached = await redis.get("categories");
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Redis error getting categories:", error);
    return null;
  }
}

export async function setCachedCategories(categories: any[]) {
  try {
    await redis.setex(
      "categories",
      CACHE_TTL.CATEGORIES,
      JSON.stringify(categories)
    );
  } catch (error) {
    console.error("Redis error setting categories:", error);
  }
}

export async function invalidateCategoryCache() {
  try {
    await redis.del("categories");
  } catch (error) {
    console.error("Redis error invalidating categories:", error);
  }
}

// Order cache functions
export async function getCachedOrders() {
  try {
    const cached = await redis.get("orders");
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Redis error getting orders:", error);
    return null;
  }
}

export async function setCachedOrders(orders: any[]) {
  try {
    await redis.setex("orders", CACHE_TTL.ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error("Redis error setting orders:", error);
  }
}

export async function invalidateOrderCache() {
  try {
    await redis.del("orders");
  } catch (error) {
    console.error("Redis error invalidating orders:", error);
  }
}

// Coupon cache functions
export async function getCachedCoupons() {
  try {
    const cached = await redis.get("coupons");
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Redis error getting coupons:", error);
    return null;
  }
}

export async function setCachedCoupons(coupons: any[]) {
  try {
    await redis.setex("coupons", CACHE_TTL.COUPONS, JSON.stringify(coupons));
  } catch (error) {
    console.error("Redis error setting coupons:", error);
  }
}

export async function invalidateCouponCache() {
  try {
    await redis.del("coupons");
  } catch (error) {
    console.error("Redis error invalidating coupons:", error);
  }
}

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
  process.on("SIGTERM", () => {
    console.log("Closing Redis connection...");
    redis.quit();
  });
}

export default redis;
