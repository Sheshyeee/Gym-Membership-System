import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    DollarSign,
    FileBarChart,
    ShoppingBag,
    TrendingDown,
    TrendingUp,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboard } from "@/routes";
import type {
    RevenueAnalyticsProps,
    RevenuePeriod,
} from "@/types/revenue-analytics";

const PERIODS: { value: RevenuePeriod; label: string }[] = [
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "Year" },
];

// Fallback palette so a plan without a valid hex color still gets a
// distinct, chart-safe color.
const PALETTE = [
    "#f97316",
    "#10b981",
    "#3b82f6",
    "#a855f7",
    "#ef4444",
    "#eab308",
];

function resolveColor(color: string | null, index: number): string {
    if (color && (color.startsWith("#") || color.startsWith("rgb"))) {
        return color;
    }
    return PALETTE[index % PALETTE.length];
}

function formatCurrency(minorUnits: number): string {
    const value = minorUnits / 100;
    return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function ChangeBadge({ pct, pill = false }: { pct: number; pill?: boolean }) {
    const isUp = pct >= 0;
    const Icon = isUp ? TrendingUp : TrendingDown;
    const color = isUp ? "text-emerald-500" : "text-red-500";
    const bg = isUp ? "bg-emerald-500/10" : "bg-red-500/10";

    return (
        <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${color} ${
                pill ? `rounded-md px-2 py-0.5 ${bg}` : ""
            }`}
        >
            <Icon className="size-3" />
            {Math.abs(pct).toFixed(1)}%
        </span>
    );
}

export default function RevenueAnalytics({
    period,
    stats,
    trend,
    revenueByPlan,
}: RevenueAnalyticsProps) {
    const [activePeriod, setActivePeriod] = useState<RevenuePeriod>(period);
    const [loading, setLoading] = useState(false);

    function handlePeriodChange(next: RevenuePeriod) {
        if (next === activePeriod || loading) return;
        setActivePeriod(next);
        setLoading(true);
        router.get(
            window.location.pathname,
            { period: next },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["period", "stats", "trend", "revenueByPlan"],
                onFinish: () => setLoading(false),
            },
        );
    }

    const maxPlanRevenue = Math.max(...revenueByPlan.map((p) => p.revenue), 1);

    return (
        <>
            <Head title="Revenue Analytics" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="mt-1.5 size-2 rounded-full bg-emerald-500" />
                        <div>
                            <p className="text-xs font-medium text-emerald-500">
                                Live workspace
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Revenue Analytics
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Understand growth, retention, and financial
                                performance.
                            </p>
                        </div>
                    </div>
                    <Button className="gap-2">
                        <FileBarChart className="size-4" />
                        Create report
                    </Button>
                </div>

                <div className="inline-flex w-fit rounded-lg border bg-card p-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => handlePeriodChange(p.value)}
                            disabled={loading}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                                activePeriod === p.value
                                    ? "bg-orange-500/10 text-orange-500"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                                <DollarSign className="size-4" />
                            </span>
                            <p className="text-sm text-muted-foreground">
                                Total revenue
                            </p>
                        </div>
                        <p className="mt-3 text-2xl font-semibold text-foreground">
                            {formatCurrency(stats.totalRevenue.value)}
                        </p>
                        <div className="mt-1">
                            <ChangeBadge pct={stats.totalRevenue.changePct} />
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                <ShoppingBag className="size-4" />
                            </span>
                            <p className="text-sm text-muted-foreground">
                                Average order value
                            </p>
                        </div>
                        <p className="mt-3 text-2xl font-semibold text-foreground">
                            {formatCurrency(stats.averageOrderValue.value)}
                        </p>
                        <div className="mt-1">
                            <ChangeBadge
                                pct={stats.averageOrderValue.changePct}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                <Users className="size-4" />
                            </span>
                            <p className="text-sm text-muted-foreground">
                                New members
                            </p>
                        </div>
                        <p className="mt-3 text-2xl font-semibold text-foreground">
                            {stats.newMembers.value}
                        </p>
                        <div className="mt-1">
                            <ChangeBadge pct={stats.newMembers.changePct} />
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border bg-card p-6 lg:col-span-2">
                        <h2 className="text-sm font-semibold text-foreground">
                            Revenue trend
                        </h2>
                        <p className="text-xs text-muted-foreground capitalize">
                            {activePeriod}ly
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-2xl font-semibold text-foreground">
                                {formatCurrency(stats.totalRevenue.value)}
                            </span>
                            <ChangeBadge
                                pct={stats.totalRevenue.changePct}
                                pill
                            />
                        </div>

                        <div className="mt-4 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend}>
                                    <defs>
                                        <linearGradient
                                            id="currentFill"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#f97316"
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#f97316"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(v) =>
                                            formatCurrency(v).replace("₱", "")
                                        }
                                        width={48}
                                    />
                                    <Tooltip
                                        formatter={(value) =>
                                            formatCurrency(Number(value))
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="current"
                                        name="This period"
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        fill="url(#currentFill)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="previous"
                                        name="Previous period"
                                        stroke="#94a3b8"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 4"
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-6">
                        <h2 className="text-sm font-semibold text-foreground">
                            Revenue by plan
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Current period
                        </p>

                        <div className="mt-5 flex flex-col gap-5">
                            {revenueByPlan.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No paid invoices in this period yet.
                                </p>
                            )}
                            {revenueByPlan.map((plan, index) => {
                                const color = resolveColor(plan.color, index);
                                const widthPct = Math.max(
                                    (plan.revenue / maxPlanRevenue) * 100,
                                    4,
                                );
                                return (
                                    <div key={plan.id}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-foreground">
                                                {plan.name}
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {formatCurrency(plan.revenue)}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${widthPct}%`,
                                                    backgroundColor: color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
                            <span className="text-muted-foreground">
                                Total recurring revenue
                            </span>
                            <span className="font-semibold text-foreground">
                                {formatCurrency(stats.totalRevenue.value)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

RevenueAnalytics.layout = {
    breadcrumbs: [{ title: "Revenue Analytics", href: dashboard() }],
};
