import { baseApi } from "./baseApi";
import type { UserProfileResponse } from "../types/authTypes";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfileResponse, { id: number }>({
      query: ({ id }) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    deleteUserAccount: builder.mutation<void, void>({
      query: () => ({
        url: "/users",
        method: "DELETE",
      }),
    }),
  }),
});

export const { useGetUserProfileQuery, useDeleteUserAccountMutation } = userApi;
