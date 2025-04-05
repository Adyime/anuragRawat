import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

const GET_ORDERS = gql`
  query GetOrders {
    orders {
      id
      total
      status
      paymentMethod
      paymentStatus
      address
      createdAt
      user {
        id
        name
        email
      }
      items {
        id
        quantity
        price
        isEbook
        product {
          id
          title
        }
      }
      coupon {
        code
        discountPercent
      }
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_ORDERS,
        fetchPolicy: "network-only",
      });
      return data.orders;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async (
    { id, status }: { id: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_ORDER_STATUS,
        variables: { id, status },
      });
      return data.updateOrderStatus;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update order status");
    }
  }
);

interface OrderState {
  orders: any[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            status: action.payload.status,
          };
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = orderSlice.actions;
export default orderSlice.reducer;
