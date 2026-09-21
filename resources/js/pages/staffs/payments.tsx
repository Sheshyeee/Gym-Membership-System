import { Head, router } from "@inertiajs/react";
import { StaffMemberProfileSheet } from "@/components/staff-member-profile-sheet";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertTriangle,
    Banknote,
    CheckCircle2,
    Clock,
    CreditCard,
    Search,
} from "lucide-react";
import { useRef, useState } from "react";
import { dashboard } from "@/routes";

type InvoiceStatus = "paid" | "failed" | "pending" | "expired";
type StatusFilter = "all" | "successful" | "failed" | "pending" | "expired";

interface InvoiceRow {
    id: number;
    user_id: number;
    transaction_id: string;
    member: string;
    plan: string;
    amount: string;
    method: string;
    method_label: string;
    status: InvoiceStatus;
    time_label: string;
}

interface InvoiceDetail extends InvoiceRow {
    date_label: string;
}

interface PaginatedInvoices {
    data: InvoiceRow[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Stats {
    collected: { amount: string; count: number; change_pct: number | null };
    failed: { amount: string; count: number };
    pending: { amount: string; count: number };
}

const statusStyles: Record<InvoiceStatus, string> = {
    paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    expired: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<InvoiceStatus, string> = {
    paid: "Successful",
    failed: "Failed",
    pending: "Pending",
    expired: "Expired",
};

function csrfSafeFetch(url: string) {
    return fetch(url, { headers: { Accept: "application/json" } }).then((r) =>
        r.json(),
    );
}

export default function Payments({
    invoices,
    filters,
    stats,
    monthLabel,
}: {
    invoices: PaginatedInvoices;
    filters: { search: string | null; status: StatusFilter };
    stats: Stats;
    monthLabel: string;
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
        null,
    );
    const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(
        null,
    );
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);

    const [profileUserId, setProfileUserId] = useState<number | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);

    function goTo(params: { search?: string; status?: StatusFilter }) {
        router.get(
            "/staff/payments",
            {
                search: params.search ?? search ?? undefined,
                status: params.status ?? filters.status,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    function handleSearchChange(value: string) {
        setSearch(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => goTo({ search: value }), 350);
    }

    function openInvoice(id: number) {
        setSelectedInvoiceId(id);
        setDetailOpen(true);
        setDetailLoading(true);
        setInvoiceDetail(null);

        csrfSafeFetch(`/staff/payments/${id}`)
            .then((json) => setInvoiceDetail(json))
            .finally(() => setDetailLoading(false));
    }

    function openMemberProfile(userId: number) {
        setDetailOpen(false);
        setProfileUserId(userId);
        setProfileOpen(true);
    }

    return (
        <>
            <Head title="Payments" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-orange-500">
                        REVENUE OPERATIONS
                    </p>
                    <h1 className="mt-1 text-3xl font-bold text-foreground">
                        Payment lookup
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Search transactions and resolve payment issues quickly ·{" "}
                        {monthLabel}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                            <Banknote className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Collected this month
                        </p>
                        <p className="mt-1 text-2xl font-bold text-foreground">
                            ₱{stats.collected.amount}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {stats.collected.change_pct !== null && (
                                <span
                                    className={
                                        stats.collected.change_pct >= 0
                                            ? "text-emerald-500"
                                            : "text-red-500"
                                    }
                                >
                                    {stats.collected.change_pct >= 0
                                        ? "↗"
                                        : "↘"}{" "}
                                    {Math.abs(stats.collected.change_pct)}%{" "}
                                </span>
                            )}
                            {stats.collected.count} successful payments
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Needs attention
                        </p>
                        <p className="mt-1 text-2xl font-bold text-foreground">
                            ₱{stats.failed.amount}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {stats.failed.count} failed payment
                            {stats.failed.count === 1 ? "" : "s"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                            <Clock className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Awaiting payment
                        </p>
                        <p className="mt-1 text-2xl font-bold text-foreground">
                            ₱{stats.pending.amount}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {stats.pending.count} pending transaction
                            {stats.pending.count === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card">
                    <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                        <div className="relative min-w-[240px] flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                placeholder="Search transaction or member..."
                                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                            {(
                                [
                                    ["all", "All"],
                                    ["successful", "Successful"],
                                    ["failed", "Failed"],
                                    ["pending", "Pending"],
                                ] as [StatusFilter, string][]
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => goTo({ status: value })}
                                    className={`rounded-md px-3 py-1.5 text-sm ${
                                        filters.status === value
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">
                                        Transaction
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Member
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Method
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Time
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                                {invoices.data.map((invoice) => (
                                    <tr
                                        key={invoice.id}
                                        className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                                    >
                                        <td className="px-4 py-3 font-medium text-orange-500">
                                            {invoice.transaction_id}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">
                                            {invoice.member}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">
                                            ₱{invoice.amount}
                                        </td>
                                        <td className="px-4 py-3 text-foreground/80">
                                            {invoice.method_label}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[invoice.status]}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                {statusLabels[invoice.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-foreground/80">
                                            {invoice.time_label}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() =>
                                                    openInvoice(invoice.id)
                                                }
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
                            Showing {invoices.from ?? 0}-{invoices.to ?? 0} of{" "}
                            {invoices.total} transactions
                        </span>
                        <div className="flex items-center gap-2">
                            {invoices.prev_page_url && (
                                <button
                                    onClick={() =>
                                        router.get(
                                            invoices.prev_page_url!,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="rounded border border-border px-2 py-1 hover:bg-muted"
                                >
                                    ‹
                                </button>
                            )}
                            <span className="rounded border border-orange-500 bg-orange-500/10 px-2 py-1 text-orange-500">
                                {invoices.current_page}
                            </span>
                            <span>/ {invoices.last_page}</span>
                            {invoices.next_page_url && (
                                <button
                                    onClick={() =>
                                        router.get(
                                            invoices.next_page_url!,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="rounded border border-border px-2 py-1 hover:bg-muted"
                                >
                                    ›
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                        <p className="text-xs font-semibold tracking-wide text-orange-500">
                            TRANSACTION DETAILS
                        </p>
                        <SheetTitle>
                            {invoiceDetail?.transaction_id ?? "Loading..."}
                        </SheetTitle>
                    </SheetHeader>

                    {detailLoading && (
                        <div className="space-y-3 px-4">
                            <Skeleton className="mx-auto h-12 w-12 rounded-lg" />
                            <Skeleton className="mx-auto h-6 w-32" />
                            <Skeleton className="mx-auto h-4 w-24" />
                        </div>
                    )}

                    {invoiceDetail && !detailLoading && (
                        <div className="space-y-6 px-4 pb-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <p className="mt-3 text-2xl font-bold text-foreground">
                                    ₱{invoiceDetail.amount}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {invoiceDetail.method_label}
                                </p>
                                <span
                                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[invoiceDetail.status]}`}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {statusLabels[invoiceDetail.status]}
                                </span>
                            </div>

                            <div className="border-t border-border pt-4">
                                <p className="mb-3 text-sm font-semibold text-foreground">
                                    Transaction details
                                </p>
                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Transaction ID
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {invoiceDetail.transaction_id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Amount
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            ₱{invoiceDetail.amount}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Method
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {invoiceDetail.method_label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Status
                                        </p>
                                        <span
                                            className={`inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-medium ${statusStyles[invoiceDetail.status]}`}
                                        >
                                            {statusLabels[invoiceDetail.status]}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Date
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {invoiceDetail.date_label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Plan
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {invoiceDetail.plan}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-border pt-4">
                                <p className="mb-2 text-sm font-semibold text-foreground">
                                    Member information
                                </p>
                                <button
                                    onClick={() =>
                                        openMemberProfile(invoiceDetail.user_id)
                                    }
                                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 text-left hover:bg-muted/50"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-xs font-semibold text-orange-500">
                                        {invoiceDetail.member
                                            .split(" ")
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">
                                            {invoiceDetail.member}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {invoiceDetail.plan}
                                        </p>
                                    </div>
                                    <span className="text-muted-foreground">
                                        &gt;
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <StaffMemberProfileSheet
                userId={profileUserId}
                open={profileOpen}
                onOpenChange={setProfileOpen}
            />
        </>
    );
}

Payments.layout = {
    breadcrumbs: [
        { title: "Staff portal", href: dashboard() },
        { title: "Payments", href: "/staff/payments" },
    ],
};
