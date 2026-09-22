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
            { title: "Dashboard", href: "/overview", icon: LayoutGrid },
            { title: "Members", href: "/members", icon: Users },
            { title: "Check-In", href: "/attendance", icon: QrCode },
            { title: "Attendance", href: "/attendance", icon: CalendarCheck },
        ];
    } else if (isStaff) {
        items = [
            { title: "Dashboard", href: "/staff/dashboard", icon: LayoutGrid },
            { title: "Members", href: "/staff/members", icon: Users },
            { title: "Check-In", href: "/staff/qr-checkin", icon: QrCode },
            {
                title: "Attendance",
                href: "/staff/attendance",
                icon: CalendarCheck,
            },
        ];
    } else {
        items = [
            { title: "Home", href: "/dashboard", icon: LayoutGrid },
            { title: "QR Access", href: "/qraccess", icon: QrCode },
            {
                title: "Membership",
                href: "/member/membership",
                icon: CalendarCheck,
            },
            { title: "Payments", href: "/member/payments", icon: Wallet },
        ];
    }

    return (
        <div
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 md:hidden",
                "pb-[max(1rem,env(safe-area-inset-bottom))]",
            )}
        >
            <nav
                className={cn(
                    "flex w-full max-w-sm items-center justify-around gap-1 rounded-[28px] px-2 py-2.5",
                    // distinct from bg-card: more opaque + its own border/shadow so it
                    // reads as a floating control, not another card, when scrolled content
                    // passes beneath it
                    "border border-white/10 bg-neutral-900/85 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl",
                    "dark:bg-neutral-900/85",
                )}
            >
                {items.map((item) => {
                    const isActive = url.startsWith(item.href);
                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-medium transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground",
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.title}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={toggleSidebar}
                    className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-medium text-muted-foreground"
                >
                    <MoreHorizontal className="h-5 w-5" />
                    <span>More</span>
                </button>
            </nav>
        </div>
    );
}
