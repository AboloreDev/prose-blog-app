// state/slice/notificationsSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Notification } from "@/state/types/notificationTypes";

interface NotificationsState {
  isSheetOpen: boolean;
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  isSheetOpen: false,
  notifications: [],
  unreadCount: 0,
};

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotificationsSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.isSheetOpen = action.payload;
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.is_read).length;
    },
    markAllRead: (state) => {
      state.notifications = state.notifications.map((n) => ({
        ...n,
        is_read: true,
      }));
      state.unreadCount = 0;
    },
    markOneRead: (state, action: PayloadAction<number>) => {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n) n.is_read = true;
      state.unreadCount = state.notifications.filter((n) => !n.is_read).length;
    },
  },
});

export const {
  setNotificationsSheetOpen,
  setNotifications,
  markAllRead,
  markOneRead,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
