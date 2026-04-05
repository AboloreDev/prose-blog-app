import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      className="bg-[#E86B00] lato-regular"
    >
      <SidebarHeader className="bg-[#E86B00] ">
        <SidebarMenu>
          <SidebarMenuItem className="bg-[#E86B00]">
            <SidebarMenuButton className="p-1.5">
              <img
                src="/logo.png"
                alt="Prose Logo"
                className="size-10 rounded-md object-cover"
              />
              <span className="text-2xl font-bold text-white">Prose</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex-1 flex flex-col bg-[#E86B00]">
        <NavMain />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
