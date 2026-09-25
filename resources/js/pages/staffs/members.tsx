import { StaffMemberProfileSheet } from "@/components/staff-member-profile-sheet";
import { Head, Link, router } from "@inertiajs/react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useRef, useState } from "react";

type MemberStatus = "active" | "expiring_soon" | "expired";
type StatusFilter = "all" | MemberStatus;

interface MemberRow {
    id: number;
    code: string;
    name: string;
    email: string;
    avatar: string | null;
    plan: string | null;
    status: MemberStatus;
    valid_until: string | null;
    last_visit: string | null;
    visits: number | null;
}

interface PaginatedMembers {
    data: MemberRow[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface StatusCounts {
    all: number;
    active: number;
    expiring_soon: number;
    expired: number;
}

const statusStyles: Record<MemberStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    expiring_soon: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    expired: "bg-red-500/10 text-red-500 border border-red-500/20",
};

const statusLabels: Record<MemberStatus, string> = {
    active: "Active",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
};

const statusDot: Record<MemberStatus, string> = {
    active: "bg-emerald-500",
    expiring_soon: "bg-amber-500",
    expired: "bg-red-500",
};

function initialsOf(nameOrEmail: string) {
    return nameOrEmail
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

// Real avatar photo (e.g. Google account picture) when present, falling
// back to the orange initials circle used elsewhere on this page.
// referrerPolicy="no-referrer" keeps Google's avatar URLs
// (lh3.googleusercontent.com) from failing to load due to cross-origin
// Referer headers.
function MemberAvatar({
    member,
    className,
}: {
    member: MemberRow;
    className: string;
}) {
    const [broken, setBroken] = useState(false);
    const label = member.name || member.email;

    if (member.avatar && !broken) {
        return (
            <img
                src={member.avatar}
                alt={label}
                referrerPolicy="no-referrer"
                onError={() => setBroken(true)}
                className={`shrink-0 rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-orange-500/15 font-semibold text-orange-500 ${className}`}
        >
            {initialsOf(label)}
        </div>
    );
}

function StatusBadge({ status }: { status: MemberStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-[11px] ${statusStyles[status]}`}
        >
            <span className={`size-1.5 rounded-full ${statusDot[status]}`} />
            {statusLabels[status]}
        </span>
    );
}

export default function StaffMembers({
    members,
    filters,
    statusCounts,
}: {
    members: PaginatedMembers;
    filters: { search: string | null; status: StatusFilter };
    statusCounts: StatusCounts;
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(
        null,
    );
    const [sheetOpen, setSheetOpen] = useState(false);

    function goTo(params: { search?: string; status?: StatusFilter }) {
        router.get(
            "/staff/members",
            {
                search: params.search ?? search ?? undefined,
                status:
                    (params.status ?? filters.status) === "all"
                        ? undefined
                        : (params.status ?? filters.status),
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    function handleSearchChange(value: string) {
        setSearch(value);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(() => {
            goTo({ search: value });
        }, 350);
    }

    function handleTabChange(status: StatusFilter) {
        goTo({ status });
    }

    function handleCheckinSuccess() {
        // Partial reload: re-fetch just the table + tab counts for the
        // current URL/filters, without a full navigation or losing scroll.
        router.reload({
            only: ["members", "statusCounts"],
        });
    }

    function openMember(id: number) {
        setSelectedMemberId(id);
        setSheetOpen(true);
    }

    const tabs: [StatusFilter, string][] = [
        ["all", "All"],
        ["active", "Active"],
        ["expiring_soon", "Expiring"],
        ["expired", "Expired"],
    ];

    return (
        <>
            <Head title="Members" />
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 p-3 sm:gap-5 sm:p-4 lg:p-6">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-orange-500 uppercase sm:text-[11px]">
                        Member directory
                    </p>
                    <h1 className="text-foreground mt-1 text-lg font-semibold sm:text-xl">
                        Members
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-[12px]">
                        Manage member access, plans, and membership health.
                    </p>
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border">
                    {/* Toolbar */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border flex flex-col gap-2.5 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-4">
                        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                            <input
                                value={search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                placeholder="Search members..."
                                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-8 w-full rounded-md border pr-3 pl-8 text-[12px] focus:ring-1 focus:outline-none sm:h-9 sm:text-[13px]"
                            />
                        </div>

                        <div className="scrollbar-thin border-input bg-background flex items-center gap-0.5 overflow-x-auto rounded-md border p-0.5">
                            {tabs.map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => handleTabChange(value)}
                                    className={`flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] whitespace-nowrap transition-colors sm:px-2.5 sm:py-1.5 sm:text-[12px] ${
                                        filters.status === value
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                    {value === "expiring_soon" &&
                                        statusCounts.expiring_soon > 0 && (
                                            <span className="flex size-3.5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-semibold text-white">
                                                {statusCounts.expiring_soon}
                                            </span>
                                        )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile: card list */}
                    <div className="divide-sidebar-border/60 flex flex-col divide-y sm:hidden">
                        {members.data.length === 0 && (
                            <p className="text-muted-foreground px-4 py-8 text-center text-[12px]">
                                No members found.
                            </p>
                        )}
                        {members.data.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => openMember(member.id)}
                                className="hover:bg-muted/40 flex w-full items-center gap-3 px-3 py-2.5 text-left"
                            >
                                <MemberAvatar
                                    member={member}
                                    className="size-8 text-[11px]"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-foreground truncate text-[12px] font-medium">
                                            {member.name || "—"}
                                        </p>
                                        <StatusBadge status={member.status} />
                                    </div>
                                    <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
                                        {member.plan ?? "No plan"} ·{" "}
                                        {member.visits ?? 0} visits
                                    </p>
                                </div>
                                <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
                            </button>
                        ))}
                    </div>

                    {/* Desktop / tablet: table */}
                    <div className="scrollbar-thin hidden overflow-x-auto sm:block">
                        <table className="w-full text-left text-[12px] lg:text-[13px]">
                            <thead>
                                <tr className="border-sidebar-border/70 dark:border-sidebar-border text-muted-foreground border-b text-[10px] tracking-wide uppercase lg:text-[11px]">
                                    <th className="px-4 py-2.5 font-medium">
                                        Member
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Plan
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Valid Until
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Last Visit
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Visits
                                    </th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {members.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-muted-foreground px-4 py-8 text-center"
                                        >
                                            No members found.
                                        </td>
                                    </tr>
                                )}
                                {members.data.map((member) => (
                                    <tr
                                        key={member.id}
                                        className="border-sidebar-border/60 hover:bg-muted/40 border-b last:border-0"
                                    >
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <MemberAvatar
                                                    member={member}
                                                    className="size-8 text-[10px]"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate font-medium">
                                                        {member.name || "—"}
                                                    </p>
                                                    <p className="text-muted-foreground truncate text-[10px] lg:text-[11px]">
                                                        {member.code}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-orange-500">
                                            {member.plan ?? "—"}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <StatusBadge
                                                status={member.status}
                                            />
                                        </td>
                                        <td className="text-foreground/80 px-4 py-2.5">
                                            {member.valid_until ?? "—"}
                                        </td>
                                        <td className="text-foreground/80 px-4 py-2.5">
                                            {member.last_visit ?? "—"}
                                        </td>
                                        <td className="text-foreground/80 px-4 py-2.5">
                                            {member.visits ?? "—"}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <button
                                                onClick={() =>
                                                    openMember(member.id)
                                                }
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <ChevronRightIcon className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border text-muted-foreground flex items-center justify-between gap-2 border-t px-3 py-2.5 text-[10px] sm:px-4 sm:py-3 sm:text-[11px]">
                        <span>
                            {members.from ?? 0}-{members.to ?? 0} of{" "}
                            {members.total}
                        </span>
                        <div className="flex items-center gap-1.5">
                            {members.prev_page_url ? (
                                <Link
                                    href={members.prev_page_url}
                                    preserveScroll
                                    className="border-input text-foreground/80 hover:bg-muted flex size-6 items-center justify-center rounded border"
                                >
                                    <ChevronLeft className="size-3.5" />
                                </Link>
                            ) : (
                                <span className="border-input flex size-6 items-center justify-center rounded border opacity-30">
                                    <ChevronLeft className="size-3.5" />
                                </span>
                            )}
                            <span className="rounded border border-orange-500 bg-orange-500/10 px-1.5 py-0.5 text-orange-500">
                                {members.current_page}
                            </span>
                            <span>/ {members.last_page}</span>
                            {members.next_page_url ? (
                                <Link
                                    href={members.next_page_url}
                                    preserveScroll
                                    className="border-input text-foreground/80 hover:bg-muted flex size-6 items-center justify-center rounded border"
                                >
                                    <ChevronRight className="size-3.5" />
                                </Link>
                            ) : (
                                <span className="border-input flex size-6 items-center justify-center rounded border opacity-30">
                                    <ChevronRight className="size-3.5" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <StaffMemberProfileSheet
                userId={selectedMemberId}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                onCheckinSuccess={handleCheckinSuccess}
            />
        </>
    );
}

StaffMembers.layout = {
    breadcrumbs: [
        { title: "Staff portal", href: "/staff/dashboard" },
        { title: "Members", href: "/staff/members" },
    ],
};
