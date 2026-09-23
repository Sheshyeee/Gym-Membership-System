import { AppContent } from "@/components/app-content";
import { AppShell } from "@/components/app-shell";
import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarHeader } from "@/components/app-sidebar-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import type { AppLayoutProps } from "@/types";

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="min-h-0 flex-1 overflow-x-clip overflow-y-auto pb-28 md:pb-0">
                    {children}
                </div>
            </AppContent>
            <MobileBottomNav />
        </AppShell>
    );
}
