"use client";

import Link from "next/link";
import {
  BellIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AccountSwitcher from "../auth/account-switch";
import React from "react";
import { Skeleton } from "../ui/skeleton";

export function NavUser() {
  // const [isLoading, setLoading] = useState(false);
  // const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();
  const { isMobile } = useSidebar();

  const currentSessionData = authClient.useSession();
  const currentSession = currentSessionData.data

  // functions
  async function handleSignOut() {
    // setLoading(true);
    toast.loading("Signing out...", { id: "signout", description: null });
    const { error } = await authClient.signOut();
    if (error) {
      toast.error("Didn't signed out", {
        id: "signout",
        description: error.message || "Something went wrong",
      });
    } else {
      toast.success("Signed out successfully", {
        id: "signout",
        description: "Redirecting...",
      });
      // setLoading(false);
      router.push("/");
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {currentSession  ? (
                <>
                  <Avatar className="h-8 w-8 rounded-lg  ">
                    <AvatarImage
                      src={
                        currentSession?.user.image
                          ? currentSession?.user.image
                          : undefined
                      }
                      alt={currentSession.user.name}
                    />
                    <AvatarFallback className="rounded-lg">User</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {currentSession.user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground ">
                      {currentSession.user.email}
                    </span>
                  </div>
                  <MoreVerticalIcon className="ml-auto size-4" />
                </>
              ) : (
                <Skeleton className="w-full h-9" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel>
              {(currentSession && !currentSessionData.isPending)? (
                <AccountSwitcher
                  currentSessionData={currentSession}
                  // sessions={sessions}
                  // isLoading={loading}
                  // setLoading={setLoading}
                  className="w-full"
                />
              ) : (
                <Skeleton className="w-full h-9" />
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={"/user/account"}>
                  <UserCircleIcon />
                  <span>Account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={"/user/notifications"}>
                  <BellIcon />
                  <span>Notifications</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              {/* <Link href={"/logout"}>
                <LogOutIcon />
                <span> Log out</span>
              </Link> */}
              <button className="w-full" onClick={handleSignOut}>
                <LogOutIcon />
                <span> Sign out</span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
