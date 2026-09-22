import { Breadcrumbs } from "@/components/breadcrumbs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types";
import { router, usePage } from "@inertiajs/react";
import {
    Bell,
    CalendarDays,
    Search as SearchIcon,
    Ticket,
    TriangleAlert,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberSearchDialog } from "@/components/member-search-dialog";
import { MemberProfileSheet } from "@/components/member-profile-sheet";
import { StaffMemberProfileSheet } from "@/components/staff-member-profile-sheet";
import AppearanceToggleTab from "./appearance-tabs";
import AppearanceTabs from "./appearance-tabs";
import AppearanceToggleIcon from "./appearance-toggle-icon";

type NotificationItem = {
    id: string;
    type: string | null;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
};

type PageProps = {
    notifications: { unread_count: number; items: NotificationItem[] } | null;
    auth: { user: { id: number } | null; roles: string[] };
};

function NotificationIcon({ type }: { type: string | null }) {
    if (type === "membership_expiring") {
        return <TriangleAlert className="h-4 w-4 text-amber-400" />;
    }
    if (type === "membership_expired") {
        return <XCircle className="h-4 w-4 text-red-400" />;
    }
    return <Ticket className="h-4 w-4 text-amber-400" />;
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { notifications, auth } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(
        null,
    );
    const [profileOpen, setProfileOpen] = useState(false);

    const isAdmin = auth.roles?.includes("admin");
    const isStaff = auth.roles?.includes("staff");
    const canSearchMembers = isAdmin || isStaff;

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    useEffect(() => {
        const userId = auth.user?.id;
        if (!userId || !window.Echo) return;

        const channel = window.Echo.private(
            `App.Models.User.${userId}`,
        ).notification(() => {
            router.reload({ only: ["notifications"] });
        });

        return () => {
            window.Echo.leave(`App.Models.User.${userId}`);
        };
    }, [auth.user?.id]);

    useEffect(() => {
        if (!canSearchMembers) return;

        function handleKeydown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
        }

        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    }, [canSearchMembers]);

    function handleSelectMember(id: number) {
        setSelectedMemberId(id);
        setProfileOpen(true);
    }

    function markAllRead() {
        router.post(
            "/notifications/read-all",
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ["notifications"],
            },
        );
    }

    function openNotification(n: NotificationItem) {
        if (!n.read) {
            router.post(
                `/notifications/${n.id}/read`,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ["notifications"],
                },
            );
        }
    }

    const unread = notifications?.unread_count ?? 0;
    const items = notifications?.items ?? [];

    return (
        <header className="border-sidebar-border/50 sticky top-0 md:-top-2 md:-mr-2 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:rounded-t-xl md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                {canSearchMembers && (
                    <>
                        <span className="hidden items-center gap-1.5 rounded-lg border border-sidebar-border/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {today}
                        </span>
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            aria-label="Search members"
                        >
                            <SearchIcon className="h-5 w-5" />
                        </button>
                        <MemberSearchDialog
                            open={searchOpen}
                            onOpenChange={setSearchOpen}
                            onSelectMember={handleSelectMember}
                        />

                        {isAdmin && (
                            <MemberProfileSheet
                                userId={selectedMemberId}
                                open={profileOpen}
                                onOpenChange={setProfileOpen}
                            />
                        )}
                        {!isAdmin && isStaff && (
                            <StaffMemberProfileSheet
                                userId={selectedMemberId}
                                open={profileOpen}
                                onOpenChange={setProfileOpen}
                                onCheckinSuccess={() => {}}
                            />
                        )}
                    </>
                )}

                <AppearanceToggleIcon />

                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground">
                            <Bell className="h-5 w-5" />
                            {unread > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-black">
                                    {unread > 9 ? "9+" : unread}
                                </span>
                            )}
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-80 p-0">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <p className="text-sm font-semibold">
                                Notifications
                            </p>
                            {unread > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs font-medium text-amber-400 hover:text-amber-300"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {items.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                You're all caught up.
                            </p>
                        ) : (
                            <div className="max-h-96 divide-y divide-border overflow-y-auto">
                                {items.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => openNotification(n)}
                                        className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 ${
                                            n.read ? "" : "bg-amber-500/5"
                                        }`}
                                    >
                                        <NotificationIcon type={n.type} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-amber-400">
                                                {n.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {n.body}
                                            </p>
                                            <p className="mt-1 text-[10px] text-muted-foreground/70">
                                                {n.created_at}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
