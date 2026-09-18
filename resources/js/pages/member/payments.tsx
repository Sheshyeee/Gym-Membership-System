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
    { key: "all", label: "All payments" },
    { key: "successful", label: "Successful" },
    { key: "failed", label: "Failed" },
    { key: "pending", label: "Pending" },
    { key: "refunded", label: "Refunded" },
] as const;

const STATUS_STYLES: Record<PaymentStatus, string> = {
    successful: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    failed: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    pending: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    refunded: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sm font-semibold text-sky-400">
                G
            </div>
        );
    }

    if (payment.method_key === "maya") {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">
                M
            </div>
        );
    }

    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <CreditCard className="h-5 w-5" />
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

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Payments
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Payment history
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        A clear record of every membership payment in one place.
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card">
                    <div className="flex flex-col gap-4 border-b border-border px-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <nav className="flex gap-6">
                            {TABS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setTab(item.key)}
                                    className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${
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
                                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <select
                                    value={year}
                                    onChange={(event) =>
                                        setYear(
                                            event.target.value === "all"
                                                ? "all"
                                                : Number(event.target.value),
                                        )
                                    }
                                    className="appearance-none rounded-lg border border-border bg-muted/40 py-2 pl-9 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40"
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
                        <div className="px-6 py-16 text-center">
                            <p className="text-sm font-medium">
                                No payments to show
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Payments matching this filter will appear here.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {filtered.map((payment) => (
                                <li
                                    key={payment.id}
                                    className="flex items-center gap-4 px-6 py-5"
                                >
                                    <MethodIcon payment={payment} />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-amber-400">
                                            {payment.method_label}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                            {payment.date} · {payment.reference}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        <p className="text-sm font-semibold text-amber-400">
                                            ₱{payment.amount}
                                        </p>
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[payment.status]}`}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            {STATUS_LABELS[payment.status]}
                                        </span>
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
