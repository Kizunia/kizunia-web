"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface ProjectEditorNavigationProps {
  projectId: string;
}

const tabs = [
  {
    label: "Overview",
    segment: "",
  },
  {
    label: "Content",
    segment: "content",
  },
  {
    label: "Links",
    segment: "links",
  },
  {
    label: "Technologies",
    segment: "technologies",
  },
  {
    label: "Categories",
    segment: "categories",
  },
  {
    label: "Team",
    segment: "team",
  },
  {
    label: "Testimonials",
    segment: "testimonials",
  },
] as const;

export function ProjectEditorNavigation({
  projectId,
}: ProjectEditorNavigationProps) {
  const pathname = usePathname();

  const basePath = `/projects/${projectId}/edit`;

  return (
    <nav className="border-b" >
      <div className="flex items-center gap-1 overflow-x-auto max-w-xs sm:max-w-sm md:max-w-fit">
        {tabs.map((tab) => {
          const href = tab.segment
            ? `${basePath}/${tab.segment}`
            : basePath;

          const isActive = tab.segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === basePath;

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "relative whitespace-nowrap px-4 py-3 text-sm font-medium text-muted-foreground transition-colors",
                "hover:text-foreground",
                isActive && "text-foreground",
                isActive &&
                  "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}