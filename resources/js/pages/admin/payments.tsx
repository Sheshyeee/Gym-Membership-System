import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ChevronRight, RefreshCw, ShieldCheck, Clock } from "lucide-react";
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

const statusStyles: Record<InvoiceStatus, string> = {
    paid: "bg-green-500/15 text-green-400 border-green-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    refunding: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
    expired: "bg-red-500/15 text-red-400 border-red-500/30",
    refunded: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const statusLabels: Record<InvoiceStatus, string> = {
    paid: "Successful",
    pending: "Pending",
    refunding: "Refunding",
    failed: "Failed",
    expired: "Expired",
    refunded: "Refunded",
};

function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export default function Payments({
    invoices,
    filters,
}: {
    invoices: InvoiceRow[];
    filters: { search: string; status: string };
}) {
    const { flash } = usePage<{ flash: PageFlash }>().props;
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const [selected, setSelected] = useState<InvoiceRow | null>(null);
    const [refunding, setRefunding] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [copied, setCopied] = useState(false);

    // inside Payments component, after existing state
    useEffect(() => {
        const hasTransient = invoices.some(
            (i) => i.status === "pending" || i.status === "refunding",
        );
        if (!hasTransient) return;

        const interval = setInterval(() => {
            router.reload({ only: ["invoices"] });
        }, 4000);

        return () => clearInterval(interval);
    }, [invoices]);

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

    return (
        <>
            <Head title="Payments" />

            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">
                                Transactions
                            </h1>
                            <Badge variant="secondary">{invoices.length}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            All payment activity across your workspace
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search by member or transaction"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters({ search: e.target.value });
                            }}
                            className="w-64"
                        />
                        <Select
                            value={status}
                            onValueChange={(value) => {
                                setStatus(value);
                                applyFilters({ status: value });
                            }}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="paid">Successful</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="refunded">
                                    Refunded
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Table className="mt-6">
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
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                            {initials(invoice.member)}
                                        </div>
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
                                        className={statusStyles[invoice.status]}
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
                                            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                                        ) : (
                                            <Clock className="h-3.5 w-3.5 text-amber-400" />
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

                            {(selected.status === "pending" ||
                                selected.status === "failed") && (
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
