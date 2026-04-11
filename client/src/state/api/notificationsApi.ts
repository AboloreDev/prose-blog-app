// state/api/notificationsApi.ts
import { baseApi } from "./baseApi";
import type {
  Notification,
  NotificationsResponse,
} from "@/state/types/notificationTypes";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserNotifications: builder.query<NotificationsResponse, void>({
      query: () => ({ url: "/notifications/all" }),
      providesTags: ["Notification"],
    }),

    getNotificationById: builder.query<Notification, number>({
      query: (id) => ({ url: `/notifications/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "Notification", id }],
    }),

    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/notifications/all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetUserNotificationsQuery,
  useGetNotificationByIdQuery,
  useMarkAllAsReadMutation,
} = notificationsApi;
