import { format } from "date-fns";

export interface ParsedAddress {
  name?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

export const formatDate = (dateString: string) => {
  try {
    // Convert the timestamp to milliseconds if it's in seconds
    const timestamp =
      dateString.length === 10
        ? parseInt(dateString) * 1000
        : parseInt(dateString);

    if (!isNaN(timestamp)) {
      return format(new Date(timestamp), "MMMM d, yyyy");
    }

    // Try parsing as ISO string
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return format(date, "MMMM d, yyyy");
    }

    return "Invalid date";
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid date";
  }
};

export const parseAddress = (addressString: string): ParsedAddress => {
  try {
    return JSON.parse(addressString);
  } catch (error) {
    // If JSON parsing fails, try to extract information using regex
    const addressMatch = addressString.match(
      /^(.*?)\s*,\s*(.*?)\s*,\s*(.*?)\s*-\s*(\d+)$/
    );
    if (addressMatch) {
      const [, address, city, state, pincode] = addressMatch;
      return { address, city, state, pincode };
    }

    // If all parsing fails, return a default structure
    return {
      name: "Address unavailable",
      address: addressString,
      city: "",
      state: "",
      pincode: "",
    };
  }
};

export const getOrderStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "DELIVERED":
      return "bg-green-100 text-green-800 border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};
