export interface Community {
  id: number;
  name: string;
  slug: string;
  description: string;
  banner_url: string;
  created_at: string;
  member_count: number;
  created_by: number;
  community_creator: string;
  total_records: number;
}

export interface CommunitiesResponse {
  Communities: Community[];
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

export interface CommunitiesParams {
  page?: number;
  page_size?: number;
  query?: string;
  order_by?: string;
}

export interface CreateCommunityRequest {
  name: string;
  slug: string;
  description: string;
  image?: File;
}

export interface UpdateCommunityRequest {
  name?: string;
  slug?: string;
  description?: string;
  image?: File;
}

export interface CommunityMember {
  user_id: number;
  community_id: number;
  role: string;
  joined_at: string;
  name: string;
  community_name: string;
}
