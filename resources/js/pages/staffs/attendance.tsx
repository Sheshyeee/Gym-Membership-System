import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Activity, Clock, Flame, Filter } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { dashboard } from "@/routes";
import { cn } from "@/lib/utils";

type Visit = {
    id: number;
    name: string;
    initials: string;
    status: "success" | "denied";
    denialReason?: string | null;
    plan?: string | null;
    time: string;
    date: string;
};

type Stats = {
    totalVisits: number;
    deniedCount: number;
    busiestDay: string;
    busiestDayCount: number;
    peakHour: string;
    peakHours: { hour: string; total: number }[];
};

const PLAN_STYLES: Record<string, string> = {
    Basic: "bg-blue-500/10 text-blue-500",
    Premium: "bg-amber-500/10 text-amber-500",
    Elite: "bg-purple-500/10 text-purple-500",
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
    icon,
    iconBg,
    label,
    value,
    sub,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <Panel>
            <div
                className={`mb-2.5 inline-flex size-8 items-center justify-center rounded-md sm:size-9 ${iconBg}`}
            >
                {icon}
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                {label}
            </p>
            <p className="text-foreground text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
                {value}
            </p>
            <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                {sub}
            </p>
        </Panel>
    );
}

export default function Attendance({
    range,
    filterDate,
    stats,
    chartData,
    recentVisits,
}: {
    range: "today" | "week" | "month";
    filterDate: string | null;
    stats: Stats;
    chartData: { label: string; total: number }[];
    recentVisits: Visit[];
}) {
    const [showFilter, setShowFilter] = useState(false);
    const [dateInput, setDateInput] = useState(filterDate ?? "");

    const setRange = (r: string) => {
        router.get(
            "/staff/attendance",
            { range: r, date: filterDate },
            { preserveState: true, preserveScroll: true },
        );
    };

    const applyDateFilter = () => {
        router.get(
            "/staff/attendance",
            { range, date: dateInput || undefined },
            { preserveState: true, preserveScroll: true },
        );
        setShowFilter(false);
    };

    const clearDateFilter = () => {
        setDateInput("");
        router.get(
            "/staff/attendance",
            { range },
            { preserveState: true, preserveScroll: true },
        );
        setShowFilter(false);
    };

    return (
        <>
            <Head title="Attendance" />
            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 p-3 sm:gap-5 sm:p-4 lg:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                    <div>
                        <p className="mb-1 text-[10px] font-semibold tracking-widest text-orange-500 uppercase sm:text-[11px]">
                            Operations analytics
                        </p>
                        <h1 className="text-foreground text-lg font-semibold sm:text-xl">
                            Attendance
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-[12px]">
                            Keep a pulse on traffic, peak hours, and recent
                            visits.
                        </p>
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border bg-background flex items-center gap-1 self-start rounded-lg border p-1">
                        {(["today", "week", "month"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors sm:px-3 sm:py-1.5 sm:text-[12px]",
                                    range === r
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <StatCard
                        icon={<Activity className="size-4 text-orange-500" />}
                        iconBg="bg-orange-500/10"
                        label="Total visits"
                        value={stats.totalVisits.toString()}
                        sub={`${stats.deniedCount} denied attempts`}
                    />
                    <StatCard
                        icon={<Clock className="size-4 text-emerald-500" />}
                        iconBg="bg-emerald-500/10"
                        label="Peak hour"
                        value={stats.peakHour}
                        sub="Most check-ins recorded"
                    />
                    <StatCard
                        icon={<Flame className="size-4 text-amber-500" />}
                        iconBg="bg-amber-500/10"
                        label="Busiest day"
                        value={stats.busiestDay}
                        sub={`${stats.busiestDayCount} total visits`}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <Panel>
                        <p className="text-foreground mb-3 text-[13px] font-semibold sm:text-[14px]">
                            Visits by {range === "today" ? "hour" : "day"}
                        </p>
                        <div className="h-48 sm:h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="label"
                                        stroke="currentColor"
                                        opacity={0.5}
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            background:
                                                "var(--color-card, #1a1a1a)",
                                            border: "1px solid rgba(128,128,128,0.2)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey="total"
                                        fill="#f97316"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Panel>

                    <Panel>
                        <p className="text-foreground text-[13px] font-semibold sm:text-[14px]">
                            Peak hours
                        </p>
                        <p className="text-muted-foreground mb-3 text-[10px] capitalize sm:text-[11px]">
                            {range}
                        </p>
                        <div className="space-y-2.5">
                            {stats.peakHours.length === 0 && (
                                <p className="text-muted-foreground text-[12px]">
                                    No check-ins yet.
                                </p>
                            )}
                            {stats.peakHours.map((h, i) => (
                                <div
                                    key={h.hour}
                                    className="flex items-center justify-between text-[12px] sm:text-[13px]"
                                >
                                    <span className="text-foreground/80 flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "size-1.5 rounded-full",
                                                i === 0
                                                    ? "bg-orange-500"
                                                    : i === 1
                                                      ? "bg-amber-500"
                                                      : "bg-emerald-500",
                                            )}
                                        />
                                        {h.hour}
                                    </span>
                                    <span className="text-foreground font-medium tabular-nums">
                                        {h.total} visits
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>

                <Panel>
                    <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                            <p className="text-foreground text-[13px] font-semibold sm:text-[14px]">
                                Recent attendance records
                            </p>
                            <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                {filterDate
                                    ? `Showing ${filterDate}`
                                    : "Click a record to view details"}
                            </p>
                        </div>
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowFilter((s) => !s)}
                                className="border-sidebar-border/70 dark:border-sidebar-border bg-background text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] sm:text-[12px]"
                            >
                                <Filter className="size-3.5" />
                                Filter
                            </button>
                            {showFilter && (
                                <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card absolute right-0 z-10 mt-2 w-60 rounded-xl border p-3 shadow-xl sm:w-64 sm:p-4">
                                    <label className="text-muted-foreground mb-2 block text-[10px] sm:text-[11px]">
                                        Select date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateInput}
                                        onChange={(e) =>
                                            setDateInput(e.target.value)
                                        }
                                        className="border-input bg-background text-foreground mb-3 w-full rounded-md border px-2.5 py-1.5 text-[12px]"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={applyDateFilter}
                                            className="bg-primary text-primary-foreground flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium hover:opacity-90"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={clearDateFilter}
                                            className="border-sidebar-border/70 dark:border-sidebar-border text-foreground/80 hover:bg-muted rounded-md border px-3 py-1.5 text-[12px]"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {recentVisits.length === 0 ? (
                        <p className="text-muted-foreground py-6 text-center text-[12px]">
                            No visits recorded for this period.
                        </p>
                    ) : (
                        <>
                            {/* Mobile: cards */}
                            <div className="divide-sidebar-border/60 flex flex-col divide-y sm:hidden">
                                {recentVisits.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center justify-between gap-2 py-2.5"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-[12px] font-medium">
                                                {v.name}
                                            </p>
                                            <p className="text-muted-foreground text-[10px]">
                                                ATT-
                                                {String(v.id).padStart(
                                                    4,
                                                    "0",
                                                )}{" "}
                                                · {v.time} · {v.date}
                                            </p>
                                        </div>
                                        {v.status === "denied" ? (
                                            <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
                                                Denied
                                            </span>
                                        ) : (
                                            <span
                                                className={cn(
                                                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                                    v.plan
                                                        ? (PLAN_STYLES[
                                                              v.plan
                                                          ] ??
                                                              "bg-muted text-muted-foreground")
                                                        : "bg-muted text-muted-foreground",
                                                )}
                                            >
                                                {v.plan ?? "No plan"}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop / tablet: table */}
                            <div className="scrollbar-thin hidden overflow-x-auto sm:block">
                                <table className="w-full text-[12px] lg:text-[13px]">
                                    <thead>
                                        <tr className="border-sidebar-border/70 dark:border-sidebar-border border-b text-left">
                                            <th className="text-muted-foreground pr-4 pb-2.5 text-[10px] font-medium tracking-wide lg:text-[11px]">
                                                Record ID
                                            </th>
                                            <th className="text-muted-foreground pr-4 pb-2.5 text-[10px] font-medium tracking-wide lg:text-[11px]">
                                                Member
                                            </th>
                                            <th className="text-muted-foreground pr-4 pb-2.5 text-[10px] font-medium tracking-wide lg:text-[11px]">
                                                Type
                                            </th>
                                            <th className="text-muted-foreground pr-4 pb-2.5 text-[10px] font-medium tracking-wide lg:text-[11px]">
                                                Time
                                            </th>
                                            <th className="text-muted-foreground pb-2.5 text-[10px] font-medium tracking-wide lg:text-[11px]">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-sidebar-border/60 divide-y">
                                        {recentVisits.map((v) => (
                                            <tr
                                                key={v.id}
                                                className="hover:bg-muted/40 cursor-pointer"
                                            >
                                                <td className="text-foreground py-2.5 pr-4 font-semibold">
                                                    ATT-
                                                    {String(v.id).padStart(
                                                        4,
                                                        "0",
                                                    )}
                                                </td>
                                                <td className="text-foreground/80 py-2.5 pr-4">
                                                    {v.name}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    {v.status === "denied" ? (
                                                        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-500">
                                                            Denied
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={cn(
                                                                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                                                v.plan
                                                                    ? (PLAN_STYLES[
                                                                          v.plan
                                                                      ] ??
                                                                          "bg-muted text-muted-foreground")
                                                                    : "bg-muted text-muted-foreground",
                                                            )}
                                                        >
                                                            {v.plan ??
                                                                "No plan"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-muted-foreground py-2.5 pr-4">
                                                    {v.time}
                                                </td>
                                                <td className="text-muted-foreground py-2.5">
                                                    {v.date}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Panel>
            </div>
        </>
    );
}

Attendance.layout = {
    breadcrumbs: [{ title: "Attendance", href: dashboard() }],
};
