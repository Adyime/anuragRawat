import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// GraphQL Queries and Mutations
const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      description
      subcategories {
        id
        name
        description
        products {
          id
        }
      }
      products {
        id
      }
    }
  }
`;

const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CategoryInput!) {
    createCategory(input: $input) {
      id
      name
      description
      subcategories {
        id
        name
        description
      }
    }
  }
`;

const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: CategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      description
      subcategories {
        id
        name
        description
      }
    }
  }
`;

const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

export interface Category {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
  }[];
  products: {
    id: string;
  }[];
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_CATEGORIES,
        fetchPolicy: "network-only",
      });
      return data.categories;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (
    input: { name: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_CATEGORY,
        variables: { input },
      });
      return data.createCategory;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async (
    {
      id,
      input,
    }: { id: string; input: { name: string; description?: string } },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_CATEGORY,
        variables: { id, input },
      });
      return data.updateCategory;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id: string, { rejectWithValue }) => {
    try {
      await client.mutate({
        mutation: DELETE_CATEGORY,
        variables: { id },
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(
          (cat) => cat.id === action.payload.id
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(
          (cat) => cat.id !== action.payload
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = categorySlice.actions;
export default categorySlice.reducer;

// Selectors
export const selectCategories = (state: { categories: CategoryState }) =>
  state.categories.categories;
export const selectCategoriesLoading = (state: { categories: CategoryState }) =>
  state.categories.loading;
export const selectCategoriesError = (state: { categories: CategoryState }) =>
  state.categories.error;
