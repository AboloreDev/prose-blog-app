import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../types/authTypes";

interface Auth {
  user: User | null;
  showPassword: boolean;
  access_token: string | null;
  joinedCommunityIds: number[];
}

const initialState: Auth = {
  user: JSON.parse(sessionStorage.getItem("user") || "null"),
  showPassword: false,
  access_token: sessionStorage.getItem("access_token"),
  joinedCommunityIds: [],
};

export const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      sessionStorage.setItem("user", JSON.stringify(action.payload));
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.access_token = action.payload;
      sessionStorage.setItem("access_token", action.payload);
    },
    setJoinedCommunities: (state, action: PayloadAction<number[]>) => {
      state.joinedCommunityIds = action.payload;
    },
    addJoinedCommunity: (state, action: PayloadAction<number>) => {
      if (!state.joinedCommunityIds.includes(action.payload)) {
        state.joinedCommunityIds.push(action.payload);
      }
    },
    removeJoinedCommunity: (state, action: PayloadAction<number>) => {
      state.joinedCommunityIds = state.joinedCommunityIds.filter(
        (id) => id !== action.payload,
      );
    },
    logoutUser: (state) => {
      state.user = null;
      state.access_token = null;
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user");
    },
  },
});

export const {
  setUser,
  logoutUser,
  setAccessToken,
  addJoinedCommunity,
  removeJoinedCommunity,
  setJoinedCommunities,
} = AuthSlice.actions;

export default AuthSlice.reducer;
