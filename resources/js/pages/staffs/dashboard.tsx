import { Head, Link } from "@inertiajs/react";
import { Users, ShieldCheck, Flame, QrCode, XCircle } from "lucide-react";
import { dashboard } from "@/routes";
import { cn } from "@/lib/utils";

type Stats = {
    checkInsToday: { value: number; change: number; compareLabel: string };
    newMembersThisMonth: { value: number; change: number };
    activeMembers: { value: number };
    peakHours: string;
};

type DayPoint = { label: string; checkIns: number; denied: number };

type AttendanceOverview = {
    series: DayPoint[];
    totalCheckIns: number;
    totalDenied: number;
    changeVsLastWeek: number;
};

type ActivityItem = {
    id: number;
    name: string;
    initials: string;
    status: "success" | "denied";
    reason: string | null;
    method: string;
    time: string;
    isToday: boolean;
};

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

function StatCard({
    icon: Icon,
    iconClassName,
    label,
    value,
    change,
    changeLabel,
    neutral,
}: {
    icon: React.ElementType;
    iconClassName: string;
    label: string;
    value: string;
    change?: number;
    changeLabel?: string;
    neutral?: boolean;
}) {
    return (
        <Panel className="flex flex-col gap-2">
            <div
                className={cn(
                    "flex size-7 items-center justify-center rounded-md sm:size-8",
                    iconClassName,
                )}
            >
                <Icon className="size-3.5 sm:size-4" />
            </div>
            <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                    {label}
                </p>
                <p className="text-foreground text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
                    {value}
                </p>
                {neutral ? (
                    <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                        {changeLabel}
                    </p>
                ) : (
                    change !== undefined && (
                        <p
                            className={cn(
                                "text-[10px] font-medium sm:text-[11px]",
                                change >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500",
                            )}
                        >
                            {change >= 0 ? "↗" : "↘"} {Math.abs(change)}%{" "}
                            {changeLabel}
                        </p>
                    )
                )}
            </div>
        </Panel>
    );
}

