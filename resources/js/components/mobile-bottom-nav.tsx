import { Link, usePage } from "@inertiajs/react";
import {
    LayoutGrid,
    Users,
    Wallet,
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
        // Matches AppSidebar exactly: admin has no check-in route, only Attendance.
        items = [
            { title: "Dashboard", href: "/overview", icon: LayoutGrid },
            { title: "Members", href: "/members", icon: Users },
            { title: "Attendance", href: "/attendance", icon: CalendarCheck },
            { title: "Payments", href: "/payments", icon: Wallet },
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

    // "More" is included in the slot count so the pill math and spacing
    // stay correct regardless of which role's items are shown.
    const slots = items.length + 1;
    const activeIndex = items.findIndex((item) => url.startsWith(item.href));

    return (
        <div
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 md:hidden",
                "pb-[max(1rem,env(safe-area-inset-bottom))]",
            )}
        >
            <nav
                className={cn(
                    "relative isolate flex w-full max-w-sm items-center gap-1 overflow-hidden rounded-[28px] p-1.5",
                    "bg-background/70 backdrop-blur-2xl backdrop-saturate-150",
                    "shadow-[0_10px_40px_-8px_rgba(0,0,0,0.55),0_1px_0_0_rgba(255,255,255,0.06)_inset,0_-1px_10px_0_rgba(0,0,0,0.35)_inset]",
                    "ring-1 ring-border/60",
                )}
            >
                {activeIndex !== -1 && (
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-y-1.5 left-1.5 rounded-[20px] transition-transform duration-300 ease-out"
                        style={{
                            width: `calc((100% - 0.75rem) / ${slots})`,
                            transform: `translateX(${activeIndex * 100}%)`,
                        }}
                    >
                        <div
                            className={cn(
                                "h-full w-full rounded-[20px]",
                                "bg-primary/15",
                                "shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset]",
                                "ring-1 ring-primary/25",
                            )}
                        />
                    </div>
                )}

                {items.map((item, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            className={cn(
                                "relative z-10 flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition-colors duration-200",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground active:text-foreground/80",
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5 transition-transform duration-200",
                                    isActive && "scale-110",
                                )}
                            />
                            <span>{item.title}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={toggleSidebar}
                    className="relative z-10 flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium text-muted-foreground transition-colors duration-200 active:text-foreground/80"
                >
                    <MoreHorizontal className="h-5 w-5" />
                    <span>More</span>
                </button>
            </nav>
        </div>
    );
}
