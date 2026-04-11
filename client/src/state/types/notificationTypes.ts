export interface Notification {
  id: number;
  user_id: number;
  actor_id: number;
  post_id: number | null;
  comment_id: number | null;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  receiver: string;
  sender: string;
}

export interface NotificationsResponse {
  data: Notification[];
}
