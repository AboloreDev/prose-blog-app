import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import type { RootState } from "@/state/redux";
import {
  setNotificationsSheetOpen,
  setNotifications,
  markAllRead,
  markOneRead,
} from "@/state/slice/notificationsSlice";
import {
  useGetUserNotificationsQuery,
  useMarkAllAsReadMutation,
  useGetNotificationByIdQuery,
} from "@/state/api/notificationsApi";
import type { Notification } from "@/state/types/notificationTypes";

const NotificationsSheet = () => {
  const dispatch = useAppDispatch();
  const { isSheetOpen, notifications, unreadCount } = useAppSelector(
    (state: RootState) => state.notification,
  );

  const { data, isLoading } = useGetUserNotificationsQuery();
  const [markAllAsRead, { isLoading: isMarking }] = useMarkAllAsReadMutation();

  useEffect(() => {
    if (data) {
      //  @ts-expect-error "<>"
      dispatch(setNotifications(data));
    }
  }, [data, dispatch]);

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
      dispatch(markAllRead());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Sheet
      open={isSheetOpen}
      onOpenChange={(open) => dispatch(setNotificationsSheetOpen(open))}
    >
      <SheetContent className="!w-full md:max-w-2xl! flex flex-col p-0 bg-orange-100">
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 px-5 py-4 border-b flex flex-row items-center justify-between">
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-black text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <Bell className="h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">You're all caught up 🎉</p>
            </div>
          )}

          {!isLoading &&
            notifications.map((notification: any) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="sticky bottom-0  border-t px-5 py-3">
            <button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
              onClick={handleMarkAll}
              disabled={isMarking || unreadCount === 0}
            >
              {isMarking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all as read
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// Notification Item
const NotificationItem = ({ notification }: { notification: Notification }) => {
  const dispatch = useAppDispatch();
  const { data } = useGetNotificationByIdQuery(notification.id);

  const handleClick = () => {
    if (!notification.is_read) {
      // @ts-expect-error "<>"
      dispatch(markOneRead(data?.id));
    }
  };

  const timeAgo = data?.created_at
    ? formatDistanceToNow(new Date(data.created_at), {
        addSuffix: true,
      })
    : "";

  const typeIcon: Record<string, string> = {
    post_upvote: "👍",
    post_downvote: "👎",
    comment_upvote: "👍",
    comment_downvote: "👎",
    new_comment: "💬",
    new_reply: "↩️",
    new_follower: "👤",
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex gap-4 px-5 py-4 transition-all cursor-pointer border-b 
        hover:bg-gray-50 active:scale-[0.99]
        ${!notification.is_read ? "bg-orange-50/60" : ""}
      `}
    >
      {/* Icon */}
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-lg">
        {/*  @ts-expect-error "<>" */}
        {typeIcon[data?.notification_type] ?? "🔔"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">{data?.message}</p>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">{timeAgo}</span>

          {!notification.is_read && (
            <span className="h-2 w-2 rounded-full bg-orange-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsSheet;