export default function Dashboard({
    greeting,
    stats,
    attendanceOverview,
    liveActivity = [],
}: {
    greeting: { name: string; timeOfDay: string; dateLabel: string };
    stats: Stats;
    attendanceOverview: AttendanceOverview;
    liveActivity: ActivityItem[];
}) {
    const maxVal = Math.max(
        1,
        ...attendanceOverview.series.map((d) => Math.max(d.checkIns, d.denied)),
    );

    const toPoints = (key: "checkIns" | "denied") =>
        attendanceOverview.series
            .map((d, i) => {
                const x =
                    (i / Math.max(1, attendanceOverview.series.length - 1)) *
                    100;
                const y = 100 - (d[key] / maxVal) * 100;
                return `${x},${y}`;
            })
            .join(" ");

    const checkInPoints = toPoints("checkIns");
    const deniedPoints = toPoints("denied");

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 p-3 sm:gap-5 sm:p-4 lg:p-6">
                {/* Greeting */}
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-semibold tracking-widest text-orange-500 uppercase sm:text-[11px]">
                            {greeting.dateLabel}
                        </p>
                        <h1 className="text-foreground mt-1 text-lg font-semibold sm:text-xl">
                            Good {greeting.timeOfDay}, {greeting.name}
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-[12px]">
                            Here&apos;s what&apos;s happening at the front desk
                            today.
                        </p>
                    </div>

                    <Link
                        href="/staff/qr-checkin"
                        className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 self-start rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-opacity hover:opacity-90 sm:px-3.5 sm:py-2 sm:text-[13px]"
                    >
                        <QrCode className="size-3.5 sm:size-4" />
                        Scan member
                    </Link>
                </div>

                {/* Stat cards — 2x2 on mobile, 4 across from lg up */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                    <StatCard
                        icon={Users}
                        iconClassName="bg-orange-500/10 text-orange-500"
                        label="Today's check-ins"
                        value={stats.checkInsToday.value.toLocaleString()}
                        change={stats.checkInsToday.change}
                        changeLabel={`vs ${stats.checkInsToday.compareLabel}`}
                    />
                    <StatCard
                        icon={Users}
                        iconClassName="bg-emerald-500/10 text-emerald-500"
                        label="New members this month"
                        value={stats.newMembersThisMonth.value.toLocaleString()}
                        change={stats.newMembersThisMonth.change}
                        changeLabel="vs last month"
                    />
                    <StatCard
                        icon={ShieldCheck}
                        iconClassName="bg-blue-500/10 text-blue-500"
                        label="Active members"
                        value={stats.activeMembers.value.toLocaleString()}
                        neutral
                        changeLabel="Currently active"
                    />
                    <StatCard
                        icon={Flame}
                        iconClassName="bg-amber-500/10 text-amber-500"
                        label="Peak hours"
                        value={stats.peakHours}
                        neutral
                        changeLabel="Highest traffic · last 7 days"
                    />
                </div>

                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.6fr_1fr]">
                    {/* Attendance overview — stretches to match Recent activity's height */}
                    <Panel className="flex h-full flex-col">
                        <div className="mb-3 flex items-start justify-between">
                            <div>
                                <h2 className="text-foreground text-[13px] font-semibold sm:text-[14px]">
                                    Attendance overview
                                </h2>
                                <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                    Last 7 days
                                </p>
                            </div>
                        </div>

                        <div className="relative min-h-28 w-full flex-1 sm:min-h-36">
                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="h-full w-full overflow-visible"
                            >
                                <polyline
                                    points={checkInPoints}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="1.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <polyline
                                    points={deniedPoints}
                                    fill="none"
                                    stroke="#f43f5e"
                                    strokeWidth="1.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        </div>

                        <div className="text-muted-foreground mt-1.5 grid grid-cols-7 text-center text-[9px] sm:text-[10px]">
                            {attendanceOverview.series.map((d) => (
                                <span key={d.label}>{d.label}</span>
                            ))}
                        </div>

                        <div className="border-sidebar-border/70 dark:border-sidebar-border mt-3 flex items-center justify-between border-t pt-3 text-[10px] sm:text-[11px]">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-orange-500" />
                                    Check-ins{" "}
                                    <span className="text-foreground font-medium">
                                        {attendanceOverview.totalCheckIns}
                                    </span>
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-rose-500" />
                                    Denied{" "}
                                    <span className="text-foreground font-medium">
                                        {attendanceOverview.totalDenied}
                                    </span>
                                </span>
                            </div>
                            <span
                                className={cn(
                                    "font-medium",
                                    attendanceOverview.changeVsLastWeek >= 0
                                        ? "text-emerald-500"
                                        : "text-red-500",
                                )}
                            >
                                {attendanceOverview.changeVsLastWeek >= 0
                                    ? "↗"
                                    : "↘"}{" "}
                                {Math.abs(attendanceOverview.changeVsLastWeek)}%
                                from last week
                            </span>
                        </div>
                    </Panel>

                    {/* Recent activity — capped list with its own scroll so it
                        never forces the page (or the attendance card) taller
                        than a reasonable height */}
                    <Panel className="flex h-full max-h-[420px] flex-col lg:max-h-none">
                        <h2 className="text-foreground text-[13px] font-semibold sm:text-[14px]">
                            Recent activity
                        </h2>

                        {liveActivity.length === 0 ? (
                            <p className="text-muted-foreground py-6 text-center text-[12px]">
                                No scans yet today.
                            </p>
                        ) : (
                            <div className="scrollbar-thin divide-sidebar-border/50 dark:divide-sidebar-border/50 mt-2 flex flex-1 flex-col divide-y overflow-y-auto">
                                {liveActivity.map((item) => (
                                    <div
                                        key={item.id}
                                        className="hover:bg-accent flex items-center justify-between gap-3 rounded-md px-1 py-2 transition-colors"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            {item.status === "success" ? (
                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-semibold text-orange-500 sm:size-8">
                                                    {item.initials}
                                                </div>
                                            ) : (
                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 sm:size-8">
                                                    <XCircle className="size-3.5" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-[12px] font-medium sm:text-[13px]">
                                                    {item.name}
                                                </p>
                                                <p className="truncate text-[10px] sm:text-[11px]">
                                                    {item.status ===
                                                    "success" ? (
                                                        <span className="text-emerald-500">
                                                            checked in
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-500">
                                                            denied
                                                            {item.reason
                                                                ? ` · ${item.reason}`
                                                                : ""}
                                                        </span>
                                                    )}{" "}
                                                    <span className="text-muted-foreground">
                                                        · {item.method}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-muted-foreground shrink-0 text-[10px] sm:text-[11px]">
                                            {item.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
    ],
};
