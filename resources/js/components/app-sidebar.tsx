import { Link, usePage } from "@inertiajs/react";
import {
    BarChart3,
    BookOpen,
    CalendarCheck,
    ClipboardCheck,
    ClipboardList,
    FolderGit2,
    Home,
    LayoutGrid,
    QrCode,
    Settings,
    Ticket,
    UserCog,
    Users,
    Wallet,
} from "lucide-react";
import AppLogo from "@/components/app-logo";
import { NavFooter } from "@/components/nav-footer";
import { NavMain, type NavGroup } from "@/components/nav-main";
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

    const mainNavGroups: NavGroup[] = [
        ...(isAdmin
            ? ([
                  {
                      title: "Overview",
                      items: [
                          {
                              title: "Overview",
                              href: "/overview",
                              icon: LayoutGrid,
                          },
                      ],
                  },
                  {
                      title: "People",
                      items: [
                          { title: "Members", href: "/members", icon: Users },
                          { title: "Staffs", href: "/staffs", icon: UserCog },
                      ],
                  },
                  {
                      title: "Operations",
                      items: [
                          {
                              title: "Attendance",
                              href: "/attendance",
                              icon: CalendarCheck,
                          },
                      ],
                  },
                  {
                      title: "Finance",
                      items: [
                          {
                              title: "Payments",
                              href: "/payments",
                              icon: Wallet,
                          },
                          {
                              title: "Revenue Analytics",
                              href: "/revenue-analytics",
                              icon: BarChart3,
                          },
                          {
                              title: "Membership Plans",
                              href: "/admin/plans",
                              icon: ClipboardList,
                          },
                      ],
                  },
                  {
                      title: "System",
                      items: [
                          {
                              title: "Settings",
                              href: "/admin/settings",
                              icon: Settings,
                          },
                      ],
                  },
              ] satisfies NavGroup[])
            : []),
        ...(isStaff
            ? ([
                  {
                      title: "Overview",
                      items: [
                          {
                              title: "Dashboard",
                              href: "/staff/dashboard",
                              icon: LayoutGrid,
                          },
                      ],
                  },
                  {
                      title: "Members",
                      items: [
                          {
                              title: "Members",
                              href: "/staff/members",
                              icon: Users,
                          },
                      ],
                  },
                  {
                      title: "Check-In",
                      items: [
                          {
                              title: "QR Check-In",
                              href: "/staff/qr-checkin",
                              icon: QrCode,
                          },
                          {
                              title: "Manual check-In",
                              href: "/staff/manual-checkin",
                              icon: ClipboardCheck,
                          },
                          {
                              title: "Attendance",
                              href: "/staff/attendance",
                              icon: CalendarCheck,
                          },
                      ],
                  },
                  {
                      title: "Finance",
                      items: [
                          {
                              title: "Payments",
                              href: "/staff/payments",
                              icon: Wallet,
                          },
                      ],
                  },
                  {
                      title: "Account",
                      items: [
                          {
                              title: "Profile & Settings",
                              href: "/member/profile",
                              icon: UserCog,
                          },
                      ],
                  },
              ] satisfies NavGroup[])
            : []),
        ...(isUser
            ? ([
                  {
                      title: "Overview",
                      items: [
                          { title: "Home", href: "/dashboard", icon: Home },
                      ],
                  },
                  {
                      title: "Your Fitness",
                      items: [
                          {
                              title: "QR Access",
                              href: "/qraccess",
                              icon: QrCode,
                          },
                          {
                              title: "Membership",
                              href: "/member/membership",
                              icon: Ticket,
                          },
                      ],
                  },
                  {
                      title: "Account",
                      items: [
                          {
                              title: "Payments",
                              href: "/member/payments",
                              icon: Wallet,
                          },
                          {
                              title: "Profile & Settings",
                              href: "/member/profile",
                              icon: UserCog,
                          },
                      ],
                  },
              ] satisfies NavGroup[])
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
                <NavMain groups={mainNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
