import type { Post, PostsParams, PostsResponse } from "../types/postTypes";
import { baseApi } from "./baseApi";

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPosts: builder.query<PostsResponse, PostsParams>({
      query: ({
        page = 1,
        page_size = 10,
        query = "",
        order_by = "",
        user_id,
      }) => ({
        url: "/posts",
        params: {
          page,
          page_size,
          ...(query && { query }),
          ...(order_by && { order_by }),
          ...(user_id && { user_id }),
        },
      }),
      providesTags: ["Post"],
    }),

    getPostById: builder.query<Post, number>({
      query: (id) => ({
        url: `/posts/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),

    createPost: builder.mutation<{ id: number }, FormData>({
      query: (data) => ({
        url: "/posts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Post"],
    }),

    updatePost: builder.mutation<void, { id: number; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/posts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Post"],
    }),

    deletePost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Post"],
    }),

    votePost: builder.mutation<void, { id: number; vote_type: "up" | "down" }>({
      query: ({ id, vote_type }) => ({
        url: `/posts/${id}/vote`,
        method: "POST",
        body: { vote_type },
      }),
    }),

    publishDrafts: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: `/posts/${id}/publish-drafts`,
        method: "PATCH",
      }),
      invalidatesTags: ["Post"],
    }),

    getUserPosts: builder.query<
      PostsResponse,
      {
        page: number;
        page_size: number;
        query: string;
        user_id?: number;
        order_by: string;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        query = "",
        order_by = "",
        user_id,
      }) => ({
        url: "/posts/user",
        params: { page, page_size, query, order_by, user_id },
      }),
      providesTags: ["Post"],
    }),

    getUserDrafts: builder.query<
      PostsResponse,
      { page: number; page_size: number; query: string; user_id: number }
    >({
      query: ({ page = 1, page_size = 20, query, user_id }) => ({
        url: "/posts/drafts",
        params: { page, page_size, query, user_id },
      }),
      providesTags: ["Post"],
    }),

    getUserScheduled: builder.query<
      PostsResponse,
      {
        page: number;
        page_size: number;
        query: string;
        user_id: number;
        order_by: string;
      }
    >({
      query: ({
        page = 1,
        page_size = 10,
        user_id,
        query = "",
        order_by = "",
      }) => ({
        url: "/posts/scheduled",
        params: { page, page_size, user_id, query, order_by },
      }),
      providesTags: ["Post"],
    }),

    getTrendingPosts: builder.query<{ posts: Post[] }, { limit?: number }>({
      query: ({ limit = 20 }) => ({
        url: "/posts/trending",
        params: { limit },
      }),
      providesTags: ["Post"],
    }),
  }),
});

export const {
  useGetAllPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useVotePostMutation,
  useGetUserPostsQuery,
  useGetUserDraftsQuery,
  useGetUserScheduledQuery,
  usePublishDraftsMutation,
  useGetTrendingPostsQuery,
} = postsApi;
