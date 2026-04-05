export interface Comment {
  id: number;
  author: string;
  body: string;
  user_id: number;
  post_id: number;
  total_records: number;
  comment_vote_count: number;
  reply_count: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CommentsResponse {
  Comments: Comment[];
  MetaData: CommentMetaData;
  Next: string;
  Prev: string;
}

export interface CommentMetaData {
  current_page: number;
  page_size: number;
  next_page: number;
  prev_page: number;
  first_page: number;
  last_page: number;
  total_records: number;
}

export interface CommentsParams {
  postId: number;
  page?: number;
  page_size?: number;
  query?: string;
  order_by?: string;
}

export interface CreateCommentRequest {
  body: string;
  parent_id?: number | null;
}

export interface UpdateCommentRequest {
  body: string;
}
