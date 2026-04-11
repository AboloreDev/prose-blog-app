import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../redux";
import { logoutUser, setAccessToken } from "../slice/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.access_token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  //  @ts-expect-error "<>"
  if (result.error?.status === 401 || result.error?.originalStatus === 401) {
    console.log("401 triggered by:", args);

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = rawBaseQuery(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions,
        //  @ts-expect-error "<>"
      ).finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshResult = await refreshPromise;

    if (refreshResult?.data) {
      const { access_token } = refreshResult.data as { access_token: string };
      api.dispatch(setAccessToken(access_token));

      const retryArgs =
        typeof args === "string"
          ? { url: args, headers: { authorization: `Bearer ${access_token}` } }
          : {
              ...args,
              headers: {
                ...(args.headers ?? {}),
                authorization: `Bearer ${access_token}`,
              },
            };

      result = await rawBaseQuery(retryArgs, api, extraOptions);
    } else {
      api.dispatch(logoutUser());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Post", "User", "Community", "Comment", "Notification"],
  endpoints: () => ({}),
});
