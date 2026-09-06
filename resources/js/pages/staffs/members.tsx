import { StaffMemberProfileSheet } from "@/components/staff-member-profile-sheet";
import { Head, Link, router } from "@inertiajs/react";
import { useRef, useState } from "react";

type MemberStatus = "active" | "expiring_soon" | "expired";
type StatusFilter = "all" | MemberStatus;

interface MemberRow {
    id: number;
    code: string;
    name: string;
    email: string;
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

    return (
        <>
            <Head title="Members" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-orange-500">
                        MEMBER DIRECTORY
                    </p>
                    <h1 className="mt-1 text-3xl font-bold text-foreground">
                        Members
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage member access, plans, and membership health.
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card">
                    <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                        <div className="relative min-w-[240px] flex-1">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                🔍
                            </span>
                            <input
                                value={search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                placeholder="Search members..."
                                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                            {(
                                [
                                    ["all", "All members"],
                                    ["active", "Active"],
                                    ["expiring_soon", "Expiring Soon"],
                                    ["expired", "Expired"],
                                ] as [StatusFilter, string][]
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => handleTabChange(value)}
                                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
                                        filters.status === value
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                    {value === "expiring_soon" &&
                                        statusCounts.expiring_soon > 0 && (
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                                                {statusCounts.expiring_soon}
                                            </span>
                                        )}
                                </button>
                            ))}
                        </div>

                        <button className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground/80 hover:bg-muted">
                            All plans
                        </button>
                        <button className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground/80 hover:bg-muted">
                            Filters
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">
                                        Member
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Plan
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Valid Until
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Last Visit
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Visits
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {members.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No members found.
                                        </td>
                                    </tr>
                                )}
                                {members.data.map((member) => (
                                    <tr
                                        key={member.id}
                                        className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-xs font-semibold text-orange-500">
                                                    {(
                                                        member.name ||
                                                        member.email
                                                    )
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .slice(0, 2)
                                                        .join("")
                                                        .toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {member.name || "—"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.code}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-orange-500">
                                            {member.plan ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[member.status]}`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${statusDot[member.status]}`}
                                                />
                                                {statusLabels[member.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-foreground/80">
                                            {member.valid_until ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-foreground/80">
                                            {member.last_visit ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-foreground/80">
                                            {member.visits ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedMemberId(
                                                        member.id,
                                                    );
                                                    setSheetOpen(true);
                                                }}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                &gt;
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
                        <span>
                            Showing {members.from ?? 0}-{members.to ?? 0} of{" "}
                            {members.total} members
                        </span>
                        <div className="flex items-center gap-2">
                            {members.prev_page_url && (
                                <Link
                                    href={members.prev_page_url}
                                    preserveScroll
                                    className="rounded border border-border px-2 py-1 text-foreground/80 hover:bg-muted"
                                >
                                    ‹
                                </Link>
                            )}
                            <span className="rounded border border-orange-500 bg-orange-500/10 px-2 py-1 text-orange-500">
                                {members.current_page}
                            </span>
                            <span>/ {members.last_page}</span>
                            {members.next_page_url && (
                                <Link
                                    href={members.next_page_url}
                                    preserveScroll
                                    className="rounded border border-border px-2 py-1 text-foreground/80 hover:bg-muted"
                                >
                                    ›
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <StaffMemberProfileSheet
                userId={selectedMemberId}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
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
