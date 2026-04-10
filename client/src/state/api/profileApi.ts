// state/api/profileApi.ts
import { baseApi } from "./baseApi";
import type {
  UserProfileResponse,
  FollowCount,
  UpdateProfileRequest,
  UserProfile,
} from "@/state/types/profileTypes";

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfileResponse, { id: number }>({
      query: (id) => ({ url: `/users/${id}` }),
      providesTags: ["User"],
    }),

    updateProfile: builder.mutation<
      UserProfile,
      { data: UpdateProfileRequest }
    >({
      query: ({ data }) => ({
        url: `/users`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    getFollowCount: builder.query<FollowCount, number>({
      query: (id) => ({ url: `/users/${id}/followcount` }),
      providesTags: ["User"],
    }),

    getFollowers: builder.query<any[], number>({
      query: (id) => ({ url: `/users/${id}/followers` }),
      providesTags: ["User"],
    }),

    getFollowing: builder.query<any[], number>({
      query: (id) => ({ url: `/users/${id}/following` }),
      providesTags: ["User"],
    }),

    followUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/${id}/follow`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    unfollowUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/${id}/follow`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    isFollowing: builder.query<{ isFollowing: boolean }, { id: number }>({
      query: ({ id }) => ({ url: `/users/${id}/isfollowing` }),
      providesTags: ["User"],
    }),

    getAvatars: builder.query({
      query: () => ({ url: `/avatars` }),
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useGetFollowCountQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useIsFollowingQuery,
  useGetAvatarsQuery,
} = profileApi;
