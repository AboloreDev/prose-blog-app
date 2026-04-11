import type { UserCommunity } from "./authTypes";

export interface Profile {
  user_id: number;
  bio: string;
  karma: string;
  avatar_url: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  created_at: string;
  profile: Profile;
}

export interface UserProfileResponse {
  user: UserProfile;
  communities: UserCommunity[];
}

export interface FollowCount {
  followerCount: number;
  followingCount: number;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UpdateProfileSchema {
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
}
