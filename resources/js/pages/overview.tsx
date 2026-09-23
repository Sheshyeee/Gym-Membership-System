import { Head, Link } from "@inertiajs/react";
import {
    ArrowDownLeft,
    CircleDollarSign,
    Dumbbell,
    type LucideIcon,
    ShieldCheck,
    Users,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    Pie,
    PieChart,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { overview } from "@/routes";

// ---------------------------------------------------------------------------
// Types (match the shape returned by OverviewController@index)
// ---------------------------------------------------------------------------

interface OverviewProps {
    stats: {
        monthlyRevenue: number;
        monthlyRevenueGrowth: number | null;
        activeMembers: number;
        activeMembersGrowth: number | null;
        paymentSuccessRate: number;
        paymentSuccessGrowth: number | null;
    };
    revenuePerformance: {
        month: string;
        revenue: number | null;
        lastYear: number;
    }[];
    memberActivity: {
        total: number;
        breakdown: { label: string; value: number; percent: number }[];
    };
    retentionHealth: {
        rate: number;
        change: number;
        label: string;
        status: "healthy" | "warning" | "risk" | "neutral";
    };
    attendanceOverview: {
        checkInsToday: number;
        checkInsGrowth: number;
        peakHour: string | null;
        week: { label: string; count: number; isToday: boolean }[];
    };
    liveFinancialActivity: {
        id: number;
        user: string | null;
        plan: string | null;
        billingCycle: string | null;
        amount: number;
        currency: string;
        paidAt: string | null;
    }[];
}

const DONUT_COLORS: Record<string, string> = {
    Active: "#f97316",
    Expiring: "#eab308",
    Expired: "#52525b",
};

// Live financial activity is capped to roughly this many rows so its card
// naturally lands close to Member Activity's height (donut + legend) —
// see the note on the bottom row below for why this matters.
const MAX_FINANCIAL_ACTIVITY_ROWS = 4;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function formatCompact(value: number) {
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return `${value}`;
}

function GrowthBadge({
    growth,
    suffix = "",
}: {
    growth: number | null;
    suffix?: string;
}) {
    if (growth === null) {
        return (
            <span className="text-muted-foreground text-[10px] font-medium sm:text-[11px]">
                New
            </span>
        );
    }

    const isPositive = growth >= 0;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums sm:text-[11px]",
                isPositive ? "text-emerald-500" : "text-red-500",
            )}
        >
            {isPositive ? "↗" : "↘"} {Math.abs(growth)}%{suffix}
        </span>
    );
}

function timeAgo(dateString: string | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) {
        return `Today, ${date.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
        })}`;
    }

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

// ---------------------------------------------------------------------------
// Shared card shell
//
// Cards deliberately size themselves to their own content. Avoid h-full,
// flex-1, auto-rows-fr and other rules that make unrelated cards inherit
// the height of the tallest card beside them — except where a grid row is
// specifically meant to keep two cards height-matched (see the bottom row
// in the page layout below), in which case the default grid stretch is
// left in place on purpose.
// ---------------------------------------------------------------------------

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
                "border-sidebar-border/70 dark:border-sidebar-border bg-card flex flex-col rounded-2xl border p-3 sm:rounded-xl sm:p-4",
                className,
            )}
        >
            {children}
        </div>
    );
}

