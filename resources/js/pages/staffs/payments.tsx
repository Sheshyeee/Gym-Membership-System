import { Head, router } from "@inertiajs/react";
import { StaffMemberProfileSheet } from "@/components/staff-member-profile-sheet";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertTriangle,
    Banknote,
    Clock,
    CreditCard,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { dashboard } from "@/routes";
import { cn } from "@/lib/utils";

type InvoiceStatus =
    | "paid"
    | "failed"
    | "pending"
    | "expired"
    | "refunding"
    | "refunded";

const statusStyles: Record<InvoiceStatus, string> = {
    paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    expired: "bg-muted text-muted-foreground border-border",
    refunding: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    refunded: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const statusLabels: Record<InvoiceStatus, string> = {
    paid: "Successful",
    failed: "Failed",
    pending: "Pending",
    expired: "Expired",
    refunding: "Refunding",
    refunded: "Refunded",
};
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

function csrfSafeFetch(url: string) {
    return fetch(url, { headers: { Accept: "application/json" } }).then((r) =>
        r.json(),
    );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:text-[11px] ${statusStyles[status]}`}
        >
            <span className="size-1.5 rounded-full bg-current" />
            {statusLabels[status]}
        </span>
    );
}

function Panel({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-3 sm:p-4",
                className,
            )}
        >
            {children}
        </div>
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

    const tabs: [StatusFilter, string][] = [
        ["all", "All"],
        ["successful", "Successful"],
        ["failed", "Failed"],
        ["pending", "Pending"],
    ];

    return (
        <>
            <Head title="Payments" />
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 p-3 sm:gap-5 sm:p-4 lg:p-6">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-orange-500 uppercase sm:text-[11px]">
                        Revenue operations
                    </p>
                    <h1 className="text-foreground mt-1 text-lg font-semibold sm:text-xl">
                        Payment lookup
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-[12px]">
                        Search transactions and resolve payment issues quickly ·{" "}
                        {monthLabel}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:gap-4">
                    <Panel>
                        <div className="flex size-7 items-center justify-center rounded-md bg-orange-500/10 text-orange-500 sm:size-8">
                            <Banknote className="size-3.5 sm:size-4" />
                        </div>
                        <p className="text-muted-foreground mt-2.5 text-[10px] sm:text-[11px]">
                            Collected this month
                        </p>
                        <p className="text-foreground mt-0.5 text-lg font-semibold tracking-tight sm:text-xl">
                            ₱{stats.collected.amount}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-[11px]">
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
                    </Panel>

                    <Panel>
                        <div className="flex size-7 items-center justify-center rounded-md bg-red-500/10 text-red-500 sm:size-8">
                            <AlertTriangle className="size-3.5 sm:size-4" />
                        </div>
                        <p className="text-muted-foreground mt-2.5 text-[10px] sm:text-[11px]">
                            Needs attention
                        </p>
                        <p className="text-foreground mt-0.5 text-lg font-semibold tracking-tight sm:text-xl">
                            ₱{stats.failed.amount}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-[11px]">
                            {stats.failed.count} failed payment
                            {stats.failed.count === 1 ? "" : "s"}
                        </p>
                    </Panel>

                    <Panel>
                        <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 sm:size-8">
                            <Clock className="size-3.5 sm:size-4" />
                        </div>
                        <p className="text-muted-foreground mt-2.5 text-[10px] sm:text-[11px]">
                            Awaiting payment
                        </p>
                        <p className="text-foreground mt-0.5 text-lg font-semibold tracking-tight sm:text-xl">
                            ₱{stats.pending.amount}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-[11px]">
                            {stats.pending.count} pending transaction
                            {stats.pending.count === 1 ? "" : "s"}
                        </p>
                    </Panel>
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
                                placeholder="Search transaction or member..."
                                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-8 w-full rounded-md border pr-3 pl-8 text-[12px] focus:ring-1 focus:outline-none sm:h-9 sm:text-[13px]"
                            />
                        </div>

                        <div className="scrollbar-thin border-input bg-background flex items-center gap-0.5 overflow-x-auto rounded-md border p-0.5">
                            {tabs.map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => goTo({ status: value })}
                                    className={cn(
                                        "shrink-0 rounded px-2 py-1 text-[11px] whitespace-nowrap transition-colors sm:px-2.5 sm:py-1.5 sm:text-[12px]",
                                        filters.status === value
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile: card list */}
                    <div className="divide-sidebar-border/60 flex flex-col divide-y sm:hidden">
                        {invoices.data.length === 0 && (
                            <p className="text-muted-foreground px-4 py-8 text-center text-[12px]">
                                No transactions found.
                            </p>
                        )}
                        {invoices.data.map((invoice) => (
                            <button
                                key={invoice.id}
                                onClick={() => openInvoice(invoice.id)}
                                className="hover:bg-muted/40 flex w-full flex-col gap-1.5 px-3 py-2.5 text-left"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-[12px] font-medium text-orange-500">
                                        {invoice.transaction_id}
                                    </span>
                                    <StatusBadge status={invoice.status} />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-foreground truncate text-[12px]">
                                        {invoice.member}
                                    </span>
                                    <span className="text-foreground shrink-0 text-[12px] font-medium">
                                        ₱{invoice.amount}
                                    </span>
                                </div>
                                <span className="text-muted-foreground text-[10px]">
                                    {invoice.method_label} ·{" "}
                                    {invoice.time_label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Desktop / tablet: table */}
                    <div className="scrollbar-thin hidden overflow-x-auto sm:block">
                        <table className="w-full text-left text-[12px] lg:text-[13px]">
                            <thead>
                                <tr className="border-sidebar-border/70 dark:border-sidebar-border text-muted-foreground border-b text-[10px] tracking-wide uppercase lg:text-[11px]">
                                    <th className="px-4 py-2.5 font-medium">
                                        Transaction
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Member
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Amount
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Method
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Time
                                    </th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-muted-foreground px-4 py-8 text-center"
                                        >
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                                {invoices.data.map((invoice) => (
                                    <tr
                                        key={invoice.id}
                                        className="border-sidebar-border/60 hover:bg-muted/40 border-b last:border-0"
                                    >
                                        <td className="px-4 py-2.5 font-medium text-orange-500">
                                            {invoice.transaction_id}
                                        </td>
                                        <td className="text-foreground px-4 py-2.5">
                                            {invoice.member}
                                        </td>
                                        <td className="text-foreground px-4 py-2.5">
                                            ₱{invoice.amount}
                                        </td>
                                        <td className="text-foreground/80 px-4 py-2.5">
                                            {invoice.method_label}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <StatusBadge
                                                status={invoice.status}
                                            />
                                        </td>
                                        <td className="text-foreground/80 px-4 py-2.5">
                                            {invoice.time_label}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <button
                                                onClick={() =>
                                                    openInvoice(invoice.id)
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
                            {invoices.from ?? 0}-{invoices.to ?? 0} of{" "}
                            {invoices.total}
                        </span>
                        <div className="flex items-center gap-1.5">
                            {invoices.prev_page_url ? (
                                <button
                                    onClick={() =>
                                        router.get(
                                            invoices.prev_page_url!,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="border-input hover:bg-muted flex size-6 items-center justify-center rounded border"
                                >
                                    <ChevronLeft className="size-3.5" />
                                </button>
                            ) : (
                                <span className="border-input flex size-6 items-center justify-center rounded border opacity-30">
                                    <ChevronLeft className="size-3.5" />
                                </span>
                            )}
                            <span className="rounded border border-orange-500 bg-orange-500/10 px-1.5 py-0.5 text-orange-500">
                                {invoices.current_page}
                            </span>
                            <span>/ {invoices.last_page}</span>
                            {invoices.next_page_url ? (
                                <button
                                    onClick={() =>
                                        router.get(
                                            invoices.next_page_url!,
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="border-input hover:bg-muted flex size-6 items-center justify-center rounded border"
                                >
                                    <ChevronRight className="size-3.5" />
                                </button>
                            ) : (
                                <span className="border-input flex size-6 items-center justify-center rounded border opacity-30">
                                    <ChevronRight className="size-3.5" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                        <p className="text-[10px] font-semibold tracking-widest text-orange-500 uppercase sm:text-[11px]">
                            Transaction details
                        </p>
                        <SheetTitle className="text-[15px] sm:text-base">
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
                        <div className="space-y-5 px-4 pb-6 sm:space-y-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 sm:size-12">
                                    <CreditCard className="size-4 sm:size-5" />
                                </div>
                                <p className="text-foreground mt-3 text-xl font-semibold sm:text-2xl">
                                    ₱{invoiceDetail.amount}
                                </p>
                                <p className="text-muted-foreground text-[12px] sm:text-[13px]">
                                    {invoiceDetail.method_label}
                                </p>
                                <div className="mt-2">
                                    <StatusBadge
                                        status={invoiceDetail.status}
                                    />
                                </div>
                            </div>

                            <div className="border-sidebar-border/70 dark:border-sidebar-border border-t pt-4">
                                <p className="text-foreground mb-3 text-[12px] font-semibold sm:text-[13px]">
                                    Transaction details
                                </p>
                                <div className="grid grid-cols-2 gap-y-3 text-[12px] sm:text-[13px]">
                                    <div>
                                        <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                            Transaction ID
                                        </p>
                                        <p className="text-foreground font-semibold">
                                            {invoiceDetail.transaction_id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                            Amount
                                        </p>
                                        <p className="text-foreground font-semibold">
                                            ₱{invoiceDetail.amount}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                            Method
                                        </p>
                                        <p className="text-foreground font-semibold">
                                            {invoiceDetail.method_label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                            Status
                                        </p>
                                        <StatusBadge
                                            status={invoiceDetail.status}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                            Date
                                        </p>
                                        <p className="text-foreground font-semibold">
                                            {invoiceDetail.date_label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                            Plan
                                        </p>
                                        <p className="text-foreground font-semibold">
                                            {invoiceDetail.plan}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-sidebar-border/70 dark:border-sidebar-border border-t pt-4">
                                <p className="text-foreground mb-2 text-[12px] font-semibold sm:text-[13px]">
                                    Member information
                                </p>
                                <button
                                    onClick={() =>
                                        openMemberProfile(invoiceDetail.user_id)
                                    }
                                    className="border-sidebar-border/70 dark:border-sidebar-border bg-muted/30 hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left"
                                >
                                    <div className="flex size-9 items-center justify-center rounded-full bg-orange-500/15 text-[11px] font-semibold text-orange-500">
                                        {invoiceDetail.member
                                            .split(" ")
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-foreground text-[12px] font-medium sm:text-[13px]">
                                            {invoiceDetail.member}
                                        </p>
                                        <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                            {invoiceDetail.plan}
                                        </p>
                                    </div>
                                    <ChevronRightIcon className="text-muted-foreground size-4" />
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
