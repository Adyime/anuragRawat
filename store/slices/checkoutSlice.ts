import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// Define proper input type for createOrder that matches the schema.ts
interface OrderItemInput {
  productId: string;
  quantity: number;
  isEbook: boolean;
}

// This matches the OrderInput type from the schema.ts
interface OrderInput {
  items: OrderItemInput[];
  addressId: string;
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE";
  couponCode?: string | null;
}

// Update your mutation to match server schema exactly - without razorpayOrderId
const CREATE_ORDER = gql`
  mutation CreateOrder($input: OrderInput!) {
    createOrder(input: $input) {
      id
      total
      status
      paymentMethod
      paymentStatus
    }
  }
`;

const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($input: PaymentVerificationInput!) {
    verifyPayment(input: $input) {
      success
      message
      orderId
    }
  }
`;

export const createOrder = createAsyncThunk(
  "checkout/createOrder",
  async (input: OrderInput, { rejectWithValue }) => {
    try {
      // Add additional validation for the input
      if (!input.addressId) {
        console.error("Address ID is missing");
        return rejectWithValue("Address ID is required");
      }

      if (!input.items || input.items.length === 0) {
        console.error("No items in order");
        return rejectWithValue("Order must contain at least one item");
      }

      // Add debug logs for the input
      console.log("Creating order with input:", JSON.stringify(input, null, 2));
      console.log("Address ID:", input.addressId);
      console.log("Payment method:", input.paymentMethod);
      console.log("Items count:", input.items.length);

      // Basic fetch-based approach to debug the API directly
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation CreateOrder($input: OrderInput!) {
                createOrder(input: $input) {
                  id
                  total
                  status
                  paymentMethod
                  paymentStatus
                }
              }
            `,
            variables: { input },
          }),
        });

        const json = await response.json();
        console.log("Raw GraphQL response:", json);

        if (json.errors) {
          console.error("GraphQL errors from fetch:", json.errors);
          return rejectWithValue(json.errors[0]?.message || "GraphQL error");
        }

        if (!json.data || !json.data.createOrder) {
          console.error("Invalid response from server:", json);
          return rejectWithValue("Invalid server response");
        }

        const order = json.data.createOrder;
        console.log("Order created successfully:", order);

        // We'll handle razorpayOrderId in the checkout page now
        return order;
      } catch (fetchError: any) {
        console.error("Fetch approach failed:", fetchError);
        // Fall back to Apollo client as a second attempt
      }

      // Use Apollo client with a standard mutation as fallback
      console.log("Trying Apollo client approach...");
      try {
        const { data, errors } = await client.mutate({
          mutation: CREATE_ORDER,
          variables: { input },
          errorPolicy: 'all',
          fetchPolicy: 'no-cache',
          context: {
            // Add explicit headers to ensure proper authentication
            headers: {
              'Content-Type': 'application/json',
              // If using cookies for auth, important to include this
              'credentials': 'include'
            }
          }
        });

        // Log any GraphQL errors
        if (errors && errors.length > 0) {
          console.error("GraphQL errors:", errors);
          const errorDetails = errors.map(err => ({
            message: err.message,
            path: err.path,
            extensions: err.extensions
          }));
          console.error("Error details:", JSON.stringify(errorDetails, null, 2));
          
          let errorMessage = "Failed to create order";
          if (errors[0].message) {
            errorMessage = errors[0].message;
          }
          
          return rejectWithValue(errorMessage);
        }

        if (!data || !data.createOrder) {
          console.error("Invalid response from server:", data);
          return rejectWithValue("Server returned an invalid response");
        }

        console.log("Order created successfully via Apollo:", data.createOrder);
        
        // We'll handle razorpayOrderId in the checkout page now
        return data.createOrder;
      } catch (error: any) {
        console.error("Order creation error:", error);
        
        let errorMessage = "Failed to create order";
        
        if (error.message) {
          errorMessage = error.message;
        }
        
        if (error.networkError) {
          console.error("Network error details:", error.networkError);
          
          // More detailed error info for debugging
          const networkErrorDetails = {
            message: error.networkError.message,
            statusCode: error.networkError.statusCode,
            bodyText: error.networkError.bodyText,
            name: error.networkError.name
          };
          console.error("Network error full details:", networkErrorDetails);
          
          errorMessage = `Network error: ${error.networkError.message || 'Connection failed'}`;
        }
        
        if (error.graphQLErrors) {
          console.error("GraphQL errors:", error.graphQLErrors);
          errorMessage = error.graphQLErrors[0]?.message || errorMessage;
        }
        
        return rejectWithValue(errorMessage);
      }
    } catch (error: any) {
      console.error("Order creation error:", error);
      
      let errorMessage = "Failed to create order";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.networkError) {
        console.error("Network error details:", error.networkError);
        
        // More detailed error info for debugging
        const networkErrorDetails = {
          message: error.networkError.message,
          statusCode: error.networkError.statusCode,
          bodyText: error.networkError.bodyText,
          name: error.networkError.name
        };
        console.error("Network error full details:", networkErrorDetails);
        
        errorMessage = `Network error: ${error.networkError.message || 'Connection failed'}`;
      }
      
      if (error.graphQLErrors) {
        console.error("GraphQL errors:", error.graphQLErrors);
        errorMessage = error.graphQLErrors[0]?.message || errorMessage;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Define the interface for payment verification input
interface PaymentVerificationInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export const verifyPayment = createAsyncThunk(
  "checkout/verifyPayment",
  async (input: PaymentVerificationInput, { rejectWithValue }) => {
    try {
      console.log("⭐⭐⭐ VERIFYING PAYMENT IN FRONTEND - START ⭐⭐⭐");
      console.log("Payment verification input:", JSON.stringify(input, null, 2));
      
      // First try with fetch for more visibility
      try {
        console.log("Trying verifyPayment with direct fetch approach...");
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation VerifyPayment($input: PaymentVerificationInput!) {
                verifyPayment(input: $input) {
                  success
                  message
                  orderId
                }
              }
            `,
            variables: { input },
          }),
        });

        const json = await response.json();
        console.log("Raw GraphQL response for payment verification:", json);

        if (json.errors) {
          console.error("GraphQL errors from fetch in payment verification:", json.errors);
          return rejectWithValue(json.errors[0]?.message || "GraphQL error in payment verification");
        }

        if (!json.data || !json.data.verifyPayment) {
          console.error("Invalid response from server for payment verification:", json);
          return rejectWithValue("Invalid server response for payment verification");
        }

        const result = json.data.verifyPayment;
        console.log("Payment verification successful via fetch:", result);
        return result;
      } catch (fetchError) {
        console.error("Fetch approach for payment verification failed:", fetchError);
        // Fall back to Apollo client
      }
      
      // Fallback to Apollo client
      console.log("Trying payment verification with Apollo client...");
      const { data, errors } = await client.mutate({
        mutation: VERIFY_PAYMENT,
        variables: { input },
        errorPolicy: 'all',
        fetchPolicy: 'no-cache',
      });

      console.log("Apollo response for payment verification:", data);
      
      if (errors && errors.length > 0) {
        console.error("GraphQL errors in payment verification:", errors);
        return rejectWithValue(errors[0]?.message || "GraphQL error in payment verification");
      }

      if (!data || !data.verifyPayment) {
        console.error("Invalid response from server for payment verification:", data);
        return rejectWithValue("Server returned an invalid response for payment verification");
      }

      if (!data.verifyPayment.success) {
        console.error("Payment verification failed:", data.verifyPayment.message);
        return rejectWithValue(data.verifyPayment.message);
      }

      console.log("Payment verification successful:", data.verifyPayment);
      console.log("⭐⭐⭐ VERIFYING PAYMENT IN FRONTEND - END ⭐⭐⭐");
      return data.verifyPayment;
    } catch (error: any) {
      console.error("Payment verification error:", error);
      
      let errorMessage = "Failed to verify payment";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.networkError) {
        console.error("Network error details in payment verification:", error.networkError);
        errorMessage = `Network error: ${error.networkError.message || 'Connection failed'}`;
      }
      
      if (error.graphQLErrors) {
        console.error("GraphQL errors in payment verification:", error.graphQLErrors);
        errorMessage = error.graphQLErrors[0]?.message || errorMessage;
      }
      
      console.log("⭐⭐⭐ VERIFYING PAYMENT IN FRONTEND - FAILED ⭐⭐⭐");
      return rejectWithValue(errorMessage);
    }
  }
);

interface CheckoutState {
  loading: boolean;
  error: string | null;
  currentOrder: any | null;
  selectedAddress: any | null;
  paymentMethod: "ONLINE" | "CASH_ON_DELIVERY" | null;
}

const initialState: CheckoutState = {
  loading: false,
  error: null,
  currentOrder: null,
  selectedAddress: null,
  paymentMethod: null,
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    clearCheckout: (state) => {
      state.currentOrder = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedAddress, setPaymentMethod, clearCheckout } =
  checkoutSlice.actions;
export default checkoutSlice.reducer;
