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