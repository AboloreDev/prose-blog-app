import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { mainLinks, type SidebarLink } from "@/constants/sidebar";

export function NavMain() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const isActive = (url: string) => location.pathname === url;

  const isParentActive = (item: SidebarLink) => {
    if (isActive(item.url)) return true;
    if (item.children) {
      return item.children.some((child) => isActive(child.url));
    }
    return false;
  };

  const toggleOpen = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const isOpen = (title: string) => openItems.includes(title);

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-4 mt-10">
          {mainLinks.map((item) => (
            <SidebarMenuItem key={item.title} className="">
              <SidebarMenuButton
                onClick={() => {
                  if (item.children) {
                    toggleOpen(item.title);
                  } else {
                    navigate(item.url);
                  }
                }}
                className={`
                 flex items-center justify-between cursor-pointer text-white font-bold
                  ${
                    isParentActive(item)
                      ? "bg-white text-orange-500  rounded-full py-4 font-medium hover:bg-white/50"
                      : "hover:bg-white/50 rounded-full py-4"
                  }
              `}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </div>
                {item.children &&
                  (isOpen(item.title) ? (
                    <ChevronDownIcon className="size-4" />
                  ) : (
                    <ChevronRightIcon className="size-4" />
                  ))}
              </SidebarMenuButton>

              {item.children && isOpen(item.title) && (
                <SidebarMenuSub>
                  {item.children.map((child) => (
                    <SidebarMenuSubItem key={child.title}>
                      <SidebarMenuSubButton
                        onClick={() => navigate(child.url)}
                        className={`text-white 
                            ${
                              isActive(child.url)
                                ? "bg-white text-orange-500 font-medium  hover:bg-white/50"
                                : " hover:bg-white/50"
                            }
                        `}
                      >
                        <span>{child.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
