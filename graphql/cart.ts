import { PrismaClient } from "@prisma/client";

interface Context {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  prisma: PrismaClient;
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

export const cartQueries = {
  cart: async (_: any, __: any, { prisma, user }: Context) => {
    if (!user) {
      throw new Error("You must be logged in to view cart");
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return null;
    }

    return {
      ...cart,
      total: calculateCartTotal(cart.items),
    };
  },
};

export const cartMutations = {
  addToCart: async (
    _: any,
    {
      input,
    }: { input: { productId: string; quantity: number; isEbook: boolean } },
    { prisma, user }: Context
  ) => {
    if (!user) {
      throw new Error("You must be logged in to add items to cart");
    }

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!input.isEbook && product.stock < input.quantity) {
      throw new Error("Not enough stock available");
    }

    let cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
          items: {
            create: {
              productId: input.productId,
              quantity: input.quantity,
              isEbook: input.isEbook,
            },
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
    } else {
      const existingItem = cart.items.find(
        (item) =>
          item.productId === input.productId && item.isEbook === input.isEbook
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + input.quantity;
        if (!input.isEbook && product.stock < newQuantity) {
          throw new Error("Not enough stock available");
        }

        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: input.productId,
            quantity: input.quantity,
            isEbook: input.isEbook,
          },
        });
      }

      cart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return {
      ...cart,
      total: calculateCartTotal(cart.items),
    };
  },

  updateCartItem: async (
    _: any,
    { id, quantity }: { id: string; quantity: number },
    { prisma, user }: Context
  ) => {
    if (!user) {
      throw new Error("You must be logged in to update cart");
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true, product: true },
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    if (cartItem.cart.userId !== user.id) {
      throw new Error("Not authorized");
    }

    if (!cartItem.isEbook && cartItem.product.stock < quantity) {
      throw new Error("Not enough stock available");
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    const cart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      ...cart,
      total: calculateCartTotal(cart.items),
    };
  },

  removeFromCart: async (
    _: any,
    { id }: { id: string },
    { prisma, user }: Context
  ) => {
    if (!user) {
      throw new Error("You must be logged in to remove items from cart");
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    if (cartItem.cart.userId !== user.id) {
      throw new Error("Not authorized");
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    const cart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      ...cart,
      total: calculateCartTotal(cart.items),
    };
  },

  clearCart: async (_: any, __: any, { prisma, user }: Context) => {
    if (!user) {
      throw new Error("You must be logged in to clear cart");
    }

    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return true;
  },
};
