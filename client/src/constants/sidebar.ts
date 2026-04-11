import {
  HomeIcon,
  UsersIcon,
  UserIcon,
  TrendingUpIcon,
  FileTextIcon,
  HelpCircleIcon,
} from "lucide-react";

export type SidebarLink = {
  title: string;
  url: string;
  icon: any;
  children?: { title: string; url: string }[];
};

export const mainLinks: SidebarLink[] = [
  {
    title: "Home",
    url: "/dashboard/feeds",
    icon: HomeIcon,
  },
  {
    title: "Popular",
    url: "/dashboard/popular",
    icon: TrendingUpIcon,
  },
  {
    title: "Communities",
    url: "/dashboard/communities",
    icon: UsersIcon,
    children: [
      { title: "Browse All", url: "/dashboard/communities/all" },
      { title: "Create Community", url: "/dashboard/communities/create" },
    ],
  },
  {
    title: "My Posts",
    url: "/dashboard/posts",
    icon: FileTextIcon,
    children: [
      { title: "Published", url: "/dashboard/posts/published" },
      { title: "Drafts", url: "/dashboard/posts/drafts" },
      { title: "Scheduled", url: "/dashboard/posts/scheduled" },
    ],
  },

  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: UserIcon,
  },
];

export const secondaryLinks: SidebarLink[] = [
  {
    title: "Help",
    url: "/dashboard/help",
    icon: HelpCircleIcon,
  },
];
