import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChevronRight,
    RefreshCw,
    ShieldCheck,
    Clock,
    Landmark,
} from "lucide-react";
import { dashboard } from "@/routes";

type InvoiceStatus =
    | "pending"
    | "paid"
    | "failed"
    | "expired"
    | "refunding"
    | "refunded";

type InvoiceRow = {
    id: number;
    transaction_id: string;
    member: string;
    member_avatar: string | null;
    plan: string;
    amount: number;
    currency: string;
    method: string;
    status: InvoiceStatus;
    webhook_status: "verified" | "pending";
    created_at: string;
    paid_at: string | null;
    refunded_at: string | null;
    can_refund: boolean;
};

// Mirrors PayMongo's payout resource status field exactly — see
// https://docs.paymongo.com/reference/payout-resources
type PayoutStatus =
    | "pending"
    | "on_hold"
    | "in_transit"
    | "deposited"
    | "returned"
    | "cancelled";

type PayoutRow = {
    id: string;
    status: PayoutStatus;
    amount: number;
    currency: string;
    bank_name: string | null;
    account_last4: string | null;
    created_at: string | null;
};

type PageFlash = {
    success?: string;
    retry_checkout_url?: string;
};

function formatAmount(amount: number, currency: string) {
    const symbol = currency === "PHP" ? "₱" : currency;
    return `${symbol}${(amount / 100).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(iso: string) {
    const date = new Date(iso);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const time = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
    if (isToday) return `Today, ${time}`;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString())
        return `Yesterday, ${time}`;
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

function formatSettlementDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// Theme-aware status tokens (light + dark variants), matching the
// convention used on Members/Attendance, instead of the old hardcoded
// -400/-500 dark-only palette that read illegibly in light mode.
const statusStyles: Record<InvoiceStatus, string> = {
    paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    pending:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    refunding:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    expired: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    refunded: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<InvoiceStatus, string> = {
    paid: "Successful",
    pending: "Pending",
    refunding: "Refunding",
    failed: "Failed",
    expired: "Expired",
    refunded: "Refunded",
};

const payoutStatusStyles: Record<PayoutStatus, string> = {
    deposited:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    in_transit:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    pending:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    on_hold:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    returned: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    cancelled: "bg-muted text-muted-foreground border-border",
};

const payoutStatusLabels: Record<PayoutStatus, string> = {
    deposited: "Settled",
    in_transit: "In transit",
    pending: "Pending",
    on_hold: "On hold",
    returned: "Returned",
    cancelled: "Cancelled",
};

function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

// AvatarImage (Radix) falls back to AvatarFallback automatically when the
// src is missing or fails to load — no manual onError state needed.
// referrerPolicy="no-referrer" keeps Google-account photo URLs
// (lh3.googleusercontent.com) from failing to load due to cross-origin
// Referer headers.
function MemberAvatar({
    name,
    avatar,
    className,
}: {
    name: string;
    avatar: string | null;
    className: string;
}) {
    return (
        <Avatar className={className}>
            {avatar && (
                <AvatarImage
                    src={avatar}
                    alt={name}
                    referrerPolicy="no-referrer"
                />
            )}
            <AvatarFallback className="bg-muted text-xs font-medium">
                {initials(name)}
            </AvatarFallback>
        </Avatar>
    );
}

export default function Payments({
    invoices,
    payouts,
    filters,
}: {
    invoices: InvoiceRow[];
    payouts: PayoutRow[];
    filters: { search: string; status: string };
}) {
    const { flash } = usePage<{ flash: PageFlash }>().props;
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const [selected, setSelected] = useState<InvoiceRow | null>(null);
    const [refunding, setRefunding] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [syncingPayouts, setSyncingPayouts] = useState(false);

    useEffect(() => {
        const channel = window.Echo.private("admin.payments")
            .listen(".invoice.status.updated", () => {
                // Just re-fetch the invoices prop; cheap, and avoids drift
                // between partial payloads and full server state.
                router.reload({ only: ["invoices"] });
            })
            .listen(".payout.status.updated", () => {
                // Same idea for payouts — PayMongo owns the source of truth,
                // we just re-pull our mirrored copy.
                router.reload({ only: ["payouts"] });
            });

        return () => {
            window.Echo.leave("admin.payments");
        };
    }, []);

    // keep the open sheet's data fresh when invoices refreshes
    useEffect(() => {
        if (!selected) return;
        const updated = invoices.find((i) => i.id === selected.id);
        if (updated) setSelected(updated);
    }, [invoices]);

    useEffect(() => {
        setCopied(false);
    }, [flash?.retry_checkout_url]);

    function applyFilters(next: { search?: string; status?: string }) {
        router.get(
            "/payments",
            { search: next.search ?? search, status: next.status ?? status },
            { preserveState: true, replace: true },
        );
    }

    function issueRefund(invoice: InvoiceRow) {
        setRefunding(true);
        router.post(
            `/admin/payments/${invoice.id}/refund`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRefunding(false),
                onSuccess: () => setSelected(null),
            },
        );
    }

    function retryPayment(invoice: InvoiceRow) {
        setRetrying(true);
        router.post(
            `/admin/payments/${invoice.id}/retry`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRetrying(false),
                onSuccess: () => {
                    // Optimistically reflect the new pending state in the open sheet.
                    setSelected((current) =>
                        current ? { ...current, status: "pending" } : current,
                    );
                },
            },
        );
    }

    function copyLink(url: string) {
        navigator.clipboard.writeText(url);
        setCopied(true);
    }

    function syncPayouts() {
        setSyncingPayouts(true);
        router.post(
            "/admin/payouts/sync",
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSyncingPayouts(false),
            },
        );
    }

    return (
        <>
            <Head title="Payments" />

            {/* Page-level padding/gap wrapper — previously these two panels
                sat edge-to-edge with no page margin at all. Now matches the
                spacing scale used on Members/Attendance/Revenue. */}
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-3 p-2.5 sm:gap-6 sm:p-6 lg:p-8">
                {/* Payout history — mirrors PayMongo's own settlement ledger.
                    Read-only: this app never initiates a payout, it only records
                    what PayMongo has already sent (or is about to send) to the
                    bank account on file. */}
                <div className="rounded-2xl border border-border bg-card p-3 sm:rounded-xl sm:p-6">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div>
                            <h1 className="text-[13px] font-semibold sm:text-lg">
                                Payout history
                            </h1>
                            <p className="text-[11px] text-muted-foreground sm:text-sm">
                                Recent settlement transactions from PayMongo
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={syncingPayouts}
                            onClick={syncPayouts}
                            className="w-full sm:w-auto"
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${syncingPayouts ? "animate-spin" : ""}`}
                            />
                            {syncingPayouts ? "Syncing…" : "Sync now"}
                        </Button>
                    </div>

                    {/* Desktop / tablet: real table. */}
                    <div className="mt-4 hidden overflow-x-auto sm:mt-6 sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Settlement ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-6 text-center text-sm text-muted-foreground"
                                        >
                                            No payouts recorded yet. Once
                                            PayMongo sends a payout webhook — or
                                            you hit "Sync now" — settlements
                                            will show up here.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {payouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="font-medium">
                                            {payout.id.toUpperCase()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatSettlementDate(
                                                payout.created_at,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatAmount(
                                                payout.amount,
                                                payout.currency,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                                                {payout.bank_name ??
                                                    "Bank transfer"}
                                                {payout.account_last4 && (
                                                    <span className="text-muted-foreground">
                                                        ••••{" "}
                                                        {payout.account_last4}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    payoutStatusStyles[
                                                        payout.status
                                                    ]
                                                }
                                            >
                                                {
                                                    payoutStatusLabels[
                                                        payout.status
                                                    ]
                                                }
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile: stacked cards instead of a squeezed 5-column
                        table. */}
                    <div className="mt-3 sm:hidden">
                        {payouts.length === 0 ? (
                            <p className="py-8 text-center text-[12px] text-muted-foreground">
                                No payouts recorded yet. Once PayMongo sends a
                                payout webhook — or you hit "Sync now" —
                                settlements will show up here.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {payouts.map((payout) => (
                                    <li key={payout.id} className="py-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-semibold text-foreground">
                                                    {payout.id.toUpperCase()}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {formatSettlementDate(
                                                        payout.created_at,
                                                    )}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`shrink-0 text-[10px] ${payoutStatusStyles[payout.status]}`}
                                            >
                                                {
                                                    payoutStatusLabels[
                                                        payout.status
                                                    ]
                                                }
                                            </Badge>
                                        </div>
                                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <Landmark className="h-3 w-3" />
                                                {payout.bank_name ??
                                                    "Bank transfer"}
                                                {payout.account_last4 &&
                                                    ` •••• ${payout.account_last4}`}
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {formatAmount(
                                                    payout.amount,
                                                    payout.currency,
                                                )}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-3 sm:rounded-xl sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-[13px] font-semibold sm:text-lg">
                                    Transactions
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] sm:text-xs"
                                >
                                    {invoices.length}
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground sm:text-sm">
                                All payment activity across your workspace
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                                placeholder="Search by member or transaction"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    applyFilters({ search: e.target.value });
                                }}
                                className="w-full text-[13px] sm:w-64"
                            />
                            <Select
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value);
                                    applyFilters({ status: value });
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-36">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="paid">
                                        Successful
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="failed">
                                        Failed
                                    </SelectItem>
                                    <SelectItem value="refunded">
                                        Refunded
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Desktop / tablet: real table. */}
                    <div className="mt-4 hidden overflow-x-auto sm:mt-6 sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="w-8" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-6 text-center text-sm text-muted-foreground"
                                        >
                                            No transactions match your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {invoices.map((invoice) => (
                                    <TableRow
                                        key={invoice.id}
                                        className="cursor-pointer"
                                        onClick={() => setSelected(invoice)}
                                    >
                                        <TableCell>
                                            <div className="font-medium">
                                                {invoice.transaction_id}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {invoice.plan}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MemberAvatar
                                                    name={invoice.member}
                                                    avatar={
                                                        invoice.member_avatar
                                                    }
                                                    className="h-7 w-7"
                                                />
                                                {invoice.member}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {formatAmount(
                                                invoice.amount,
                                                invoice.currency,
                                            )}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {invoice.method}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    statusStyles[invoice.status]
                                                }
                                            >
                                                {statusLabels[invoice.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(invoice.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile: stacked cards instead of a squeezed 7-column
                        table. */}
                    <div className="mt-3 sm:hidden">
                        {invoices.length === 0 ? (
                            <p className="py-8 text-center text-[12px] text-muted-foreground">
                                No transactions match your search.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {invoices.map((invoice) => (
                                    <li
                                        key={invoice.id}
                                        onClick={() => setSelected(invoice)}
                                        className="py-2.5 active:bg-muted/40"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <MemberAvatar
                                                    name={invoice.member}
                                                    avatar={
                                                        invoice.member_avatar
                                                    }
                                                    className="h-7 w-7 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-[12px] font-medium text-foreground">
                                                        {invoice.member}
                                                    </p>
                                                    <p className="truncate text-[10px] text-muted-foreground">
                                                        {invoice.transaction_id}{" "}
                                                        · {invoice.plan}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        </div>
                                        <div className="mt-1.5 flex items-center justify-between">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] ${statusStyles[invoice.status]}`}
                                            >
                                                {statusLabels[invoice.status]}
                                            </Badge>
                                            <span className="text-[11px] font-medium text-foreground">
                                                {formatAmount(
                                                    invoice.amount,
                                                    invoice.currency,
                                                )}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[10px] text-muted-foreground capitalize">
                                            {invoice.method} ·{" "}
                                            {formatDate(invoice.created_at)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <Sheet
                open={!!selected}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <SheetContent>
                    {selected && (
                        <>
                            <SheetHeader>
                                <p className="text-xs uppercase text-muted-foreground">
                                    FitFlow admin
                                </p>
                                <SheetTitle>Transaction details</SheetTitle>
                            </SheetHeader>

                            <div className="mt-4 flex flex-col items-center gap-1 py-4">
                                <Badge
                                    variant="outline"
                                    className={statusStyles[selected.status]}
                                >
                                    {statusLabels[selected.status]}
                                </Badge>
                                <p className="text-2xl font-semibold">
                                    {formatAmount(
                                        selected.amount,
                                        selected.currency,
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDate(selected.created_at)}
                                </p>
                            </div>

                            <div className="space-y-3 border-t border-border pt-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Transaction ID
                                    </span>
                                    <span className="font-medium">
                                        {selected.transaction_id}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Member
                                    </span>
                                    <span className="font-medium">
                                        {selected.member}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Membership
                                    </span>
                                    <span className="font-medium">
                                        {selected.plan}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Amount
                                    </span>
                                    <span className="font-medium">
                                        {formatAmount(
                                            selected.amount,
                                            selected.currency,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Payment method
                                    </span>
                                    <span className="font-medium capitalize">
                                        {selected.method}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Webhook status
                                    </span>
                                    <span className="flex items-center gap-1 font-medium">
                                        {selected.webhook_status ===
                                        "verified" ? (
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        )}
                                        {selected.webhook_status === "verified"
                                            ? "Verified"
                                            : "Pending"}
                                    </span>
                                </div>
                            </div>

                            {selected.can_refund && (
                                <Button
                                    variant="destructive"
                                    className="mt-6 w-full"
                                    disabled={refunding}
                                    onClick={() => issueRefund(selected)}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {refunding
                                        ? "Issuing refund…"
                                        : "Issue a refund"}
                                </Button>
                            )}

                            {selected.status === "pending" && (
                                <div className="mt-6 space-y-3">
                                    <Button
                                        className="w-full"
                                        disabled={retrying}
                                        onClick={() => retryPayment(selected)}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        {retrying
                                            ? "Generating link…"
                                            : "Retry payment"}
                                    </Button>

                                    {flash?.retry_checkout_url && (
                                        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                                            <p className="text-muted-foreground">
                                                New checkout link ready — send
                                                this to the member to complete
                                                payment.
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Input
                                                    readOnly
                                                    value={
                                                        flash.retry_checkout_url
                                                    }
                                                    className="text-xs"
                                                    onFocus={(e) =>
                                                        e.target.select()
                                                    }
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyLink(
                                                            flash.retry_checkout_url!,
                                                        )
                                                    }
                                                >
                                                    {copied ? "Copied" : "Copy"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selected.status === "refunded" && (
                                <div className="mt-6 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                                    This transaction has been refunded.
                                </div>
                            )}
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

Payments.layout = {
    breadcrumbs: [
        {
            title: "Payments",
            href: dashboard(),
        },
    ],
};
