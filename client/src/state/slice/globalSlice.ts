import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Global {
  showPassword: boolean;
  searchQuery: string;
}

export const initialState: Global = {
  showPassword: false,
  searchQuery: "",
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    toggleShowPassword: (state) => {
      state.showPassword = !state.showPassword;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    clearSearch: (state) => {
      state.searchQuery = "";
    },
  },
});

export const { toggleShowPassword, setSearchQuery, clearSearch } =
  globalSlice.actions;

export default globalSlice.reducer;
