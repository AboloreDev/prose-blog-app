import { baseApi } from "./baseApi";
import type {
  CommunitiesParams,
  CommunitiesResponse,
  Community,
  CommunityMember,
} from "../types/communityTypes";

export const communityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCommunities: builder.query<CommunitiesResponse, CommunitiesParams>({
      query: ({ page = 1, page_size = 10, query = "", order_by = "" }) => ({
        url: "/communities",
        params: {
          page,
          page_size,
          ...(query && { query }),
          ...(order_by && { order_by }),
        },
      }),
      providesTags: ["Community"],
    }),

    getCommunityById: builder.query<Community, number>({
      query: (id) => ({
        url: `/communities/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: "Community", id }],
    }),

    createCommunity: builder.mutation<{ community_id: number }, FormData>({
      query: (data) => ({
        url: "/communities",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Community"],
    }),

    updateCommunity: builder.mutation<void, { id: number; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/communities/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Community"],
    }),

    deleteCommunity: builder.mutation<void, number>({
      query: (id) => ({
        url: `/communities/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Community"],
    }),

    joinCommunity: builder.mutation<void, number>({
      query: (id) => ({
        url: `/communities/${id}/join`,
        method: "POST",
      }),
      invalidatesTags: ["Community", "User"],
    }),

    leaveCommunity: builder.mutation<void, number>({
      query: (id) => ({
        url: `/communities/${id}/join`,
        method: "DELETE",
      }),
      invalidatesTags: ["Community", "User"],
    }),

    getCommunityMembers: builder.query<CommunityMember[], number>({
      query: (id) => ({
        url: `/communities/${id}/members`,
      }),
      providesTags: ["Community"],
    }),

    getCommunityPosts: builder.query<
      CommunitiesResponse,
      { page?: number; page_size?: number; id: number }
    >({
      query: ({ page = 1, page_size = 10, id }) => ({
        url: `/community-posts/${id}`,
        params: { page, page_size },
      }),
      providesTags: ["Post"],
    }),

    getUserCommunities: builder.query<Community[], { id: number }>({
      query: ({ id }) => ({
        url: `/communities/${id}/user`,
      }),
      providesTags: ["Community"],
    }),
  }),
});

export const {
  useGetAllCommunitiesQuery,
  useGetCommunityByIdQuery,
  useCreateCommunityMutation,
  useUpdateCommunityMutation,
  useDeleteCommunityMutation,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  useGetCommunityMembersQuery,
  useGetCommunityPostsQuery,
  useGetUserCommunitiesQuery,
} = communityApi;
