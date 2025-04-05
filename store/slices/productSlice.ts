import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// GraphQL Queries
const GET_PRODUCTS = gql`
  query GetProducts(
    $search: String
    $category: String
    $language: Language
    $minPrice: Float
    $maxPrice: Float
    $isEbook: Boolean
    $sort: SortOrder
  ) {
    products(
      search: $search
      category: $category
      language: $language
      minPrice: $minPrice
      maxPrice: $maxPrice
      isEbook: $isEbook
      sort: $sort
    ) {
      id
      title
      description
      price
      discountedPrice
      isEbook
      ebookPrice
      ebookDiscounted
      isFree
      language
      stock
      images
      pdfUrl
      category {
        id
        name
      }
      subcategory {
        id
        name
      }
      reviews {
        id
        rating
        comment
        user {
          id
          name
        }
      }
    }
  }
`;

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      description
      price
      discountedPrice
      isEbook
      ebookPrice
      ebookDiscounted
      isFree
      language
      stock
      images
      pdfUrl
      category {
        id
        name
      }
      subcategory {
        id
        name
      }
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      title
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      title
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export enum Language {
  ENGLISH = "ENGLISH",
  HINDI = "HINDI",
  GUJARATI = "GUJARATI",
}

export interface ProductFilters {
  search?: string;
  category?: string;
  language?: Language;
  minPrice?: number;
  maxPrice?: number;
  isEbook?: boolean;
  sort?: "newest" | "price_asc" | "price_desc";
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discountedPrice?: number;
  isEbook: boolean;
  ebookPrice?: number;
  ebookDiscounted?: number;
  isFree: boolean;
  language: Language;
  stock: number;
  images: string[];
  pdfUrl?: string;
  category: {
    id: string;
    name: string;
  };
  reviews: {
    id: string;
    rating: number;
    comment?: string;
    user: {
      id: string;
      name: string;
    };
  }[];
}

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  lastUpdated: number | null;
  cache: {
    [key: string]: {
      data: Product[];
      timestamp: number;
    };
  };
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  loading: false,
  error: null,
  filters: {
    sort: "newest",
  },
  lastUpdated: null,
  cache: {},
};

// Helper function to generate cache key from filters
const generateCacheKey = (filters: ProductFilters): string => {
  return JSON.stringify(filters);
};

// Helper function to check if cache is valid (5 minutes)
const isCacheValid = (timestamp: number): boolean => {
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() - timestamp < CACHE_DURATION;
};

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (filters: ProductFilters, { getState, rejectWithValue }) => {
    try {
      console.log("Fetching products with filters:", filters);

      // Log the GraphQL operation being performed
      console.log("GraphQL query:", GET_PRODUCTS.loc?.source.body);
      console.log("Variables:", {
        ...filters,
        language: filters.language || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        sort: filters.sort || "newest",
      });

      try {
        // Add connection debugging
        console.log("Sending request to GraphQL endpoint:", "/api/graphql");

        const { data, errors } = await client.query({
          query: GET_PRODUCTS,
          variables: {
            ...filters,
            language: filters.language || undefined,
            category: filters.category || undefined,
            minPrice: filters.minPrice || undefined,
            maxPrice: filters.maxPrice || undefined,
            sort: filters.sort || "newest",
          },
          fetchPolicy: "network-only",
        });

        if (errors) {
          console.error("GraphQL errors:", JSON.stringify(errors, null, 2));
          throw new Error(errors[0].message);
        }

        if (!data || !data.products) {
          console.error("No products data returned from GraphQL");
          throw new Error("Failed to fetch products from GraphQL");
        }

        console.log("Fetched products count:", data.products.length);
        console.log(
          "First product (if any):",
          data.products.length > 0 ? data.products[0] : "No products"
        );

        if (data.products.length === 0) {
          console.warn(
            "API returned zero products. isEbook filter:",
            filters.isEbook
          );
        }

        return {
          products: data.products,
          fromCache: false,
        };
      } catch (error: any) {
        console.error("GraphQL query failed, detailed error:", error);
        console.error("Error message:", error.message);
        if (error.networkError) {
          console.error("Network error details:", error.networkError);
        }
        if (error.graphQLErrors) {
          console.error("GraphQL errors:", error.graphQLErrors);
        }

        // Show a more helpful error message
        let errorMessage = "GraphQL API error: " + error.message;
        if (error.networkError) {
          errorMessage +=
            " - Network issue: " + JSON.stringify(error.networkError);
        }

        // Don't fall back to test API anymore - throw the actual error
        return rejectWithValue(errorMessage);
      }
    } catch (error: any) {
      console.error("Error fetching products (all attempts failed):", error);
      return rejectWithValue(error.message || "Failed to fetch products");
    }
  }
);

// Add this new thunk for fetching a single product
export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async (id: string, { rejectWithValue }) => {
    try {
      console.log("Fetching product with ID:", id);
      const { data, errors } = await client.query({
        query: GET_PRODUCT,
        variables: { id },
        fetchPolicy: "network-only",
      });

      if (errors) {
        console.error("GraphQL errors:", errors);
        return rejectWithValue(errors[0].message);
      }

      if (!data.product) {
        console.error("No product data returned");
        return rejectWithValue("Product not found");
      }

      console.log("Fetched product:", data.product);
      return data.product;
    } catch (error: any) {
      console.error("Error fetching product:", error);
      if (error.graphQLErrors?.length > 0) {
        return rejectWithValue(error.graphQLErrors[0].message);
      }
      if (error.networkError) {
        return rejectWithValue("Network error. Please check your connection.");
      }
      return rejectWithValue(error.message || "Failed to fetch product");
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (input: any, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_PRODUCT,
        variables: { input },
      });
      return data.createProduct;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, input }: { id: string; input: any }, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_PRODUCT,
        variables: { id, input },
      });
      return data.updateProduct;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id: string, { rejectWithValue }) => {
    try {
      await client.mutate({
        mutation: DELETE_PRODUCT,
        variables: { id },
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.cache = {};
      state.lastUpdated = null;
    },
    invalidateCache: (state) => {
      state.cache = {};
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.products = action.payload.products;
        state.lastUpdated = Date.now();

        // Cache the results if not already cached
        const cacheKey = generateCacheKey(state.filters);
        if (!state.cache[cacheKey] || !action.payload.fromCache) {
          state.cache[cacheKey] = {
            data: action.payload.products,
            timestamp: Date.now(),
          };
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.products = [];
        state.error = action.payload
          ? String(action.payload)
          : "Failed to fetch products";
      })
      // Fetch Single Product
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentProduct,
  clearCurrentProduct,
  setFilters,
  resetFilters,
  invalidateCache,
} = productSlice.actions;

// Selectors
export const selectProducts = (state: { products: ProductState }) =>
  state.products.products;
export const selectCurrentProduct = (state: { products: ProductState }) =>
  state.products.currentProduct;
export const selectLoading = (state: { products: ProductState }) =>
  state.products.loading;
export const selectError = (state: { products: ProductState }) =>
  state.products.error;
export const selectFilters = (state: { products: ProductState }) =>
  state.products.filters;
export const selectLastUpdated = (state: { products: ProductState }) =>
  state.products.lastUpdated;

export default productSlice.reducer;
