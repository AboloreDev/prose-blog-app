import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Community, MetaData } from "../types/communityTypes";

interface CommunityState {
  communities: Community[];
  communityMetadata: MetaData | null;
  currentCommunity: Community | null;
  joinedCommunityIds: number[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CommunityState = {
  communities: [],
  communityMetadata: null,
  currentCommunity: null,
  joinedCommunityIds: JSON.parse(
    sessionStorage.getItem("joinedCommunities") || "[]",
  ),
  isLoading: false,
  error: null,
};

export const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    setCommunities: (state, action: PayloadAction<Community[]>) => {
      state.communities = action.payload;
    },
    setCurrentCommunity: (state, action: PayloadAction<Community>) => {
      state.currentCommunity = action.payload;
    },
    joinCommunity: (state, action: PayloadAction<number>) => {
      if (!state.joinedCommunityIds.includes(action.payload)) {
        state.joinedCommunityIds.push(action.payload);
        sessionStorage.setItem(
          "joinedCommunities",
          JSON.stringify(state.joinedCommunityIds),
        );
      }
    },
    leaveCommunity: (state, action: PayloadAction<number>) => {
      state.joinedCommunityIds = state.joinedCommunityIds.filter(
        (id) => id !== action.payload,
      );
      sessionStorage.setItem(
        "joinedCommunities",
        JSON.stringify(state.joinedCommunityIds),
      );
    },
    setCommunityLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCommunityError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCommunityMetadata: (state, action: PayloadAction<MetaData | null>) => {
      state.communityMetadata = action.payload;
    },
  },
});

export const {
  setCommunities,
  setCurrentCommunity,
  joinCommunity,
  leaveCommunity,
  setCommunityLoading,
  setCommunityError,
  setCommunityMetadata,
} = communitySlice.actions;

export default communitySlice.reducer;
