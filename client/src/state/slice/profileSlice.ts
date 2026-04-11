import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "@/state/types/profileTypes";

interface ProfileState {
  viewedUser: UserProfile | null;
  isEditSheetOpen: boolean;
  isFollowersSheetOpen: boolean;
  isFollowingSheetOpen: boolean;
  activeTab: "posts" | "comments";
}

const initialState: ProfileState = {
  viewedUser: null,
  isEditSheetOpen: false,
  isFollowersSheetOpen: false,
  isFollowingSheetOpen: false,
  activeTab: "posts",
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setViewedUser: (state, action: PayloadAction<UserProfile>) => {
      state.viewedUser = action.payload;
    },
    setIsEditSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.isEditSheetOpen = action.payload;
    },
    setIsFollowersSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.isFollowersSheetOpen = action.payload;
    },
    setIsFollowingSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.isFollowingSheetOpen = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<ProfileState["activeTab"]>) => {
      state.activeTab = action.payload;
    },
    clearViewedUser: (state) => {
      state.viewedUser = null;
    },
  },
});

export const {
  setViewedUser,
  setIsEditSheetOpen,
  setIsFollowersSheetOpen,
  setIsFollowingSheetOpen,
  setActiveTab,
  clearViewedUser,
} = profileSlice.actions;

export default profileSlice.reducer;
