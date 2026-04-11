export interface User {
  id: number;
  username: string;
  email: string;
  profile?: Profile;
  createdAt?: string;
}

export interface UserCommunity {
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
  role: string;
  joined_at: string;
}

export interface Profile {
  userId: number;
  bio: string;
  karma: string;
  avatar_url: string;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  user_id: number;
  email: string;
  username: string;
  access_token: string;
}

export interface UserProfileResponse {
  user: User;
  communities: UserCommunity[];
}
