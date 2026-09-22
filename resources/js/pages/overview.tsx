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
        monthlyRevenueGrowth: number;
        activeMembers: number;
        activeMembersGrowth: number;
        paymentSuccessRate: number;
        paymentSuccessGrowth: number;
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
    retentionHealth: { rate: number; change: number; label: string };
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

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function formatCompact(value: number) {
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return `${value}`;
}

function timeAgo(dateString: string | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24)
        return `Today, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

// ---------------------------------------------------------------------------
// Sub-components (kept in this file on purpose)
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
        year: "numeric",
        month: "long",
        day: "2-digit",
    });

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 md:col-span-2">
            <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                    {today}
                </span>
                <h1 className="text-2xl leading-tight font-semibold tracking-tight md:text-3xl">
                    Run your gym{" "}
                    <span className="text-orange-500 dark:text-orange-400">
                        at full strength.
                    </span>
                </h1>
                <p className="text-muted-foreground max-w-sm text-sm">
                    Everything is looking healthy today. Keep the momentum
                    going.
                </p>
                <Link
                    href="/members"
                    className="bg-primary text-primary-foreground mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                >
                    View members
                    <span aria-hidden>›</span>
                </Link>
            </div>

            <div className="pointer-events-none absolute top-1/2 right-6 -translate-y-1/2">
                <div className="relative flex size-32 items-center justify-center rounded-full bg-orange-500/10">
                    <div className="absolute inset-2 rounded-full border border-orange-500/20" />
                    <Dumbbell className="size-10 text-orange-500 dark:text-orange-400" />
                </div>
                <span className="bg-card border-sidebar-border/70 dark:border-sidebar-border absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap shadow-sm">
                    {checkInsToday} check-ins
                </span>
            </div>

            <span className="absolute top-6 right-6 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
                {paymentSuccessRate}% success
            </span>
        </div>
    );
}

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
    growth: number;
}) {
    const isPositive = growth >= 0;

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card flex flex-1 flex-col gap-3 rounded-xl border p-4">
            <div
                className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    iconClassName ??
                        "bg-orange-500/10 text-orange-500 dark:text-orange-400",
                )}
            >
                <Icon className="size-4.5" />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="text-2xl font-semibold tracking-tight">
                    {value}
                </span>
            </div>
            <span
                className={cn(
                    "text-xs font-medium",
                    isPositive ? "text-emerald-500" : "text-red-500",
                )}
            >
                {isPositive ? "↗" : "↘"} {Math.abs(growth)}%
            </span>
        </div>
    );
}

function RevenueChart({
    data,
    total,
    growth,
}: {
    data: { month: string; revenue: number | null; lastYear: number }[];
    total: number;
    growth: number;
}) {
    const isPositive = growth >= 0;

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-4 md:col-span-2">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h2 className="text-sm font-medium">Revenue performance</h2>
                    <span className="text-muted-foreground text-xs">
                        This year
                    </span>
                </div>
            </div>

            <div className="mb-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                    ₱{total.toLocaleString()}
                </span>
                <span
                    className={
                        isPositive
                            ? "text-xs font-medium text-emerald-500"
                            : "text-xs font-medium text-red-500"
                    }
                >
                    {isPositive ? "↗" : "↘"} {Math.abs(growth)}% vs last month
                </span>
            </div>

            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 4, left: -20, bottom: 0 }}
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
                                fontSize: 11,
                                fill: "currentColor",
                                opacity: 0.5,
                            }}
                            interval={1}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 11,
                                fill: "currentColor",
                                opacity: 0.5,
                            }}
                            tickFormatter={formatCompact}
                            width={40}
                        />
                        <Tooltip
                            formatter={(value, name) => {
                                const numeric = Array.isArray(value)
                                    ? Number(value[0])
                                    : Number(value);
                                return [
                                    `₱${numeric.toLocaleString()}`,
                                    name === "revenue"
                                        ? "This year"
                                        : "Last year",
                                ];
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
        </div>
    );
}

function AttendanceOverview({
    checkInsToday,
    checkInsGrowth,
    peakHour,
    week,
}: {
    checkInsToday: number;
    checkInsGrowth: number;
    peakHour: string | null;
    week: { label: string; count: number; isToday: boolean }[];
}) {
    const isPositive = checkInsGrowth >= 0;

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-4">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h2 className="text-sm font-medium">Attendance overview</h2>
                    <span className="text-muted-foreground text-xs">Today</span>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">
                        Check-ins
                    </span>
                    <span className="text-xl font-semibold">
                        {checkInsToday}
                    </span>
                    <span
                        className={
                            isPositive
                                ? "text-xs font-medium text-emerald-500"
                                : "text-xs font-medium text-red-500"
                        }
                    >
                        {isPositive ? "↗" : "↘"} {Math.abs(checkInsGrowth)}%
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">
                        Peak hours
                    </span>
                    <span className="text-xl font-semibold">
                        {peakHour ?? "—"}
                    </span>
                    {peakHour && (
                        <span className="text-xs font-medium text-orange-500 dark:text-orange-400">
                            highest traffic
                        </span>
                    )}
                </div>
            </div>

            <div className="h-32 w-full">
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
                                fontSize: 11,
                                fill: "currentColor",
                                opacity: 0.5,
                            }}
                        />
                        <Tooltip
                            cursor={{ fill: "currentColor", opacity: 0.05 }}
                            formatter={(value) => {
                                const numeric = Array.isArray(value)
                                    ? value[0]
                                    : value;
                                return [`${numeric}`, "Check-ins"];
                            }}
                            contentStyle={{
                                background: "var(--color-card, #1a1a1a)",
                                border: "1px solid rgba(128,128,128,0.2)",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={22}
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
                className="border-sidebar-border/70 dark:border-sidebar-border text-muted-foreground hover:text-foreground mt-4 flex w-full items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium transition-colors"
            >
                View attendance analytics
                <span aria-hidden>›</span>
            </Link>
        </div>
    );
}

function MemberActivityDonut({
    total,
    breakdown,
}: {
    total: number;
    breakdown: { label: string; value: number; percent: number }[];
}) {
    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-4">
            <div className="mb-2 flex items-start justify-between">
                <div>
                    <h2 className="text-sm font-medium">Member activity</h2>
                    <span className="text-muted-foreground text-xs">
                        Last 7 days
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative h-32 w-32 shrink-0">
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
                        <span className="text-xl font-semibold">
                            {total.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                            Total members
                        </span>
                    </div>
                </div>

                <ul className="flex flex-1 flex-col gap-2.5">
                    {breakdown.map((segment) => (
                        <li
                            key={segment.label}
                            className="flex items-center justify-between text-xs"
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
                            <span className="font-medium">
                                {segment.percent}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function RetentionGauge({
    rate,
    change,
    label,
}: {
    rate: number;
    change: number;
    label: string;
}) {
    const isPositive = change >= 0;
    const data = [{ name: "retention", value: rate, fill: "#f97316" }];

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-4">
            <div className="mb-2 flex items-start justify-between">
                <div>
                    <h2 className="text-sm font-medium">Retention health</h2>
                    <span className="text-muted-foreground text-xs">
                        Monthly
                    </span>
                </div>
            </div>

            <div className="relative h-32 w-full">
                <ResponsiveContainer width="100%" height="200%">
                    <RadialBarChart
                        data={data}
                        startAngle={180}
                        endAngle={0}
                        innerRadius="140%"
                        outerRadius="200%"
                        cx="50%"
                        cy="65%"
                        barSize={16}
                    >
                        <RadialBar
                            dataKey="value"
                            cornerRadius={8}
                            background={{
                                fill: "currentColor",
                                fillOpacity: 0.08,
                            }}
                            max={100}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
                    <span className="text-2xl font-semibold">{rate}</span>
                    <span className="text-muted-foreground text-[10px]">
                        member retention
                    </span>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <span
                    className={
                        isPositive
                            ? "text-xs font-medium text-emerald-500"
                            : "text-xs font-medium text-red-500"
                    }
                >
                    {isPositive ? "↗" : "↘"} {Math.abs(change)}% vs last quarter
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                    {label}
                </span>
            </div>
        </div>
    );
}

function LiveFinancialActivity({
    items,
}: {
    items: OverviewProps["liveFinancialActivity"];
}) {
    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-medium">
                        Live financial activity
                    </h2>
                </div>
                <a
                    href="/payments"
                    className="text-xs font-medium text-orange-500 hover:underline dark:text-orange-400"
                >
                    View all
                </a>
            </div>

            <ul className="flex flex-col gap-1">
                {items.length === 0 && (
                    <li className="text-muted-foreground py-6 text-center text-xs">
                        No payments yet
                    </li>
                )}

                {items.map((item) => (
                    <li
                        key={item.id}
                        className="hover:bg-accent flex items-center justify-between rounded-lg px-1 py-2.5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                <ArrowDownLeft className="size-4" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {item.user ?? "Unknown member"}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {item.plan ?? "Membership"}
                                    {item.billingCycle
                                        ? ` · ${item.billingCycle}`
                                        : ""}{" "}
                                    · {timeAgo(item.paidAt)}
                                </span>
                            </div>
                        </div>
                        <span className="text-sm font-medium">
                            ₱{item.amount.toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Overview({
    stats,
    revenuePerformance,
    memberActivity,
    retentionHealth,
    attendanceOverview,
    liveFinancialActivity,
}: OverviewProps) {
    return (
        <>
            <Head title="Overview" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <HeroCard
                        checkInsToday={attendanceOverview.checkInsToday}
                        paymentSuccessRate={stats.paymentSuccessRate}
                    />
                    <div className="flex flex-col gap-4">
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
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        icon={ShieldCheck}
                        iconClassName="bg-emerald-500/10 text-emerald-500"
                        label="Payment success"
                        value={`${stats.paymentSuccessRate}%`}
                        growth={stats.paymentSuccessGrowth}
                    />
                    <RevenueChart
                        data={revenuePerformance}
                        total={revenuePerformance.reduce(
                            (sum, point) => sum + (point.revenue ?? 0),
                            0,
                        )}
                        growth={stats.monthlyRevenueGrowth}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <AttendanceOverview
                        checkInsToday={attendanceOverview.checkInsToday}
                        checkInsGrowth={attendanceOverview.checkInsGrowth}
                        peakHour={attendanceOverview.peakHour}
                        week={attendanceOverview.week}
                    />
                    <LiveFinancialActivity items={liveFinancialActivity} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <MemberActivityDonut
                        total={memberActivity.total}
                        breakdown={memberActivity.breakdown}
                    />
                    <RetentionGauge
                        rate={retentionHealth.rate}
                        change={retentionHealth.change}
                        label={retentionHealth.label}
                    />
                </div>
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
