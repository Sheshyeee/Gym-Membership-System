import { MemberProfileSheet } from "@/components/member-profile-sheet";
import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

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
    monthly_signups: { label: string; count: number }[];
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

    const maxSignups = Math.max(
        1,
        ...stats.monthly_signups.map((m) => m.count),
    );

    return (
        <>
            <Head title="Member Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live workspace
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold text-foreground">
                        Member Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Search, filter, and manage your membership base.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search by name or email..."
                        className="h-10 min-w-[260px] flex-1 rounded-lg border border-border bg-muted/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-foreground/80 hover:bg-muted">
                        All members
                    </button>
                    <button className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-foreground/80 hover:bg-muted">
                        More filters
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground">
                            MEMBERS OVERVIEW
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-foreground">
                            {stats.total.toLocaleString()}
                            <span className="ml-1 text-sm font-normal text-muted-foreground">
                                members
                            </span>
                        </p>

                        <div className="mt-4 flex h-16 items-end gap-1.5">
                            {stats.monthly_signups.map((m) => (
                                <div
                                    key={m.label}
                                    className="flex-1 rounded-t bg-orange-500/70"
                                    style={{
                                        height: `${(m.count / maxSignups) * 100}%`,
                                    }}
                                    title={`${m.label}: ${m.count}`}
                                />
                            ))}
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Active
                                </span>
                                <span className="text-foreground">
                                    {stats.active}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Expiring soon
                                </span>
                                <span className="text-foreground">
                                    {stats.expiring_soon}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    Expired
                                </span>
                                <span className="text-foreground">
                                    {stats.expired}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card">
                        <div className="flex items-center justify-between px-4 pt-4">
                            <div>
                                <span className="text-sm font-semibold text-foreground">
                                    All members
                                </span>
                                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {members.total}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    Updated just now
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-y border-border text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-2 font-medium">
                                            Member
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Plan
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Valid until
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Visits
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Payment
                                        </th>
                                        <th className="px-4 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.data.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
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
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-foreground">
                                                    {member.plan ?? "—"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {member.code}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[member.status]}`}
                                                >
                                                    {
                                                        statusLabels[
                                                            member.status
                                                        ]
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-foreground/80">
                                                {member.valid_until ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-foreground/80">
                                                {member.visits ?? "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {member.payment_status && (
                                                    <span
                                                        className={`flex items-center gap-1.5 ${paymentStyles[member.payment_status]}`}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        {member.payment_status[0].toUpperCase() +
                                                            member.payment_status.slice(
                                                                1,
                                                            )}
                                                    </span>
                                                )}
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
                                <span>
                                    {members.current_page}/{members.last_page}
                                </span>
                                {members.prev_page_url && (
                                    <Link
                                        href={members.prev_page_url}
                                        preserveScroll
                                        className="rounded border border-border px-2 py-1 text-foreground/80 hover:bg-muted"
                                    >
                                        Prev
                                    </Link>
                                )}
                                {members.next_page_url && (
                                    <Link
                                        href={members.next_page_url}
                                        preserveScroll
                                        className="rounded border border-border px-2 py-1 text-foreground/80 hover:bg-muted"
                                    >
                                        Next
                                    </Link>
                                )}
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
