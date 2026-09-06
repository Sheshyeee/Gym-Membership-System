import { Link, usePage } from "@inertiajs/react";
import { BookOpen, FolderGit2, LayoutGrid } from "lucide-react";
import AppLogo from "@/components/app-logo";
import { NavFooter } from "@/components/nav-footer";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { dashboard } from "@/routes";
import type { NavItem } from "@/types";
import type { SharedData } from "@/types/auth";

const footerNavItems: NavItem[] = [
    {
        title: "Repository",
        href: "https://github.com/laravel/react-starter-kit",
        icon: FolderGit2,
    },
    {
        title: "Documentation",
        href: "https://laravel.com/docs/starter-kits#react",
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.roles.includes("admin");
    const isUser = auth.roles.includes("user");
    const isStaff = auth.roles.includes("staff");

    const mainNavItems: NavItem[] = [
        ...(isAdmin
            ? [
                  {
                      title: "Overview",
                      href: "/overview",
                      icon: LayoutGrid,
                  } satisfies NavItem,
                  {
                      title: "Members",
                      href: "/members",
                      icon: LayoutGrid,
                  } satisfies NavItem,
                  {
                      title: "Staffs",
                      href: "/staffs",
                      icon: LayoutGrid,
                  } satisfies NavItem,
              ]
            : []),
        ...(isStaff
            ? [
                  {
                      title: "Dashboard",
                      href: "/staff/dashboard",
                      icon: LayoutGrid,
                  } satisfies NavItem,
                  {
                      title: "Members",
                      href: "/staff/members",
                      icon: LayoutGrid,
                  } satisfies NavItem,
              ]
            : []),
        ...(isUser
            ? [
                  {
                      title: "Home",
                      href: "/dashbaord",
                      icon: LayoutGrid,
                  } satisfies NavItem,
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
