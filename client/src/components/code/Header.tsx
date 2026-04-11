import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Loader2, LogOut, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useAppDispatch, useAppSelector, type RootState } from "@/state/redux";
import { useLogoutUserMutation } from "@/state/api/authAp";
import { logoutUser } from "@/state/slice/authSlice";
import SearchBar from "./Searchbar";
import { useGetUserProfileQuery } from "@/state/api/userApi";
import { setNotificationsSheetOpen } from "@/state/slice/notificationsSlice";
import NotificationsSheet from "./NotificationsSheet";

interface HeaderProps {
  title: string;
  subTitle?: string;
}

const Header = ({ title, subTitle }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { data: userProfile } = useGetUserProfileQuery({ id: user?.id ?? 0 });
  const location = useLocation();

  const searchConfig: Record<string, string> = {
    "/dashboard/feeds": "Search posts...",
    "/dashboard/communities": "Search communities...",
    "/dashboard/profile": "Search your posts...",
  };

  const searchPlaceholder = searchConfig[location.pathname];
  const showSearch = !!searchPlaceholder;
  const [logout, { isLoading: isLoggingOut }] = useLogoutUserMutation();
  const unreadCount = useAppSelector(
    (state: RootState) => state.notification.unreadCount,
  );

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  const handleLogoutConfirm = async () => {
    try {
      await logout(undefined).unwrap();
    } finally {
      dispatch(logoutUser());
      navigate("/auth/login");
    }
  };

  const handleProfileNavigation = () => {
    if (user?.id) {
      navigate(`/dashboard/profile/${user.id}`);
    }
  };

  return (
    <div className="lato-regular">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3 ">
        <div className="flex items-center justify-between gap-4">
          {/* Left — trigger + title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <SidebarTrigger className="shrink-0 xl:hidden lg:block" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate leading-tight">
                {title}
              </h2>
              {subTitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {subTitle}
                </p>
              )}
            </div>
          </div>

          {/* Desktop search */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-sm mx-4">
              <SearchBar placeholder={searchPlaceholder} />
            </div>
          )}

          {/* Mobile search */}
          {showSearch && (
            <div className="md:hidden pt-2">
              <SearchBar placeholder={searchPlaceholder} />
            </div>
          )}

          {/* Right — bell + avatar */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full bg-white hover:bg-white/20"
              onClick={() => dispatch(setNotificationsSheetOpen(true))}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Avatar dropdown */}
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger className={"flex items-center gap-1"}>
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={userProfile?.user?.profile?.avatar_url}
                    alt={user?.username}
                  />
                  <AvatarFallback className="text-xs bg-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block ${open ? "rotate-180" : ""}`}
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 bg-white rounded-md shadow-lg lato-regular"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={handleProfileNavigation}
                >
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-red-600 cursor-pointer focus:text-red-600"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Logout dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="md:max-w-2xl! w-full! bg-orange-200 lato-regular !border-0!">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of Prose?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLoggingOut}
              className="bg-white border-0 rounded-full"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full"
            >
              {isLoggingOut ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging out...
                </span>
              ) : (
                "Log out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NotificationsSheet />
    </div>
  );
};

export default Header;
