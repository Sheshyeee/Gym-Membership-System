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
            className={`inline-flex items-center gap-1 text-[10px] font-medium sm:text-xs ${color} ${
                pill ? `rounded-md px-1.5 py-0.5 sm:px-2 ${bg}` : ""
            }`}
        >
            <Icon className="size-3" />
            {Math.abs(pct).toFixed(1)}%
        </span>
    );
}

// Compact 3-up stat card. Kept in a fixed grid-cols-3 at every breakpoint
// (rather than stacking full-width on mobile) so it reads as a tight card
// row on phones instead of three oversized blocks.
function StatCard({
    icon,
    iconBg,
    iconColor,
    label,
    value,
    changePct,
}: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    label: string;
    value: string;
    changePct: number;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-3 sm:rounded-xl sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
                <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-9 ${iconBg} ${iconColor}`}
                >
                    {icon}
                </span>
                <p className="truncate text-[10px] text-muted-foreground sm:text-sm">
                    {label}
                </p>
            </div>
            <p className="mt-2 truncate text-base leading-tight font-semibold text-foreground sm:mt-3 sm:text-2xl">
                {value}
            </p>
            <div className="mt-1">
                <ChangeBadge pct={changePct} />
            </div>
        </div>
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

            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-3 p-2.5 sm:gap-6 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500 sm:size-2" />
                        <div>
                            <p className="text-[10px] font-medium text-emerald-500 sm:text-xs">
                                Live workspace
                            </p>
                            <h1 className="mt-1 text-lg font-semibold text-foreground sm:text-2xl">
                                Revenue Analytics
                            </h1>
                            <p className="mt-1 text-[12px] text-muted-foreground sm:text-sm">
                                Understand growth, retention, and financial
                                performance.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="scrollbar-none -mx-2.5 flex w-fit gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 px-2.5 sm:mx-0 sm:px-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => handlePeriodChange(p.value)}
                            disabled={loading}
                            className={`shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-sm ${
                                activePeriod === p.value
                                    ? "bg-orange-500/10 text-orange-500"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <StatCard
                        icon={<DollarSign className="size-3.5 sm:size-4" />}
                        iconBg="bg-orange-500/10"
                        iconColor="text-orange-500"
                        label="Total revenue"
                        value={formatCurrency(stats.totalRevenue.value)}
                        changePct={stats.totalRevenue.changePct}
                    />
                    <StatCard
                        icon={<ShoppingBag className="size-3.5 sm:size-4" />}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-500"
                        label="Avg. order value"
                        value={formatCurrency(stats.averageOrderValue.value)}
                        changePct={stats.averageOrderValue.changePct}
                    />
                    <StatCard
                        icon={<Users className="size-3.5 sm:size-4" />}
                        iconBg="bg-emerald-500/10"
                        iconColor="text-emerald-500"
                        label="New members"
                        value={String(stats.newMembers.value)}
                        changePct={stats.newMembers.changePct}
                    />
                </div>

                {/* items-stretch (default) makes both cards match the taller
                    one's height on desktop. The plan-breakdown card is laid
                    out as flex flex-col with its footer pushed to mt-auto,
                    so when it's stretched taller than its own content it
                    doesn't leave a dead gap above the footer — the footer
                    slides down to the bottom edge instead. */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-card p-3 sm:rounded-xl sm:p-6 lg:col-span-2">
                        <h2 className="text-[12px] font-semibold text-foreground sm:text-sm">
                            Revenue trend
                        </h2>
                        <p className="text-[10px] text-muted-foreground capitalize sm:text-xs">
                            {activePeriod}ly
                        </p>

                        <div className="mt-3 flex items-center gap-2 sm:mt-4 sm:gap-3">
                            <span className="text-lg font-semibold text-foreground sm:text-2xl">
                                {formatCurrency(stats.totalRevenue.value)}
                            </span>
                            <ChangeBadge
                                pct={stats.totalRevenue.changePct}
                                pill
                            />
                        </div>

                        <div className="mt-3 h-52 sm:mt-4 sm:h-64">
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
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) =>
                                            formatCurrency(v).replace("₱", "")
                                        }
                                        width={40}
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

                    <div className="flex flex-col rounded-2xl border border-border bg-card p-3 sm:rounded-xl sm:p-6">
                        <h2 className="text-[12px] font-semibold text-foreground sm:text-sm">
                            Revenue by plan
                        </h2>
                        <p className="text-[10px] text-muted-foreground sm:text-xs">
                            Current period
                        </p>

                        {revenueByPlan.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center py-8 text-center">
                                <p className="text-[12px] text-muted-foreground sm:text-sm">
                                    No paid invoices in this period yet.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 flex flex-1 flex-col gap-4 sm:mt-5 sm:gap-5">
                                {revenueByPlan.map((plan, index) => {
                                    const color = resolveColor(
                                        plan.color,
                                        index,
                                    );
                                    const widthPct = Math.max(
                                        (plan.revenue / maxPlanRevenue) * 100,
                                        4,
                                    );
                                    return (
                                        <div key={plan.id}>
                                            <div className="flex items-center justify-between text-[12px] sm:text-sm">
                                                <span className="truncate font-medium text-foreground">
                                                    {plan.name}
                                                </span>
                                                <span className="shrink-0 font-medium text-foreground">
                                                    {formatCurrency(
                                                        plan.revenue,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted sm:h-2">
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
                        )}

                        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[12px] sm:pt-4 sm:text-sm">
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
