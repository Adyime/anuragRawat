import axios from "axios";

const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v1/external";

class ShiprocketAPI {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private pickupLocations: any[] | null = null;

  private async getToken() {
    // Check if token exists and is not expired
    if (this.token && this.tokenExpiry && this.tokenExpiry > Date.now()) {
      console.log("Using existing Shiprocket token (still valid)");
      return this.token;
    }

    try {
      // Log the environment variables for debugging (redact the password)
      console.log("Requesting new Shiprocket token with credentials:");
      const email = process.env.SHIPROCKET_EMAIL || process.env.NEXT_PUBLIC_SHIPROCKET_EMAIL;
      console.log("Email:", email);
      console.log("Password configured:", process.env.SHIPROCKET_PASSWORD || process.env.NEXT_PUBLIC_SHIPROCKET_PASSWORD ? "Yes" : "No");

      // Validate credentials before making the API call
      if (!email || !(process.env.SHIPROCKET_PASSWORD || process.env.NEXT_PUBLIC_SHIPROCKET_PASSWORD)) {
        throw new Error("Shiprocket credentials not properly configured");
      }

      const response = await axios.post(`${SHIPROCKET_API_URL}/auth/login`, {
        email: email,
        password: process.env.SHIPROCKET_PASSWORD || process.env.NEXT_PUBLIC_SHIPROCKET_PASSWORD,
      });

      if (!response.data || !response.data.token) {
        console.error("Invalid Shiprocket authentication response:", response.data);
        throw new Error("Failed to obtain Shiprocket authentication token");
      }

      this.token = response.data.token;
      // Set token expiry to 24 hours from now
      this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
      console.log("Successfully obtained new Shiprocket token");

      return this.token;
    } catch (error) {
      console.error("Error getting Shiprocket token:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Shiprocket API response:", error.response.data);
        console.error("Status code:", error.response.status);
      }
      throw error;
    }
  }

  async createOrder(orderData: any) {
    try {
      const tokenValue = await this.getToken();
      console.log("Token obtained successfully, creating Shiprocket order");

      // Ensure payment_method is correctly set for online orders
      if (orderData.payment_method === "Prepaid") {
        console.log("Setting payment method to Prepaid for online order");
        // Make sure this exact format is used - required by Shiprocket
        orderData.payment_method = "Prepaid";
      }
      
      // Validate and fix required fields
      const requiredFields = [
        'order_id', 'order_date', 'pickup_location', 
        'billing_customer_name', 'billing_address', 'billing_city', 
        'billing_state', 'billing_pincode', 'billing_country', 
        'billing_email', 'billing_phone', 'shipping_customer_name',
        'shipping_address', 'shipping_city', 'shipping_state',
        'shipping_pincode', 'shipping_country', 'shipping_email',
        'shipping_phone', 'order_items'
      ];
      
      // Check all required fields exist
      const missingFields = requiredFields.filter(field => !orderData[field]);
      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
      }
      
      // Ensure numeric values are sent as numbers, not strings
      if (orderData.shipping_charges) orderData.shipping_charges = Number(orderData.shipping_charges);
      if (orderData.giftwrap_charges) orderData.giftwrap_charges = Number(orderData.giftwrap_charges);
      if (orderData.transaction_charges) orderData.transaction_charges = Number(orderData.transaction_charges);
      if (orderData.total_discount) orderData.total_discount = Number(orderData.total_discount);
      if (orderData.sub_total) orderData.sub_total = Number(orderData.sub_total);
      if (orderData.length) orderData.length = Number(orderData.length);
      if (orderData.breadth) orderData.breadth = Number(orderData.breadth);
      if (orderData.height) orderData.height = Number(orderData.height);
      if (orderData.weight) orderData.weight = Number(orderData.weight);
      
      // Ensure order_items are valid
      if (orderData.order_items && Array.isArray(orderData.order_items)) {
        orderData.order_items = orderData.order_items.map((item: any) => ({
          ...item,
          units: Number(item.units),
          selling_price: Number(item.selling_price),
          discount: Number(item.discount || 0),
          tax: Number(item.tax || 0)
        }));
      }
      
      // Add channel_id if missing (required by Shiprocket)
      if (!orderData.channel_id) {
        orderData.channel_id = "custom";
      }
      
      // Ensure order_date is in YYYY-MM-DD format
      if (orderData.order_date && !/^\d{4}-\d{2}-\d{2}$/.test(orderData.order_date)) {
        const date = new Date(orderData.order_date);
        orderData.order_date = date.toISOString().split('T')[0];
      }

      // Log the request data for debugging
      console.log("Sending to Shiprocket:", JSON.stringify(orderData, null, 2));

      const response = await axios.post(
        `${SHIPROCKET_API_URL}/orders/create/adhoc`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${tokenValue}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log("Initial Shiprocket response:", JSON.stringify(response.data, null, 2));
      
      // Handle pickup location error and retry
      if (response.data && response.data.message && 
          response.data.message.includes("Wrong Pickup location") && 
          response.data.data && response.data.data.data) {
        
        console.log("Received wrong pickup location error. Available locations:", JSON.stringify(response.data.data.data, null, 2));
        
        // Extract valid pickup locations from the error response
        const validLocations = response.data.data.data;
        if (Array.isArray(validLocations) && validLocations.length > 0) {
          // Get a valid pickup location
          const validLocation = validLocations[0].pickup_location || validLocations[0].name;
          
          console.log(`Using valid pickup location from response: ${validLocation}`);
          
          // Update the pickup location and retry
          orderData.pickup_location = validLocation;
          
          console.log("Retrying with correct pickup location:", JSON.stringify(orderData, null, 2));
          
          // Retry the request with the valid location
          const retryResponse = await axios.post(
            `${SHIPROCKET_API_URL}/orders/create/adhoc`,
            orderData,
            {
              headers: {
                Authorization: `Bearer ${tokenValue}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          console.log("Retry order creation response:", JSON.stringify(retryResponse.data, null, 2));
          return retryResponse.data;
        } else {
          throw new Error("No valid pickup locations found in response");
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("Error creating Shiprocket order:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Shiprocket API error response data:", error.response.data);
        console.error("Shiprocket API error status:", error.response.status);
        
        // Check for pickup location error in the error response
        if (error.response.status === 422 && 
            error.response.data && 
            error.response.data.message && 
            error.response.data.message.includes("Wrong Pickup location") &&
            error.response.data.data && 
            error.response.data.data.data) {
          
          console.log("Found pickup locations in error response:", JSON.stringify(error.response.data.data.data, null, 2));
          
          // Extract valid pickup locations from the error response
          const validLocations = error.response.data.data.data;
          if (Array.isArray(validLocations) && validLocations.length > 0) {
            // Get a valid pickup location
            const validLocation = validLocations[0].pickup_location || validLocations[0].name;
            
            console.log(`Using valid pickup location from error: ${validLocation}`);
            
            // Update the pickup location and retry
            orderData.pickup_location = validLocation;
            
            console.log("Retrying with correct pickup location:", JSON.stringify(orderData, null, 2));
            
            try {
              const tokenForRetry = await this.getToken();
              // Retry the request with the valid location
              const retryResponse = await axios.post(
                `${SHIPROCKET_API_URL}/orders/create/adhoc`,
                orderData,
                {
                  headers: {
                    Authorization: `Bearer ${tokenForRetry}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              
              console.log("Retry order creation response:", JSON.stringify(retryResponse.data, null, 2));
              return retryResponse.data;
            } catch (retryError) {
              console.error("Error during retry:", retryError);
              throw retryError;
            }
          }
        } 
        // Handle other 422 validation errors
        else if (error.response.status === 422) {
          console.error("Shiprocket validation error (422):", JSON.stringify(error.response.data, null, 2));
          
          // Try to extract specific field validation errors
          if (error.response.data && error.response.data.errors) {
            console.error("Validation errors by field:", error.response.data.errors);
          }
          
          // If there's a message in the response, include it in the error
          const errorMessage = error.response.data && error.response.data.message 
            ? error.response.data.message 
            : "Shiprocket validation error";
            
          throw new Error(errorMessage);
        }
      }
      throw error;
    }
  }

  async getPickupLocations() {
    try {
      const tokenValue = await this.getToken();
      console.log("Getting Shiprocket pickup locations");
      
      const response = await axios.get(`${SHIPROCKET_API_URL}/settings/company/pickup`, {
        headers: {
          Authorization: `Bearer ${tokenValue}`,
        },
      });
      
      console.log("Pickup locations response:", JSON.stringify(response.data, null, 2));
      
      // First try the standard response format
      if (response.data && Array.isArray(response.data.data)) {
        console.log(`Found ${response.data.data.length} pickup locations in standard format`);
        return response.data.data;
      } 
      
      // Try alternative response format
      if (response.data && response.data.data && response.data.data.shipping_address) {
        console.log("Found pickup locations in shipping_address:", response.data.data.shipping_address);
        return response.data.data.shipping_address;
      }
      
      // If we've reached here, no valid locations found
      console.warn("No pickup locations available in response. Using fallback.", response.data);
      
      // If manually extracting didn't work, check if there's an error message with pickup locations
      if (response.data && response.data.message && response.data.message.includes("pickup location")) {
        console.log("Trying to extract pickup locations from error message");
        // Some Shiprocket error responses include valid locations in the data field
        if (response.data.data && Array.isArray(response.data.data.data)) {
          console.log("Found pickup locations in error data");
          return response.data.data.data;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching pickup locations:', error);
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        // Some errors might contain pickup locations in the error response
        console.log("Looking for pickup locations in error response");
        if (error.response.data.data && Array.isArray(error.response.data.data.data)) {
          return error.response.data.data.data;
        }
      }
      return [];
    }
  }

  async getDefaultPickupLocation() {
    try {
      const locations = await this.getPickupLocations();
      if (!locations || locations.length === 0) {
        console.warn("No pickup locations found, using 'Primary' as default");
        return "Primary";
      }

      console.log(`Found ${locations.length} pickup locations, using first one as default`);
      // Either get the pickup_location field or name field from the first location
      const location = locations[0];
      if (location.pickup_location) {
        return location.pickup_location;
      } else if (location.name) {
        return location.name;
      } else {
        console.warn("Location found but missing pickup_location/name field, using 'Primary'");
        return "Primary";
      }
    } catch (error) {
      console.error("Error getting default pickup location:", error);
      return "Primary"; 
    }
  }

  async trackOrder(trackingNumber: string) {
    try {
      const token = await this.getToken();
      const response = await axios.get(
        `${SHIPROCKET_API_URL}/courier/track/shipment/${trackingNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error tracking Shiprocket order:", error);
      throw error;
    }
  }

  async cancelOrder(shiprocketOrderId: string) {
    try {
      const token = await this.getToken();
      const response = await axios.post(
        `${SHIPROCKET_API_URL}/orders/cancel`,
        {
          ids: [shiprocketOrderId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error cancelling Shiprocket order:", error);
      throw error;
    }
  }

  async generateAWB(shipmentId: string, courierId: string) {
    try {
      const token = await this.getToken();
      const response = await axios.post(
        `${SHIPROCKET_API_URL}/courier/assign/awb`,
        {
          shipment_id: shipmentId,
          courier_id: courierId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error generating AWB:", error);
      throw error;
    }
  }

  async generateLabel(shipmentId: string) {
    try {
      const token = await this.getToken();
      const response = await axios.post(
        `${SHIPROCKET_API_URL}/courier/generate/label`,
        {
          shipment_id: [shipmentId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error generating label:", error);
      throw error;
    }
  }

  async generateInvoice(orderId: string) {
    try {
      const token = await this.getToken();
      const response = await axios.post(
        `${SHIPROCKET_API_URL}/orders/print/invoice`,
        {
          ids: [orderId],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw error;
    }
  }
}

export const shiprocket = new ShiprocketAPI();