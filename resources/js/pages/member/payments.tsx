import { Head } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { CreditCard, Calendar } from "lucide-react";
import { dashboard } from "@/routes";

type PaymentStatus = "successful" | "failed" | "pending" | "refunded";

type Payment = {
    id: number;
    reference: string;
    method_key: "gcash" | "maya" | "card" | "other";
    method_label: string;
    amount: string;
    currency: string;
    status: PaymentStatus;
    date: string | null;
    year: number;
};

const TABS = [
    { key: "all", label: "All" },
    { key: "successful", label: "Successful" },
    { key: "failed", label: "Failed" },
    { key: "pending", label: "Pending" },
    { key: "refunded", label: "Refunded" },
] as const;

const STATUS_STYLES: Record<PaymentStatus, string> = {
    successful:
        "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    failed: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
    pending:
        "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    refunded:
        "bg-sky-50 text-sky-600 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
    successful: "Successful",
    failed: "Failed",
    pending: "Pending",
    refunded: "Refunded",
};

function MethodIcon({ payment }: { payment: Payment }) {
    if (payment.method_key === "gcash") {
        return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-semibold text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 sm:h-10 sm:w-10 sm:text-sm">
                G
            </div>
        );
    }

    if (payment.method_key === "maya") {
        return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 sm:h-10 sm:w-10 sm:text-sm">
                M
            </div>
        );
    }

    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 sm:h-10 sm:w-10">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
    );
}

export default function Payments({
    payments = [],
    years = [],
}: {
    payments: Payment[];
    years: number[];
}) {
    const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
    const [year, setYear] = useState<number | "all">(years[0] ?? "all");

    const filtered = useMemo(() => {
        return payments.filter((payment) => {
            const matchesYear = year === "all" || payment.year === year;
            const matchesTab = tab === "all" || payment.status === tab;

            return matchesYear && matchesTab;
        });
    }, [payments, tab, year]);

    return (
        <>
            <Head title="Payments" />

            <div className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-4 md:p-6">
                <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
                        Payments
                    </p>
                    <h1 className="mt-1 text-xl font-semibold tracking-tight sm:mt-2 sm:text-3xl">
                        Payment history
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                        A clear record of every membership payment in one place.
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card">
                    <div className="flex flex-col gap-3 border-b border-border px-3 pt-3 sm:gap-4 sm:px-6 sm:pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <nav className="-mx-3 flex gap-4 overflow-x-auto px-3 scrollbar-none sm:mx-0 sm:gap-6 sm:overflow-visible sm:px-0">
                            {TABS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setTab(item.key)}
                                    className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-xs transition-colors sm:pb-3 sm:text-sm ${
                                        tab === item.key
                                            ? "border-amber-500 text-foreground"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {years.length > 0 && (
                            <div className="relative mb-3 sm:mb-0">
                                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:h-4 sm:w-4" />
                                <select
                                    value={year}
                                    onChange={(event) =>
                                        setYear(
                                            event.target.value === "all"
                                                ? "all"
                                                : Number(event.target.value),
                                        )
                                    }
                                    className="w-full appearance-none rounded-lg border border-border bg-muted/40 py-1.5 pl-8 pr-7 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 sm:w-auto sm:py-2 sm:pl-9 sm:pr-8 sm:text-sm"
                                >
                                    <option value="all">All years</option>
                                    {years.map((value) => (
                                        <option key={value} value={value}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="px-4 py-12 text-center sm:px-6 sm:py-16">
                            <p className="text-xs font-medium sm:text-sm">
                                No payments to show
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                Payments matching this filter will appear here.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {filtered.map((payment) => (
                                <li
                                    key={payment.id}
                                    className="px-3 py-3 sm:px-6 sm:py-5"
                                >
                                    {/* Mobile: compact card layout */}
                                    <div className="flex items-start gap-3 sm:hidden">
                                        <MethodIcon payment={payment} />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="truncate text-[13px] font-medium text-amber-600 dark:text-amber-400">
                                                    {payment.method_label}
                                                </p>
                                                <p className="shrink-0 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                                                    ₱{payment.amount}
                                                </p>
                                            </div>

                                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                                {payment.date} ·{" "}
                                                {payment.reference}
                                            </p>

                                            <span
                                                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_STYLES[payment.status]}`}
                                            >
                                                <span className="h-1 w-1 rounded-full bg-current" />
                                                {STATUS_LABELS[payment.status]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Desktop / tablet: original row layout */}
                                    <div className="hidden items-center gap-4 sm:flex">
                                        <MethodIcon payment={payment} />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-amber-600 dark:text-amber-400">
                                                {payment.method_label}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                                {payment.date} ·{" "}
                                                {payment.reference}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5">
                                            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                ₱{payment.amount}
                                            </p>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[payment.status]}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                {STATUS_LABELS[payment.status]}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
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
