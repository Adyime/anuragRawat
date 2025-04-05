import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// GraphQL Queries
const GET_COUPONS = gql`
  query GetCoupons {
    coupons {
      id
      code
      description
      discountPercent
      maxDiscount
      minOrderValue
      usageLimit
      usedCount
      startDate
      endDate
      isActive
      category {
        id
        name
      }
    }
  }
`;

// Async Thunks
export const fetchCoupons = createAsyncThunk(
  "coupons/fetchCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_COUPONS,
        fetchPolicy: "network-only",
      });
      return data.coupons;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCoupon = createAsyncThunk(
  "coupons/createCoupon",
  async (input: any, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: gql`
          mutation CreateCoupon($input: CouponInput!) {
            createCoupon(input: $input) {
              id
              code
              description
              discountPercent
              maxDiscount
              minOrderValue
              usageLimit
              usedCount
              startDate
              endDate
              isActive
              category {
                id
                name
              }
            }
          }
        `,
        variables: { input },
      });
      return data.createCoupon;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCoupon = createAsyncThunk(
  "coupons/updateCoupon",
  async ({ id, input }: { id: string; input: any }, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: gql`
          mutation UpdateCoupon($id: ID!, $input: CouponInput!) {
            updateCoupon(id: $id, input: $input) {
              id
              code
              description
              discountPercent
              maxDiscount
              minOrderValue
              usageLimit
              usedCount
              startDate
              endDate
              isActive
              category {
                id
                name
              }
            }
          }
        `,
        variables: { id, input },
      });
      return data.updateCoupon;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  "coupons/deleteCoupon",
  async (id: string, { rejectWithValue }) => {
    try {
      await client.mutate({
        mutation: gql`
          mutation DeleteCoupon($id: ID!) {
            deleteCoupon(id: $id)
          }
        `,
        variables: { id },
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface CouponState {
  coupons: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CouponState = {
  coupons: [],
  loading: false,
  error: null,
};

const couponSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Coupon
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons.unshift(action.payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Coupon
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.coupons.findIndex(
          (c) => c.id === action.payload.id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Coupon
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = state.coupons.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = couponSlice.actions;
export default couponSlice.reducer;