function PanelHeader({
    title,
    subtitle,
    action,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="mb-2.5 flex items-start justify-between gap-2 sm:mb-3">
            <div>
                <h2 className="text-[12px] font-semibold leading-none sm:text-[13px]">
                    {title}
                </h2>
                {subtitle && (
                    <span className="mt-1 block text-[10px] font-medium text-orange-500/90 sm:text-[11px] dark:text-orange-400/80">
                        {subtitle}
                    </span>
                )}
            </div>
            {action}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HeroCard({
    checkInsToday,
    paymentSuccessRate,
}: {
    checkInsToday: number;
    paymentSuccessRate: number;
}) {
    const today = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    return (
        <Panel className="relative justify-between gap-3 overflow-hidden xl:col-span-2">
            <Dumbbell
                className="pointer-events-none absolute -right-6 -bottom-6 size-24 rotate-12 text-orange-500/10 sm:size-28 dark:text-orange-400/10"
                strokeWidth={1.5}
            />

            <div className="relative flex flex-col gap-1.5 sm:gap-2">
                <span className="text-muted-foreground text-[10px] sm:text-[11px]">
                    {today}
                </span>
                <h1 className="text-lg leading-snug font-semibold tracking-tight sm:text-xl">
                    Run your gym at full strength
                </h1>
                <p className="text-muted-foreground max-w-sm text-[12px] leading-relaxed sm:text-[13px]">
                    Everything is looking healthy today — check-ins and payments
                    are both tracking above last week.
                </p>
            </div>

            <div className="relative -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 pb-0.5 sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0">
                <Link
                    href="/members"
                    className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-90 sm:px-3.5 sm:py-2 sm:text-[13px]"
                >
                    View members
                    <span aria-hidden>›</span>
                </Link>
                <span className="border-sidebar-border/70 dark:border-sidebar-border text-muted-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] sm:px-2.5 sm:py-1.5 sm:text-[11px]">
                    <Dumbbell className="size-3 text-orange-500 sm:size-3.5" />
                    {checkInsToday} check-ins today
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-500 sm:px-2.5 sm:py-1.5 sm:text-[11px]">
                    {paymentSuccessRate}% payment success
                </span>
            </div>
        </Panel>
    );
}

// Restructured so the card's content spreads across whatever height the
// grid gives it (label+icon pinned to the top, value+growth pinned to the
// bottom via justify-between) instead of being centered as one small block
// in the middle — which is what happened when this row stretched every
// card to match the taller HeroCard beside it, but only vertically centered
// a compact row of content inside that extra height.
function StatCard({
    icon: Icon,
    iconClassName,
    label,
    value,
    growth,
}: {
    icon: LucideIcon;
    iconClassName?: string;
    label: string;
    value: string;
    growth: number | null;
}) {
    return (
        <Panel className="justify-between">
            <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground text-[10px] sm:text-[11px]">
                    {label}
                </span>
                <div
                    className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md sm:size-9",
                        iconClassName ??
                            "bg-orange-500/10 text-orange-500 dark:text-orange-400",
                    )}
                >
                    <Icon className="size-3.5 sm:size-4" />
                </div>
            </div>
            <div className="mt-2 flex flex-col gap-1">
                <span className="text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
                    {value}
                </span>
                <GrowthBadge growth={growth} />
            </div>
        </Panel>
    );
}

