import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useGetUserProfileQuery } from "@/state/api/userApi";
import { useAppDispatch, useAppSelector, type RootState } from "@/state/redux";
import { setJoinedCommunities } from "@/state/slice/authSlice";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);
  const { data } = useGetUserProfileQuery({ id: user?.id ?? 0 });

  useEffect(() => {
    if (data?.communities) {
      const ids = data.communities.map((c) => c.id);
      dispatch(setJoinedCommunities(ids));
    }
  }, [data, dispatch]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 lato-regular">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
