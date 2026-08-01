"use client";

import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { SideBarNavMain, SidebarNavSection } from "@/constants/dashboard-sidebar-links";
import Link from "next/link";
import { USER_ROLES } from "@/modules/users/constants";
import { authClient } from "@/lib/auth-client";

export function NavMain() {
  const items = SideBarNavMain;

  const currentSessionData = authClient.useSession();
  const isUserPlatformAdmin = currentSessionData.data?.user.role === USER_ROLES.ADMIN;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
         {SideBarNavMain
        .filter((item) => {
          // Always show non-admin items
          if (!item.isAdminOnly) {
            return true;
          }

          // Hide admin items while loading
          if (currentSessionData.isPending || currentSessionData.isRefetching) {
            return false;
          }

          // Show admin items only to admins
          return isUserPlatformAdmin;
        })
        .map((item) => (
          <NavMainItems key={item.title} items={[item]} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavMainItems({items}: {items:  SidebarNavSection[]}) {
  return (
    <>
      {items.map((item) =>
        item.url ? (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                {" "}
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ),
      )}
    </>
  );
}
