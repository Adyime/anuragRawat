import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  loading: boolean;
  toast: {
    message: string | null;
    type: 'success' | 'error' | 'info' | null;
  };
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: false,
  loading: false,
  toast: {
    message: null,
    type: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    showToast: (
      state,
      action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>
    ) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = {
        message: null,
        type: null,
      };
    },
  },
});

export const { setTheme, toggleSidebar, setLoading, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;