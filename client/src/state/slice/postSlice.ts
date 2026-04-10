import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MetaData, Post } from "../types/postTypes";

type ActiveTab = "text" | "image" | "link";

interface PostsState {
  posts: Post[];
  metadata: MetaData | null;
  isLoading: boolean;
  error: string | null;
  userVote: "up" | "down" | null;
  localVoteCount: number;
  isSheetOpen: boolean;
  activeTab: ActiveTab;
  preselectedCommunityId: number | null;
  isEditPostsSheetOpen: boolean;
  isDeleteModalOpen: boolean;
  editingPost: Post | null;
  deletingPost: Post | null;
}

const initialState: PostsState = {
  posts: [],
  metadata: null,
  isLoading: false,
  error: null,
  userVote: null,
  localVoteCount: 0,
  isSheetOpen: false,
  activeTab: "text",
  preselectedCommunityId: null,
  isEditPostsSheetOpen: false,
  isDeleteModalOpen: false,
  editingPost: null,
  deletingPost: null,
};

export const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
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
      state.userVote = null;
      state.localVoteCount = 0;
    },
    // Sheet actions
    openSheet: (
      state,
      action: PayloadAction<{ tab: ActiveTab; communityId?: number }>,
    ) => {
      state.isSheetOpen = true;
      state.activeTab = action.payload.tab;
      state.preselectedCommunityId = action.payload.communityId ?? null;
    },
    closeSheet: (state) => {
      state.isSheetOpen = false;
      state.activeTab = "text";
      state.preselectedCommunityId = null;
    },
    setActiveTab: (state, action: PayloadAction<ActiveTab>) => {
      state.activeTab = action.payload;
    },

    openEditSheet: (state, action: PayloadAction<Post>) => {
      state.editingPost = action.payload;
      state.isEditPostsSheetOpen = true;
    },

    closeEditSheet: (state) => {
      state.editingPost = null;
      state.isEditPostsSheetOpen = false;
    },

    openDeleteModal: (state, action: PayloadAction<Post>) => {
      state.deletingPost = action.payload;
      state.isDeleteModalOpen = true;
    },

    closeDeleteModal: (state) => {
      state.deletingPost = null;
      state.isDeleteModalOpen = false;
    },
  },
});

export const {
  setPosts,
  updatePostVote,
  setMetadata,
  setPostsLoading,
  setPostsError,
  clearCurrentPost,
  openSheet,
  closeSheet,
  setActiveTab,
  closeDeleteModal,
  closeEditSheet,
  openDeleteModal,
  openEditSheet,
} = postsSlice.actions;

export default postsSlice.reducer;
