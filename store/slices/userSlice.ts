import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  isEbook: boolean;
  product: {
    id: string;
    title: string;
    images: string[];
  };
}

export interface Order {
  id: string;
  total: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "ONLINE" | "CASH_ON_DELIVERY";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  address: {
    id: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
  items: OrderItem[];
  shipmentDetails?: {
    trackingId: string;
    courier: string;
    estimatedDelivery?: string;
    currentStatus: string;
    currentLocation?: string;
  };
}

// GraphQL Queries and Mutations
const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: ProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      email
      image
    }
  }
`;

const GET_USER_ORDERS = gql`
  query GetUserOrders {
    userOrders {
      id
      total
      status
      paymentMethod
      paymentStatus
      address {
        id
        name
        phone
        street
        city
        state
        pincode
      }
      createdAt
      items {
        id
        quantity
        price
        isEbook
        product {
          id
          title
          images
        }
      }
      shipmentDetails {
        trackingId
        courier
        estimatedDelivery
        currentStatus
        currentLocation
      }
    }
  }
`;

const GET_USER_ADDRESSES = gql`
  query GetUserAddresses {
    userAddresses {
      id
      name
      phone
      address
      city
      state
      pincode
      isDefault
    }
  }
`;

// Async Thunks
export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (input: { name: string; image?: string }, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_PROFILE,
        variables: { input },
      });
      return data.updateProfile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  "user/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_USER_ORDERS,
        fetchPolicy: "network-only",
      });
      return data.userOrders;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserAddresses = createAsyncThunk(
  "user/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_USER_ADDRESSES,
        fetchPolicy: "network-only",
      });
      return data.userAddresses;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface UserState {
  profile: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
    role: "USER" | "ADMIN";
  } | null;
  orders: Order[];
  addresses: {
    id: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  orders: [],
  addresses: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.profile = null;
      state.orders = [];
      state.addresses = [];
      state.error = null;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.orders = [];
      state.addresses = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Addresses
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProfile, clearError, logout, clearProfile } =
  userSlice.actions;
export default userSlice.reducer;
