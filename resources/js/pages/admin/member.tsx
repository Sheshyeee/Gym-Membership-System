import { MemberProfileSheet } from "@/components/member-profile-sheet";
import { Head, Link, router } from "@inertiajs/react";
import { useRef, useState } from "react";

type MemberStatus = "active" | "expiring_soon" | "expired";
type PaymentStatus = "paid" | "pending" | "failed" | null;

interface MemberRow {
    id: number;
    code: string;
    name: string;
    email: string;
    plan: string | null;
    status: MemberStatus;
    valid_until: string | null;
    visits: number | null;
    payment_status: PaymentStatus;
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

interface MemberStats {
    total: number;
    active: number;
    expiring_soon: number;
    expired: number;
}

const statusStyles: Record<MemberStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    expiring_soon:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    expired: "bg-muted text-muted-foreground border border-border",
};

const statusLabels: Record<MemberStatus, string> = {
    active: "Active",
    expiring_soon: "Expiring soon",
    expired: "Expired",
};

const paymentStyles: Record<string, string> = {
    paid: "text-emerald-600 dark:text-emerald-400",
    pending: "text-amber-600 dark:text-amber-400",
    failed: "text-red-600 dark:text-red-400",
    expired: "text-muted-foreground",
};

function memberInitials(member: MemberRow) {
    return (member.name || member.email)
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function StatusPill({ status }: { status: MemberStatus }) {
    return (
        <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${statusStyles[status]}`}
        >
            {statusLabels[status]}
        </span>
    );
}

function PaymentDot({ status }: { status: PaymentStatus }) {
    if (!status) return <span className="text-muted-foreground">—</span>;
    return (
        <span
            className={`flex items-center gap-1.5 text-[11px] ${paymentStyles[status]}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status[0].toUpperCase() + status.slice(1)}
        </span>
    );
}

