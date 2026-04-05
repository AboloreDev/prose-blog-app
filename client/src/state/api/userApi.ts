import { baseApi } from "./baseApi";
import type { UserProfileResponse } from "../types/authTypes";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfileResponse, { id: number }>({
      query: ({ id }) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
    }),

    updateUserProfile: builder.mutation<UserProfileResponse, FormData>({
      query: (formData) => ({
        url: "/users",
        method: "PATCH",
        body: formData,
      }),
    }),

    deleteUserAccount: builder.mutation<void, void>({
      query: () => ({
        url: "/users",
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useDeleteUserAccountMutation,
  useUpdateUserProfileMutation,
} = userApi;