function RevenueChart({
    data,
    total,
    growth,
}: {
    data: { month: string; revenue: number | null; lastYear: number }[];
    total: number;
    growth: number | null;
}) {
    return (
        <Panel>
            <PanelHeader title="Revenue performance" subtitle="This year" />

            <div className="mb-2 flex items-baseline gap-2">
                <span className="text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
                    ₱{total.toLocaleString()}
                </span>
                <GrowthBadge growth={growth} suffix=" vs last month" />
            </div>

            <div className="h-36 w-full sm:h-44 lg:h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="revenueFill"
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
                        <CartesianGrid vertical={false} strokeOpacity={0.1} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 10,
                                fill: "currentColor",
                                opacity: 0.5,
                            }}
                            interval="preserveStartEnd"
                            minTickGap={16}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 9.5,
                                fill: "currentColor",
                                opacity: 0.5,
                            }}
                            tickFormatter={formatCompact}
                            width={30}
                        />
                        <Tooltip
                            formatter={(value, name) => [
                                `₱${Number(value ?? 0).toLocaleString()}`,
                                name === "revenue" ? "This year" : "Last year",
                            ]}
                            contentStyle={{
                                background: "var(--color-card, #1a1a1a)",
                                border: "1px solid rgba(128,128,128,0.2)",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="lastYear"
                            stroke="currentColor"
                            strokeOpacity={0.3}
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            dot={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#f97316"
                            strokeWidth={2}
                            fill="url(#revenueFill)"
                            connectNulls
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Panel>
    );
}

function AttendanceOverview({
    checkInsToday,
    checkInsGrowth,
    peakHour,
    week,
}: {
    checkInsToday: number;
    checkInsGrowth: number | null;
    peakHour: string | null;
    week: { label: string; count: number; isToday: boolean }[];
}) {
    return (
        <Panel>
            <PanelHeader title="Attendance overview" subtitle="Today" />

            <div className="mb-2 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-[10px] sm:text-[11px]">
                        Check-ins
                    </span>
                    <span className="text-base font-semibold tabular-nums sm:text-lg">
                        {checkInsToday}
                    </span>
                    <GrowthBadge growth={checkInsGrowth} />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-[10px] sm:text-[11px]">
                        Peak hours
                    </span>
                    <span className="text-base font-semibold tabular-nums sm:text-lg">
                        {peakHour ?? "—"}
                    </span>
                    {peakHour && (
                        <span className="text-[10px] font-medium text-orange-500 sm:text-[11px] dark:text-orange-400">
                            Highest traffic
                        </span>
                    )}
                </div>
            </div>

            <div className="h-12 w-full sm:h-14">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={week}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 9.5,
                                fill: "currentColor",
                                opacity: 0.5,
                            }}
                        />
                        <Tooltip
                            cursor={{ fill: "currentColor", opacity: 0.05 }}
                            formatter={(value) => [
                                `${Number(value ?? 0)}`,
                                "Check-ins",
                            ]}
                            contentStyle={{
                                background: "var(--color-card, #1a1a1a)",
                                border: "1px solid rgba(128,128,128,0.2)",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[3, 3, 0, 0]}
                            maxBarSize={16}
                        >
                            {week.map((day) => (
                                <Cell
                                    key={day.label}
                                    fill={
                                        day.isToday ? "#f97316" : "currentColor"
                                    }
                                    fillOpacity={day.isToday ? 1 : 0.25}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <Link
                href="/attendance"
                className="border-sidebar-border/70 dark:border-sidebar-border text-muted-foreground hover:text-foreground mt-2 flex w-full items-center justify-center gap-1 rounded-md border py-1.5 text-[10px] font-medium transition-colors sm:text-[11px]"
            >
                View attendance analytics
                <span aria-hidden>›</span>
            </Link>
        </Panel>
    );
}

const RETENTION_STATUS_STYLES: Record<string, { badge: string; bar: string }> =
    {
        healthy: {
            badge: "bg-emerald-500/10 text-emerald-500",
            bar: "#10b981",
        },
        warning: { badge: "bg-amber-500/10 text-amber-500", bar: "#eab308" },
        risk: { badge: "bg-red-500/10 text-red-500", bar: "#ef4444" },
        neutral: { badge: "bg-muted text-muted-foreground", bar: "#71717a" },
    };

function RetentionGauge({
    rate,
    change,
    label,
    status,
}: {
    rate: number;
    change: number;
    label: string;
    status: "healthy" | "warning" | "risk" | "neutral";
}) {
    const styles =
        RETENTION_STATUS_STYLES[status] ?? RETENTION_STATUS_STYLES.neutral;
    const data = [{ name: "retention", value: rate, fill: styles.bar }];

    return (
        <Panel>
            <PanelHeader title="Retention health" subtitle="Monthly" />

            {status === "neutral" ? (
                <div className="flex min-h-12 flex-col items-center justify-center gap-1 py-1 text-center">
                    <span className="text-xl font-semibold tabular-nums opacity-30">
                        —
                    </span>
                    <span className="text-muted-foreground max-w-[22ch] text-[10px] leading-snug sm:text-[11px]">
                        Not enough data yet to calculate retention
                    </span>
                </div>
            ) : (
                <div className="relative h-14 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            data={data}
                            startAngle={180}
                            endAngle={0}
                            innerRadius="70%"
                            outerRadius="100%"
                            cx="50%"
                            cy="100%"
                            barSize={12}
                        >
                            <RadialBar
                                dataKey="value"
                                cornerRadius={6}
                                background={{
                                    fill: "currentColor",
                                    fillOpacity: 0.08,
                                }}
                                max={100}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
                        <span className="text-lg font-semibold tabular-nums">
                            {rate}
                        </span>
                        <span className="text-muted-foreground text-[8px]">
                            member retention
                        </span>
                    </div>
                </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
                {status === "neutral" ? (
                    <span className="text-muted-foreground text-[10px] sm:text-[11px]">
                        Check back after 30 days
                    </span>
                ) : (
                    <GrowthBadge growth={change} suffix=" vs last quarter" />
                )}
                <span
                    className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-[11px]",
                        styles.badge,
                    )}
                >
                    {label}
                </span>
            </div>
        </Panel>
    );
}

// className passthrough so this can be given h-full/flex-1 by the bottom
// row of the page layout, where it's paired with Live Financial Activity
// and the two are meant to match height.
function MemberActivityDonut({
    total,
    breakdown,
    className,
}: {
    total: number;
    breakdown: { label: string; value: number; percent: number }[];
    className?: string;
}) {
    return (
        <Panel className={cn("justify-center", className)}>
            <PanelHeader title="Member activity" subtitle="Current status" />

            <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative size-20 shrink-0 sm:size-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={breakdown}
                                dataKey="value"
                                nameKey="label"
                                innerRadius="70%"
                                outerRadius="100%"
                                paddingAngle={breakdown.length > 1 ? 3 : 0}
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                            >
                                {breakdown.map((segment) => (
                                    <Cell
                                        key={segment.label}
                                        fill={
                                            DONUT_COLORS[segment.label] ??
                                            "#71717a"
                                        }
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-semibold tabular-nums sm:text-base">
                            {total.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground text-[8px]">
                            Total
                        </span>
                    </div>
                </div>

                <ul className="flex flex-1 flex-col gap-1.5">
                    {breakdown.map((segment) => (
                        <li
                            key={segment.label}
                            className="flex items-center justify-between text-[11px] sm:text-[12px]"
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className="size-2 rounded-full"
                                    style={{
                                        backgroundColor:
                                            DONUT_COLORS[segment.label] ??
                                            "#71717a",
                                    }}
                                />
                                <span className="text-muted-foreground">
                                    {segment.label}
                                </span>
                            </span>
                            <span className="font-medium tabular-nums">
                                {segment.percent}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </Panel>
    );
}

// className passthrough for the same reason as MemberActivityDonut above.
// The list itself is capped to MAX_FINANCIAL_ACTIVITY_ROWS so this card's
// natural (unstretched) height stays in the same ballpark as Member
// Activity's — that's what keeps the grid's height-matching from having to
// stretch either card by a large, obviously-empty amount. "View all" is
// there specifically so capping the list here doesn't lose access to the
// rest of the history.
function LiveFinancialActivity({
    items,
    className,
}: {
    items: OverviewProps["liveFinancialActivity"];
    className?: string;
}) {
    const visibleItems = items.slice(0, MAX_FINANCIAL_ACTIVITY_ROWS);

    return (
        <Panel className={className}>
            <PanelHeader
                title="Live financial activity"
                action={
                    <a
                        href="/payments"
                        className="text-[10px] font-medium text-orange-500 hover:underline sm:text-[11px] dark:text-orange-400"
                    >
                        View all
                    </a>
                }
            />

            <ul className="divide-sidebar-border/50 dark:divide-sidebar-border/50 flex flex-1 flex-col justify-center divide-y">
                {visibleItems.length === 0 && (
                    <li className="text-muted-foreground py-8 text-center text-[12px]">
                        No payments yet
                    </li>
                )}

                {visibleItems.map((item) => (
                    <li
                        key={item.id}
                        className="hover:bg-accent flex items-center justify-between gap-3 rounded-md px-1 py-2 transition-colors sm:py-2.5"
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 sm:size-7">
                                <ArrowDownLeft className="size-3 sm:size-3.5" />
                            </span>
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-[12px] font-medium sm:text-[13px]">
                                    {item.user ?? "Unknown member"}
                                </span>
                                <span className="text-muted-foreground truncate text-[10px] sm:text-[11px]">
                                    {item.plan ?? "Membership"}
                                    {item.billingCycle
                                        ? ` · ${item.billingCycle}`
                                        : ""}{" "}
                                    · {timeAgo(item.paidAt)}
                                </span>
                            </div>
                        </div>
                        <span className="shrink-0 text-[12px] font-medium tabular-nums sm:text-[13px]">
                            ₱{item.amount.toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

// ---------------------------------------------------------------------------
// Page layout
//
// Two independent grid rows share the same two-column template, so the
// columns line up visually as one continuous stack even though each row
// aligns its own cards independently:
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │ Hero │ Revenue KPI │ Members KPI │ Payment KPI               │
//   ├──────────────────────────────────────┬─────────────────────  ┤
//   │ Revenue performance                   │ Attendance overview  │  <- row A: items-start,
//   │                                        ├─────────────────────┤     each column sized to
//   │                                        │ Retention health    │     its own content
//   ├──────────────────────────────────────┬─────────────────────  ┤
//   │ Live financial activity               │ Member activity     │  <- row B: items-stretch,
//   │                                        │                     │     these two are matched
//   └──────────────────────────────────────┴─────────────────────  ┘     to the same height
//
// Row B is deliberately its own grid (not just "more content in the same
// column stack") so it can stretch Live Financial Activity and Member
// Activity to match each other without also pulling Revenue Performance or
// Attendance/Retention into that height calculation.
// ---------------------------------------------------------------------------

export default function Overview({
    stats,
    revenuePerformance,
    memberActivity,
    retentionHealth,
    attendanceOverview,
    liveFinancialActivity,
}: OverviewProps) {
    const totalRevenue = revenuePerformance.reduce(
        (sum, point) => sum + (point.revenue ?? 0),
        0,
    );

    return (
        <>
            <Head title="Overview" />

            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 p-3 sm:gap-5 sm:p-4 lg:p-5 xl:p-6">
                {/* =========================================================
                    TOP SUMMARY
                    ========================================================= */}

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
                    <HeroCard
                        checkInsToday={attendanceOverview.checkInsToday}
                        paymentSuccessRate={stats.paymentSuccessRate}
                    />

                    <StatCard
                        icon={CircleDollarSign}
                        label="Monthly revenue"
                        value={`₱${stats.monthlyRevenue.toLocaleString()}`}
                        growth={stats.monthlyRevenueGrowth}
                    />

                    <StatCard
                        icon={Users}
                        iconClassName="bg-blue-500/10 text-blue-500 dark:text-blue-400"
                        label="Active members"
                        value={stats.activeMembers.toLocaleString()}
                        growth={stats.activeMembersGrowth}
                    />

                    <StatCard
                        icon={ShieldCheck}
                        iconClassName="bg-emerald-500/10 text-emerald-500"
                        label="Payment success"
                        value={`${stats.paymentSuccessRate}%`}
                        growth={stats.paymentSuccessGrowth}
                    />
                </section>

                {/* =========================================================
                    ROW A — Revenue performance | Attendance + Retention

                    items-start: each column sizes to its own content. The
                    right column is naturally shorter than the revenue
                    chart, and that's fine here — nothing below depends on
                    these two matching height.
                    ========================================================= */}

                <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]">
                    <RevenueChart
                        data={revenuePerformance}
                        total={totalRevenue}
                        growth={stats.monthlyRevenueGrowth}
                    />

                    <div className="flex min-w-0 flex-col gap-4">
                        <AttendanceOverview
                            checkInsToday={attendanceOverview.checkInsToday}
                            checkInsGrowth={attendanceOverview.checkInsGrowth}
                            peakHour={attendanceOverview.peakHour}
                            week={attendanceOverview.week}
                        />

                        <RetentionGauge
                            rate={retentionHealth.rate}
                            change={retentionHealth.change}
                            label={retentionHealth.label}
                            status={retentionHealth.status}
                        />
                    </div>
                </section>

                {/* =========================================================
                    ROW B — Live financial activity | Member activity

                    Same column template as Row A so the page still reads as
                    two continuous columns, but this is a separate grid with
                    the default items-stretch: Live Financial Activity and
                    Member Activity are the two cards meant to match height,
                    so they — and only they — stretch to each other here.
                    ========================================================= */}

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]">
                    <LiveFinancialActivity
                        items={liveFinancialActivity}
                        className="h-full"
                    />

                    <MemberActivityDonut
                        total={memberActivity.total}
                        breakdown={memberActivity.breakdown}
                        className="h-full"
                    />
                </section>
            </div>
        </>
    );
}

Overview.layout = {
    breadcrumbs: [
        {
            title: "Overview",
            href: overview(),
        },
    ],
};
