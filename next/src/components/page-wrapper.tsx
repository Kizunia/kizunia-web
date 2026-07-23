import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "./ui/sidebar";
import { Fragment } from "react";
import { Separator } from "./ui/separator";
import { ThemeModeToggle } from "./ui/themeModeToggle";

interface PageWrapperProps {
  children: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href: string;
  }[];
}

export default function PageWrapper({
  children,
  breadcrumbs,
}: PageWrapperProps) {
  return (
    // <div className="flex flex-col gap-1">
    <>
      <header className="bg-background flex items-center p-2 sticky top-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">

            <SidebarTrigger />

            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />

            <Breadcrumb>
              <BreadcrumbList>
                {!!breadcrumbs && breadcrumbs.map((breadcrumb, index) => (
                  <Fragment key={breadcrumb.label}>
                    <BreadcrumbItem>
                      <BreadcrumbLink href={breadcrumb.href}>
                        {breadcrumb.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {index !== breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator />
                    )}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>


          </div>

          <div className="flex items-center gap-4">
            <ThemeModeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4   ">{children}</div>
    {/* </div> */}
    </>
  );
}
