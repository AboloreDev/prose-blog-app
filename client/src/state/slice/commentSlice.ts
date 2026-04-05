// state/slice/commentsSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Comment, CommentMetaData } from "../types/commentTypes";

interface CommentsState {
  comments: Comment[];
  currentPostId: number | null;
  replyingTo: number | null;
  editingCommentId: number | null;
  metadata: CommentMetaData | null;
  isCreating: boolean;
}

const initialState: CommentsState = {
  comments: [],
  currentPostId: null,
  replyingTo: null,
  editingCommentId: null,
  metadata: null,
  isCreating: false,
};

export const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    setComments: (
      state,
      action: PayloadAction<{ postId: number; comments: Comment[] }>,
    ) => {
      state.comments = action.payload.comments;
      state.currentPostId = action.payload.postId;
    },
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.unshift(action.payload);
    },
    addReply: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload);
      // Update parent reply count
      const parent = state.comments.find(
        (c) => c.id === action.payload.parent_id,
      );
      if (parent) {
        parent.reply_count += 1;
      }
    },
    updateCommentVote: (
      state,
      action: PayloadAction<{
        commentId: number;
        newCount: number;
        userVote: "up" | "down" | null;
      }>,
    ) => {
      const comment = state.comments.find(
        (c) => c.id === action.payload.commentId,
      );
      if (comment) {
        comment.comment_vote_count = action.payload.newCount;
      }
    },
    deleteComment: (state, action: PayloadAction<number>) => {
      state.comments = state.comments.filter((c) => c.id !== action.payload);
    },
    setReplyingTo: (state, action: PayloadAction<number | null>) => {
      state.replyingTo = action.payload;
      state.editingCommentId = null;
    },
    setEditingComment: (state, action: PayloadAction<number | null>) => {
      state.editingCommentId = action.payload;
      state.replyingTo = null;
    },
    setCreatingComment: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload;
    },
    clearComments: (state) => {
      state.comments = [];
      state.currentPostId = null;
      state.replyingTo = null;
      state.editingCommentId = null;
    },
  },
});

export const {
  setComments,
  addComment,
  addReply,
  updateCommentVote,
  deleteComment,
  setReplyingTo,
  setEditingComment,
  setCreatingComment,
  clearComments,
} = commentsSlice.actions;

export default commentsSlice.reducer;
