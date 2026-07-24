// unused

"use client"
import React from "react";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { ThemeModeToggle } from "../ui/themeModeToggle";

import { dashboardSidebarLinks } from "@/constants/dashboard-sidebar-links";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();
      const pageTitle =
        dashboardSidebarLinks.navMain.find((item) => item.url === pathname)?.title ||
        "Dashboard";
    

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* dynamic header */}
        <h1 className="text-base font-medium">{pageTitle}</h1>
      </div>
      <ThemeModeToggle />
    </header>
  );
}
