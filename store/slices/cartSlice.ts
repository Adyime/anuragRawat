import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// GraphQL Operations
const GET_CART = gql`
  query GetCart {
    cart {
      id
      total
      items {
        id
        quantity
        isEbook
        product {
          id
          title
          price
          discountedPrice
          ebookPrice
          ebookDiscounted
          images
        }
      }
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($input: CartItemInput!) {
    addToCart(input: $input) {
      id
      total
      items {
        id
        quantity
        isEbook
        product {
          id
          title
          price
          discountedPrice
          ebookPrice
          ebookDiscounted
          images
        }
      }
    }
  }
`;

const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($id: ID!, $quantity: Int!) {
    updateCartItem(id: $id, quantity: $quantity) {
      id
      total
      items {
        id
        quantity
        isEbook
        product {
          id
          title
          price
          discountedPrice
          ebookPrice
          ebookDiscounted
          images
        }
      }
    }
  }
`;

const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($id: ID!) {
    removeFromCart(id: $id) {
      id
      total
      items {
        id
        quantity
        isEbook
        product {
          id
          title
          price
          discountedPrice
          ebookPrice
          ebookDiscounted
          images
        }
      }
    }
  }
`;

const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart
  }
`;

interface CartItem {
  id: string;
  quantity: number;
  isEbook: boolean;
  product: {
    id: string;
    title: string;
    price: number;
    discountedPrice?: number;
    ebookPrice?: number;
    ebookDiscounted?: number;
    images: string[];
  };
}

interface Cart {
  id: string;
  total: number;
  items: CartItem[];
}

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
};

interface CartItemInput {
  productId: string;
  quantity: number;
  isEbook: boolean;
}

// Async Thunks
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_CART,
        fetchPolicy: "network-only",
      });
      return data.cart;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (input: CartItemInput, { rejectWithValue }) => {
    try {
      console.log("Adding to cart:", input);
      const { data, errors } = await client.mutate({
        mutation: ADD_TO_CART,
        variables: { input },
        refetchQueries: [{ query: GET_CART }],
      });

      if (errors) {
        console.error("GraphQL errors:", errors);
        return rejectWithValue(errors[0].message);
      }

      if (!data.addToCart) {
        console.error("No cart data returned");
        return rejectWithValue("Failed to add item to cart");
      }

      console.log("Added to cart:", data.addToCart);
      return data.addToCart;
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      if (error.graphQLErrors?.length > 0) {
        return rejectWithValue(error.graphQLErrors[0].message);
      }
      if (error.networkError) {
        return rejectWithValue("Network error. Please check your connection.");
      }
      return rejectWithValue(error.message || "Failed to add item to cart");
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async (
    { id, quantity }: { id: string; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_CART_ITEM,
        variables: { id, quantity },
      });
      return data.updateCartItem;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: REMOVE_FROM_CART,
        variables: { id },
      });
      return data.removeFromCart;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      await client.mutate({
        mutation: CLEAR_CART,
      });
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.cart = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default cartSlice.reducer;
