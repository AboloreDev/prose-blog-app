import {
  HomeIcon,
  UsersIcon,
  BellIcon,
  UserIcon,
  TrendingUpIcon,
  SettingsIcon,
  FileTextIcon,
  CalendarIcon,
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
      { title: "Published", url: "/dashboard/posts" },
      { title: "Drafts", url: "/dashboard/posts/drafts" },
      { title: "Scheduled", url: "/dashboard/posts/scheduled" },
    ],
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: BellIcon,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: UserIcon,
  },
];

export const secondaryLinks: SidebarLink[] = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: SettingsIcon,
  },
  {
    title: "Help",
    url: "/dashboard/help",
    icon: HelpCircleIcon,
  },
];
