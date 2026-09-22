import { Link, usePage } from "@inertiajs/react";
import {
    LayoutGrid,
    Users,
    Wallet,
    BarChart3,
    QrCode,
    CalendarCheck,
    MoreHorizontal,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { SharedData } from "@/types/auth";

type MobileNavItem = {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

export function MobileBottomNav() {
    const { auth } = usePage<SharedData>().props;
    const { url } = usePage();
    const { toggleSidebar } = useSidebar();

    const isAdmin = auth.roles.includes("admin");
    const isStaff = auth.roles.includes("staff");

    let items: MobileNavItem[] = [];

    if (isAdmin) {
        items = [
            { title: "Overview", href: "/overview", icon: LayoutGrid },
            { title: "Members", href: "/members", icon: Users },
            { title: "Payments", href: "/payments", icon: Wallet },
            { title: "Analytics", href: "/revenue-analytics", icon: BarChart3 },
        ];
    } else if (isStaff) {
        items = [
            { title: "Dashboard", href: "/staff/dashboard", icon: LayoutGrid },
            { title: "Members", href: "/staff/members", icon: Users },
            { title: "Check-In", href: "/staff/qr-checkin", icon: QrCode },
            { title: "Attendance", href: "/staff/attendance", icon: CalendarCheck },
        ];
    } else {
        items = [
            { title: "Home", href: "/dashboard", icon: LayoutGrid },
            { title: "QR Access", href: "/qraccess", icon: QrCode },
            { title: "Membership", href: "/member/membership", icon: CalendarCheck },
            { title: "Payments", href: "/member/payments", icon: Wallet },
        ];
    }

    return (
        <nav
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 flex items-center justify-around",
                "border-t border-sidebar-border bg-sidebar/95 backdrop-blur",
                "px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]",
                "md:hidden",
            )}
        >
            {items.map((item) => {
                const isActive = url.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium"
                    >
                        <item.icon
                            className={cn(
                                "h-5 w-5",
                                isActive ? "text-primary" : "text-muted-foreground",
                            )}
                        />
                        <span
                            className={cn(
                                isActive ? "text-primary" : "text-muted-foreground",
                            )}
                        >
                            {item.title}
                        </span>
                    </Link>
                );
            })}

            <button
                onClick={toggleSidebar}
                className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium text-muted-foreground"
            >
                <MoreHorizontal className="h-5 w-5" />
                <span>More</span>
            </button>
        </nav>
    );
}