// state/api/commentsApi.ts
import { baseApi } from "./baseApi";
import type {
  Comment,
  CommentsResponse,
  CommentsParams,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "../types/commentTypes";

export const commentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommentsByPost: builder.query<CommentsResponse, CommentsParams>({
      query: ({
        postId,
        page = 1,
        page_size = 10,
        query = "",
        order_by = "",
      }) => ({
        url: `/posts/${postId}/comments`,
        params: {
          page,
          page_size,
          ...(query && { query }),
          ...(order_by && { order_by }),
        },
      }),
      providesTags: ["Comment"],
    }),

    getCommentById: builder.query<Comment, number>({
      query: (id) => ({
        url: `/comments/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: "Comment", id }],
    }),

    getNestedComments: builder.query<CommentsResponse, CommentsParams>({
      query: ({ postId, page = 1, page_size = 10 }) => ({
        url: `/comments/${postId}/replies`,
        params: { page, page_size },
      }),
      providesTags: ["Comment"],
    }),

    createComment: builder.mutation<
      { id: number },
      { postId: number; data: CreateCommentRequest }
    >({
      query: ({ postId, data }) => ({
        url: `/posts/${postId}/comments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Comment"],
    }),

    updateComment: builder.mutation<
      void,
      { id: number; data: UpdateCommentRequest }
    >({
      query: ({ id, data }) => ({
        url: `/comments/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Comment"],
    }),

    deleteComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment"],
    }),

    voteComment: builder.mutation<
      void,
      { id: number; vote_type: "up" | "down" }
    >({
      query: ({ id, vote_type }) => ({
        url: `/comments/${id}/vote`,
        method: "POST",
        body: { vote_type },
      }),
    }),
  }),
});

export const {
  useGetCommentsByPostQuery,
  useGetCommentByIdQuery,
  useGetNestedCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useVoteCommentMutation,
} = commentsApi;
