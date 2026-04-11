export interface Post {
  id: number;
  user_id: number;
  community_id: number;
  title: string;
  body: string;
  author: string;
  community_name: string;
  comment_count: number;
  publish_at: string;
  image_url: string;
  votes_count: number;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  total_records: number;
}

export interface PostsResponse {
  Posts: Post[];
  MetaData: MetaData;
  Next: string;
  Prev: string;
}

export interface MetaData {
  current_page: number;
  page_size: number;
  next_page: number;
  prev_page: number;
  first_page: number;
  last_page: number;
  total_records: number;
}

export interface PostsParams {
  user_id?: number;
  page?: number;
  page_size?: number;
  query?: string;
  order_by?: string;
}
