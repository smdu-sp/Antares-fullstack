/** @format */

import Breadcrumbs from "@/components/breadcrumbs";
import { DrawerMenu } from "@/components/drawer-menu";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { GrupoAtivoLoadingProvider } from "@/components/sidebar/grupo-ativo-loading-context";
import { GrupoAtivoLoadingOverlay } from "@/components/sidebar/grupo-ativo-loading-overlay";
import { ModeToggle } from "@/components/toggle-theme";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function RotasAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <GrupoAtivoLoadingProvider>
      <div className="relative w-full overflow-x-hidden">
        <ModeToggle className="absolute top-4 right-4 z-50" />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-w-0">
            <header className="h-16 bg-muted/50 dark:bg-background shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 hidden sm:flex">
              <div className="flex items-center gap-2 px-3 sm:px-4">
                <SidebarTrigger className="-ml-1 md:hidden" />
                <Separator
                  orientation="vertical"
                  className="mr-2 h-4 md:ml-[-16px]"
                />
                <Breadcrumbs />
              </div>
            </header>
            <div className="h-full gap-1 sm:gap-4 p-1.5 sm:p-4 sm:pt-0 items-center w-full min-w-0 bg-muted/50 dark:bg-background pt-10 overflow-x-hidden">
              {children}
            </div>
          </SidebarInset>
          <DrawerMenu />
        </SidebarProvider>
        <GrupoAtivoLoadingOverlay />
      </div>
    </GrupoAtivoLoadingProvider>
  );
}
