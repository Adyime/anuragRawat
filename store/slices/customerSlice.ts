import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      email
      image
      role
      createdAt
      orders {
        id
        total
        status
        paymentMethod
        paymentStatus
        createdAt
      }
      reviews {
        id
        rating
        comment
        createdAt
        product {
          id
          title
        }
      }
      addresses {
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
  }
`;

const UPDATE_CUSTOMER_ROLE = gql`
  mutation UpdateCustomerRole($id: ID!, $role: Role!) {
    updateCustomerRole(id: $id, role: $role) {
      id
      role
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_CUSTOMERS,
        fetchPolicy: "network-only",
      });
      return data.customers;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch customers");
    }
  }
);

export const updateCustomerRole = createAsyncThunk(
  "customers/updateCustomerRole",
  async ({ id, role }: { id: string; role: string }, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_CUSTOMER_ROLE,
        variables: { id, role },
      });
      return data.updateCustomerRole;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update customer role");
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: DELETE_CUSTOMER,
        variables: { id },
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete customer");
    }
  }
);

interface CustomerState {
  customers: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  loading: false,
  error: null,
};

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Customer Role
      .addCase(updateCustomerRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomerRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customers.findIndex(
          (c) => c.id === action.payload.id
        );
        if (index !== -1) {
          state.customers[index] = {
            ...state.customers[index],
            role: action.payload.role,
          };
        }
      })
      .addCase(updateCustomerRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Customer
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.filter(
          (c) => c.id !== action.payload
        );
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = customerSlice.actions;
export default customerSlice.reducer;