export default function Member({
    members,
    stats,
    filters,
}: {
    members: PaginatedMembers;
    stats: MemberStats;
    filters: { search: string | null };
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(
        null,
    );
    const [sheetOpen, setSheetOpen] = useState(false);

    function handleSearchChange(value: string) {
        setSearch(value);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            router.get(
                "/members",
                { search: value || undefined },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 350);
    }

    function openMember(id: number) {
        setSelectedMemberId(id);
        setSheetOpen(true);
    }

    // Bars measure the same active / expiring_soon / expired counts shown
    // in the list below.
    const statusBars = [
        { label: "Active", count: stats.active, color: "bg-emerald-500/70" },
        {
            label: "Expiring soon",
            count: stats.expiring_soon,
            color: "bg-amber-500/70",
        },
        {
            label: "Expired",
            count: stats.expired,
            color: "bg-muted-foreground/50",
        },
    ];
    const maxStatus = Math.max(1, ...statusBars.map((s) => s.count));

    return (
        <>
            <Head title="Member Management" />
            <div className="flex h-full flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
                <div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-600 sm:text-xs dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live workspace
                    </div>
                    <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                        Member Management
                    </h1>
                    <p className="text-[13px] text-muted-foreground sm:text-sm">
                        Search, filter, and manage your membership base.
                    </p>
                </div>

                {/* Mobile: search sits on its own full-width row, and the
                    two filter buttons sit together on the row below, each
                    taking half the width — both always visible, nothing to
                    scroll to reach. At sm+, "sm:contents" un-wraps the
                    button pair so they flow inline with the search input
                    again, matching the desktop layout. */}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <input
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search by name or email..."
                        className="h-10 w-full rounded-lg border border-border bg-muted/50 px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:ring-ring focus:ring-1 focus:outline-none sm:min-w-[260px] sm:flex-1 sm:text-sm"
                    />
                    <div className="flex gap-2 sm:contents">
                        <button className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-[13px] text-foreground/80 hover:bg-muted sm:h-10 sm:flex-none sm:justify-start sm:text-sm">
                            All members
                        </button>
                        <button className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-[13px] text-foreground/80 hover:bg-muted sm:h-10 sm:flex-none sm:justify-start sm:text-sm">
                            More filters
                        </button>
                    </div>
                </div>

                {/* items-stretch (default) so the stats sidebar and the
                    members panel share the same height on desktop — the
                    sidebar's content is spread with mt-auto below so it
                    fills that height instead of stopping halfway down with
                    a gap under it. On mobile the two stack in their own
                    rows and just size to their own content. */}
                <div className="grid flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[280px_1fr]">
                    <div className="flex flex-col rounded-2xl border border-border bg-card p-4 sm:rounded-xl">
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
                            MEMBERS OVERVIEW
                        </p>
                        <p className="mt-2.5 text-2xl font-semibold text-foreground sm:mt-3 sm:text-3xl">
                            {stats.total.toLocaleString()}
                            <span className="ml-1 text-sm font-normal text-muted-foreground">
                                members
                            </span>
                        </p>

                        <div className="mt-4 flex h-16 items-end gap-1.5">
                            {statusBars.map((s) => (
                                <div
                                    key={s.label}
                                    className={`flex-1 rounded-t ${s.color} transition-all`}
                                    style={{
                                        height: `${Math.max((s.count / maxStatus) * 100, s.count > 0 ? 6 : 2)}%`,
                                    }}
                                    title={`${s.label}: ${s.count}`}
                                />
                            ))}
                        </div>

                        <div className="mt-4 space-y-2 text-[13px]">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Active
                                </span>
                                <span className="font-medium text-foreground">
                                    {stats.active}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Expiring soon
                                </span>
                                <span className="font-medium text-foreground">
                                    {stats.expiring_soon}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className="bg-muted-foreground h-1.5 w-1.5 rounded-full" />
                                    Expired
                                </span>
                                <span className="font-medium text-foreground">
                                    {stats.expired}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card sm:rounded-xl">
                        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-semibold text-foreground sm:text-sm">
                                        All members
                                    </span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                        {members.total}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
                                    Updated just now
                                </p>
                            </div>
                        </div>

                        {/* Desktop / tablet: real table. */}
                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                                        <th className="px-5 py-2.5 font-medium">
                                            Member
                                        </th>
                                        <th className="px-5 py-2.5 font-medium">
                                            Plan
                                        </th>
                                        <th className="px-5 py-2.5 font-medium">
                                            Status
                                        </th>
                                        <th className="px-5 py-2.5 font-medium">
                                            Valid until
                                        </th>
                                        <th className="px-5 py-2.5 font-medium">
                                            Visits
                                        </th>
                                        <th className="px-5 py-2.5 font-medium">
                                            Payment
                                        </th>
                                        <th className="px-5 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.data.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                                                        {memberInitials(member)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {member.name || "—"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="text-foreground">
                                                    {member.plan ?? "—"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {member.code}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusPill
                                                    status={member.status}
                                                />
                                            </td>
                                            <td className="px-5 py-3 text-foreground/80">
                                                {member.valid_until ?? "—"}
                                            </td>
                                            <td className="px-5 py-3 text-foreground/80">
                                                {member.visits ?? "—"}
                                            </td>
                                            <td className="px-5 py-3">
                                                <PaymentDot
                                                    status={
                                                        member.payment_status
                                                    }
                                                />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        openMember(member.id)
                                                    }
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    &gt;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {members.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-10 text-center text-muted-foreground"
                                            >
                                                No members match your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile: stacked cards. A 7-column table squeezed
                            into a phone width is the classic "cheap
                            template" tell — this gives each member a proper
                            compact card instead. Status pill no longer
                            wraps/shrinks (shrink-0 + whitespace-nowrap) so
                            it can't get squeezed against a long name. */}
                        <ul className="flex-1 divide-y divide-border sm:hidden">
                            {members.data.length === 0 && (
                                <li className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                                    No members match your search.
                                </li>
                            )}
                            {members.data.map((member) => (
                                <li
                                    key={member.id}
                                    onClick={() => openMember(member.id)}
                                    className="px-4 py-3.5 active:bg-muted/40"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                                                {memberInitials(member)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-medium text-foreground">
                                                    {member.name || "—"}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusPill status={member.status} />
                                    </div>

                                    <div className="mt-2.5 grid grid-cols-2 gap-y-1 text-[11px]">
                                        <span className="truncate text-muted-foreground">
                                            {member.plan ?? "No plan"} ·{" "}
                                            {member.code}
                                        </span>
                                        <span className="text-right">
                                            <PaymentDot
                                                status={member.payment_status}
                                            />
                                        </span>
                                        <span className="text-muted-foreground">
                                            {member.valid_until ?? "—"}
                                        </span>
                                        <span className="text-muted-foreground text-right">
                                            {member.visits ?? 0} visits
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Pagination: stacked on mobile so "Showing X-Y of
                            Z members" (which can run long) never squeezes
                            Prev/Next out of view — they get their own full-
                            width row underneath instead of fighting for
                            space on one line. */}
                        <div className="mt-auto flex flex-col gap-2 border-t border-border px-4 py-3 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-xs">
                            <span>
                                Showing {members.from ?? 0}-{members.to ?? 0} of{" "}
                                {members.total} members
                            </span>
                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                                <span>
                                    {members.current_page}/{members.last_page}
                                </span>
                                <div className="flex items-center gap-2">
                                    {members.prev_page_url && (
                                        <Link
                                            href={members.prev_page_url}
                                            preserveScroll
                                            className="rounded border border-border px-2.5 py-1 text-foreground/80 hover:bg-muted"
                                        >
                                            Prev
                                        </Link>
                                    )}
                                    {members.next_page_url && (
                                        <Link
                                            href={members.next_page_url}
                                            preserveScroll
                                            className="rounded border border-border px-2.5 py-1 text-foreground/80 hover:bg-muted"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <MemberProfileSheet
                userId={selectedMemberId}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />
        </>
    );
}

Member.layout = {
    breadcrumbs: [{ title: "Members", href: "/members" }],
};
