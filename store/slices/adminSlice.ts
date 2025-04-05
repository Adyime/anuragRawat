// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { client } from "@/lib/apollo-client";
// import { gql } from "@apollo/client";
// import redis from "@/lib/redis";

// // GraphQL Queries
// const GET_DASHBOARD_STATS = gql`
//   query GetDashboardStats {
//     totalRevenue
//     totalOrders
//     totalProducts
//     totalCustomers
//     recentOrders {
//       id
//       total
//       user {
//         name
//         email
//       }
//       createdAt
//     }
//     salesOverview {
//       date
//       revenue
//     }
//   }
// `;

// // Async Thunks
// export const fetchDashboardStats = createAsyncThunk(
//   "admin/fetchDashboardStats",
//   async (_, { rejectWithValue }) => {
//     try {
//       // Check Redis cache
//       const cached = await redis.get("dashboard:stats");
//       if (cached) {
//         return JSON.parse(cached);
//       }

//       // Fetch from GraphQL if not cached
//       const { data } = await client.query({
//         query: GET_DASHBOARD_STATS,
//       });

//       // Cache the result
//       await redis.setex("dashboard:stats", 300, JSON.stringify(data)); // Cache for 5 minutes

//       return data;
//     } catch (error: any) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// interface AdminState {
//   dashboardStats: any;
//   loading: boolean;
//   error: string | null;
// }

// const initialState: AdminState = {
//   dashboardStats: null,
//   loading: false,
//   error: null,
// };

// const adminSlice = createSlice({
//   name: "admin",
//   initialState,
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchDashboardStats.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchDashboardStats.fulfilled, (state, action) => {
//         state.loading = false;
//         state.dashboardStats = action.payload;
//       })
//       .addCase(fetchDashboardStats.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       });
//   },
// });

// export const { clearError } = adminSlice.actions;
// export default adminSlice.reducer;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// GraphQL Queries
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    totalRevenue
    totalOrders
    totalProducts
    totalCustomers
    recentOrders {
      id
      total
      user {
        name
        email
      }
      createdAt
    }
    salesOverview {
      date
      revenue
    }
  }
`;

// Async Thunks
export const fetchDashboardStats = createAsyncThunk(
  "admin/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_DASHBOARD_STATS,
      });

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface AdminState {
  dashboardStats: any;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  dashboardStats: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
