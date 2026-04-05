import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MetaData, Post } from "../types/postTypes";

type ActiveTab = "text" | "image" | "link";

interface PostsState {
  posts: Post[];
  currentPost: Post | null;
  metadata: MetaData | null;
  isLoading: boolean;
  error: string | null;
  userVote: "up" | "down" | null;
  localVoteCount: number;
  isSheetOpen: boolean;
  activeTab: ActiveTab;
}

const initialState: PostsState = {
  posts: [],
  currentPost: null,
  metadata: null,
  isLoading: false,
  error: null,
  userVote: null,
  localVoteCount: 0,
  isSheetOpen: false,
  activeTab: "text",
};

export const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },
    setCurrentPost: (state, action: PayloadAction<Post>) => {
      state.currentPost = action.payload;
      state.localVoteCount = action.payload.votes_count;
      state.userVote = null;
    },
    updatePostVote: (
      state,
      action: PayloadAction<{
        newCount: number;
        userVote: "up" | "down" | null;
      }>,
    ) => {
      state.localVoteCount = action.payload.newCount;
      state.userVote = action.payload.userVote;
      if (state.currentPost) {
        state.currentPost.votes_count = action.payload.newCount;
      }
    },
    setMetadata: (state, action: PayloadAction<MetaData>) => {
      state.metadata = action.payload;
    },
    setPostsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPostsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
      state.userVote = null;
      state.localVoteCount = 0;
    },
    // Sheet actions
    openSheet: (state, action: PayloadAction<ActiveTab>) => {
      state.isSheetOpen = true;
      state.activeTab = action.payload;
    },
    closeSheet: (state) => {
      state.isSheetOpen = false;
      state.activeTab = "text";
    },
    setActiveTab: (state, action: PayloadAction<ActiveTab>) => {
      state.activeTab = action.payload;
    },
  },
});

export const {
  setPosts,
  setCurrentPost,
  updatePostVote,
  setMetadata,
  setPostsLoading,
  setPostsError,
  clearCurrentPost,
  openSheet,
  closeSheet,
  setActiveTab,
} = postsSlice.actions;

export default postsSlice.reducer;
