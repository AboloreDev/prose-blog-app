import type { Post, PostsParams, PostsResponse } from "../types/postTypes";
import { baseApi } from "./baseApi";

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPosts: builder.query<PostsResponse, PostsParams>({
      query: ({ page = 1, page_size = 10, query = "", order_by = "" }) => ({
        url: "/posts",
        params: {
          page,
          page_size,
          ...(query && { query }),
          ...(order_by && { order_by }),
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

    getUserPosts: builder.query<PostsResponse, PostsParams>({
      query: ({ page = 1, page_size = 10, query = "", order_by = "" }) => ({
        url: "/posts/user",
        params: { page, page_size, query, order_by },
      }),
      providesTags: ["Post"],
    }),

    getUserDrafts: builder.query<PostsResponse, PostsParams>({
      query: ({ page = 1, page_size = 10 }) => ({
        url: "/posts/drafts",
        params: { page, page_size },
      }),
      providesTags: ["Post"],
    }),

    getUserScheduled: builder.query<PostsResponse, PostsParams>({
      query: ({ page = 1, page_size = 10 }) => ({
        url: "/posts/scheduled",
        params: { page, page_size },
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
} = postsApi;
