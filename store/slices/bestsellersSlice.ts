import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { gql } from "@apollo/client";
import { getClient } from "@/lib/client";

// Types
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  orderPercentage: number;
}

interface BestsellersState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

// GraphQL query
const GET_BESTSELLERS = gql`
  query GetBestsellers {
    bestsellers {
      id
      title
      description
      price
      discountedPrice
      images
      category {
        id
        name
      }
      orderPercentage
    }
  }
`;

// Async thunk
export const fetchBestsellers = createAsyncThunk(
  "bestsellers/fetchBestsellers",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await getClient().query({
        query: GET_BESTSELLERS,
      });
      return data.bestsellers;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("An error occurred while fetching bestsellers");
    }
  }
);

// Slice
const bestsellersSlice = createSlice({
  name: "bestsellers",
  initialState: {
    products: [],
    loading: false,
    error: null,
  } as BestsellersState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBestsellers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBestsellers.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.error = null;
      })
      .addCase(fetchBestsellers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.products = [];
      });
  },
});

export default bestsellersSlice.reducer;
