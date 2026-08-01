import {
  AudioWaveform,
  GalleryVerticalEnd,
  Command,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  Trophy,
} from "lucide-react";
import type { ComponentType } from "react";

type SidebarIcon = ComponentType<any>;

export interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
}

export interface SidebarTeam {
  name: string;
  logo: SidebarIcon;
  plan: string;
}

export interface SidebarNavItem {
  title: string;
  url: string;
}

export interface SidebarNavSection {
  title: string;
  url?: string; // if no url, then it is a collapsible section with items
  icon: SidebarIcon;
  isActive?: boolean;
  isAdminOnly?: boolean;
  items?: SidebarNavItem[];
}

export interface SidebarDocument {
  name: string;
  url: string;
  icon: SidebarIcon;
}

export interface SidebarData {
  user: SidebarUser;

  teams?: SidebarTeam[];

  navMain: SidebarNavSection[];

  // Optional for sidebars that don't use them.
  navClouds?: SidebarNavSection[];

  navSecondary?: SidebarNavSection[];

  documents?: SidebarDocument[];
}

export const sidebarData: SidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],

  navMain: [
    {
      title: "Competitions",
      url: "/competitions",
      icon: Trophy,
      isActive: true,
    },

    // {
    //   title: "User",
    //   // url: "/dashboard/user",
    //   icon: Bot,
    //   items: [
    //     {
    //       title: "Profile",
    //       url: "/dashboard/user/profile",
    //     },
    //     {
    //       title: "Account",
    //       url: "/dashboard/user/account",
    //     },
    //     {
    //       title: "2FA",
    //       url: "/dashboard/user/account/2fa",
    //     },
    //   ],
    // },
  ],

  // navClouds: [],
  // navSecondary: [],
  // documents: [],
};

export const SideBarNavMain: SidebarNavSection[] = [
  // main navigation items for the sidebar
  {
    title: "Competitions",
    url: "/competitions",
    icon: Trophy,
    isActive: true,
  },
  {
    title: "Admin",
    // url: "#",
    icon: UsersIcon,
    isAdminOnly: true,
    items: [
      {
        title: "All Competitions",
        url: "/admin/competitions",
      },
       {
        title: "New Competition",
        url: "/admin/competitions/new",
      },
    ],
  },
];
export const dashboardSidebarLinks: SidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Login",
      url: "/login",
      icon: ListIcon,
    },
    {
      title: "Temp",
      url: "/temp",
      icon: BarChartIcon,
    },
    {
      title: "css-variables",
      url: "/temp/css-variables",
      icon: FolderIcon,
    },
    {
      title: "Flashcards",
      url: "/dashboard/temp",
      icon: UsersIcon,
    },
  ],

  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],

  navSecondary: [
    // {
    //   title: "Settings",
    //   url: "/settings",
    //   icon: SettingsIcon,
    // },
    // {
    //   title: "Get Help",
    //   url: "/help",
    //   icon: HelpCircleIcon,
    // },
    // {
    //   title: "Upgrade Plan",
    //   url: "/dashboard/user/upgrade-plan",
    //   icon: SearchIcon,
    // },
  ],

  documents: [
    {
      name: "Data Library",
      url: "/data-library",
      icon: DatabaseIcon,
    },
    {
      name: "Reports",
      url: "/reports",
      icon: ClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "/word-assistant",
      icon: FileIcon,
    },
  ],
};
