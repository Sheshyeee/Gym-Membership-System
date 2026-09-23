import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    Activity,
    Clock,
    Users,
    ChevronLeft,
    ChevronRight,
    Filter,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { dashboard } from "@/routes";

type Stats = {
    totalCheckIns: number;
    peakHour: string;
    peakHourMembers: number;
    activeMembers: number;
};

type HourlyPoint = { label: string; total: number };

type HeatmapCell = { count: number; intensity: number };
type HeatmapBucket = { label: string; cells: HeatmapCell[] };

type Record_ = {
    id: number;
    name: string;
    status: "success" | "denied";
    denialReason?: string | null;
    plan?: string | null;
    time: string;
    date: string;
};

// Accent colors kept from the original — these are semantic status/plan
// colors, not theme colors, so they stay consistent across light and dark
// (each just gets a slightly brighter dark: variant for contrast).
const PLAN_STYLES: Record<string, string> = {
    Basic: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Premium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Elite: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Heatmap intensity → semantic-ish emerald scale. Uses opacity steps so it
// still reads correctly against either a light or dark card background.
function heatColor(intensity: number) {
    if (intensity === 0) return "bg-muted";
    if (intensity <= 0.25) return "bg-emerald-500/20";
    if (intensity <= 0.5) return "bg-emerald-500/40";
    if (intensity <= 0.75) return "bg-emerald-500/70";
    return "bg-emerald-500";
}

// ---------------------------------------------------------------------------
// Shared panel shell — matches the rounded-2xl (mobile) / rounded-xl
// (desktop) card used across Overview/Staff/Member, and pulls its
// background/border from the theme instead of a hardcoded dark palette.
// ---------------------------------------------------------------------------

function Panel({
    className = "",
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`rounded-2xl border border-border bg-card p-3 sm:rounded-xl sm:p-4 ${className}`}
        >
            {children}
        </div>
    );
}

// Compact on mobile (small icon, tight type scale) and a bit more generous
// from sm: up — three of these used to stack full-width on phones, which
// read as oversized empty cards. They now stay in a tight 3-up row at every
// size, so the mobile view matches the density of the desktop one.
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
        <Panel className="!p-2.5 sm:!p-4">
            <div
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${iconBg}`}
            >
                {icon}
            </div>
            <p className="mt-2 truncate text-[10px] text-muted-foreground sm:mt-4 sm:text-[11px]">
                {label}
            </p>
            <p className="mt-0.5 text-base leading-tight font-semibold text-foreground sm:text-2xl">
                {value}
            </p>
            <p className="mt-0.5 truncate text-[9px] text-muted-foreground sm:text-[11px]">
                {sub}
            </p>
        </Panel>
    );
}

function StatusBadge({ record }: { record: Record_ }) {
    return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
            {record.status === "denied" ? (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 sm:px-2.5 sm:py-1 sm:text-[11px] dark:text-red-400">
                    Denied
                </span>
            ) : (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 sm:px-2.5 sm:py-1 sm:text-[11px] dark:text-emerald-400">
                    Check-in
                </span>
            )}
            {record.status !== "denied" && record.plan && (
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-[11px] ${PLAN_STYLES[record.plan] ?? "bg-muted text-muted-foreground"}`}
                >
                    {record.plan}
                </span>
            )}
        </span>
    );
}

export default function Attendance({
    stats,
    hourly,
    heatmap,
    recordDate,
    recentRecords,
}: {
    stats: Stats;
    hourly: { date: string; data: HourlyPoint[] };
    heatmap: {
        weekOffset: number;
        weekLabel: string;
        isCurrentWeek: boolean;
        buckets: HeatmapBucket[];
    };
    recordDate: string | null;
    recentRecords: Record_[];
}) {
    const [hourlyDate, setHourlyDate] = useState(hourly.date);
    const [showFilter, setShowFilter] = useState(false);
    const [dateInput, setDateInput] = useState(recordDate ?? "");

    const applyHourlyDate = (date: string) => {
        setHourlyDate(date);
        router.get(
            "/attendance",
            {
                hourly_date: date,
                week_offset: heatmap.weekOffset,
                record_date: recordDate,
            },
            { preserveState: true, preserveScroll: true, only: ["hourly"] },
        );
    };

    const navigateWeek = (direction: -1 | 1) => {
        router.get(
            "/attendance",
            {
                hourly_date: hourlyDate,
                week_offset: heatmap.weekOffset + direction,
                record_date: recordDate,
            },
            { preserveState: true, preserveScroll: true, only: ["heatmap"] },
        );
    };

    const applyRecordDate = () => {
        router.get(
            "/attendance",
            {
                hourly_date: hourlyDate,
                week_offset: heatmap.weekOffset,
                record_date: dateInput || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["recentRecords"],
            },
        );
        setShowFilter(false);
    };

    const clearRecordDate = () => {
        setDateInput("");
        router.get(
            "/attendance",
            { hourly_date: hourlyDate, week_offset: heatmap.weekOffset },
            {
                preserveState: true,
                preserveScroll: true,
                only: ["recentRecords"],
            },
        );
        setShowFilter(false);
    };

    return (
        <>
            <Head title="Attendance" />
            {/* No hardcoded bg/text here — the layout shell already supplies
                bg-background/text-foreground, and those tokens flip with
                the app's dark: class, same as Overview/Staff/Member. */}
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-2.5 p-2.5 sm:gap-4 sm:p-4 lg:p-6">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-emerald-600 sm:text-xs dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live workspace
                    </div>
                    <h1 className="mt-1 text-lg font-semibold text-foreground sm:text-2xl">
                        Attendance Analytics
                    </h1>
                    <p className="text-[12px] text-muted-foreground sm:text-sm">
                        Track member activity and peak gym utilization.
                    </p>
                </div>

                {/* grid-cols-3 (not grid-cols-1) even on phones: the old
                    mobile layout stacked these three cards full-width,
                    which made each one look oversized with a lot of
                    unused padding. Keeping them in a compact row matches
                    how the rest of the dashboard reads on mobile. */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <StatCard
                        icon={
                            <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" />
                        }
                        iconBg="bg-amber-500/10"
                        label="Total check-ins"
                        value={stats.totalCheckIns.toLocaleString()}
                        sub="Last 30 days"
                    />
                    <StatCard
                        icon={
                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400 sm:h-5 sm:w-5" />
                        }
                        iconBg="bg-orange-500/10"
                        label="Peak hour"
                        value={stats.peakHour}
                        sub={`${stats.peakHourMembers} members, last 30 days`}
                    />
                    <StatCard
                        icon={
                            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:h-5 sm:w-5" />
                        }
                        iconBg="bg-emerald-500/10"
                        label="Active members"
                        value={stats.activeMembers.toLocaleString()}
                        sub="Currently subscribed"
                    />
                </div>

                {/* items-stretch (default): both panels match the taller
                    one's height. The hourly-attendance card's own content
                    (header + fixed-height chart) naturally fits that height
                    with room to spare, so it's left flex flex-col — no
                    stretch needed there. The heatmap card is the one that
                    needs to actively fill the extra height: see the
                    flex-1/mt-auto layout inside it below, which centers the
                    day-grid vertically and pins the legend to the bottom
                    instead of leaving a dead gap under a top-aligned grid. */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[1.4fr_1fr]">
                    <Panel className="flex flex-col">
                        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
                            <div>
                                <p className="text-[12px] font-semibold text-foreground sm:text-sm">
                                    Hourly attendance
                                </p>
                                <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                                    {hourlyDate ===
                                    new Date().toISOString().slice(0, 10)
                                        ? "Today"
                                        : hourlyDate}
                                </p>
                            </div>
                            <input
                                type="date"
                                value={hourlyDate}
                                onChange={(e) =>
                                    applyHourlyDate(e.target.value)
                                }
                                max={new Date().toISOString().slice(0, 10)}
                                className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-[11px] text-foreground sm:px-3 sm:py-1.5 sm:text-[13px]"
                            />
                        </div>
                        {hourly.data.every((d) => d.total === 0) ? (
                            <div className="flex h-28 items-center justify-center text-center text-[12px] text-muted-foreground sm:h-32 sm:text-[13px]">
                                No check-ins recorded for this day.
                            </div>
                        ) : (
                            <div className="h-28 sm:h-32 md:h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourly.data}>
                                        <XAxis
                                            dataKey="label"
                                            stroke="currentColor"
                                            className="text-muted-foreground"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={2}
                                        />
                                        <YAxis hide domain={[0, "dataMax"]} />
                                        <Tooltip
                                            contentStyle={{
                                                background:
                                                    "var(--color-card, #171717)",
                                                border: "1px solid rgba(128,128,128,0.2)",
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar
                                            dataKey="total"
                                            fill="#f59e0b"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Panel>

                    <Panel className="flex flex-col">
                        <div className="mb-1 flex items-center justify-between">
                            <p className="text-[12px] font-semibold text-foreground sm:text-sm">
                                Weekly heatmap
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => navigateWeek(-1)}
                                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-label="Previous week"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                                <button
                                    onClick={() => navigateWeek(1)}
                                    disabled={heatmap.isCurrentWeek}
                                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                                    aria-label="Next week"
                                >
                                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                            </div>
                        </div>
                        <p className="mb-2 text-[10px] text-muted-foreground sm:mb-3 sm:text-[11px]">
                            {heatmap.weekLabel}
                        </p>

                        {/* flex-1 + justify-center still absorbs any small
                            leftover height difference from the grid's equal
                            stretch, but the cells themselves are now a
                            small fixed size (not aspect-square) so the
                            heatmap stays visually compact instead of
                            growing large cells to fill the available
                            height. overflow-x-auto + min-width guard keeps
                            the 7-day grid from being crushed illegibly on
                            very narrow phones instead of silently
                            clipping. */}
                        <div className="flex flex-1 flex-col justify-center overflow-x-auto">
                            <div className="grid min-w-[210px] grid-cols-[auto_repeat(7,1fr)] items-center gap-1 text-[9px] sm:gap-1.5 sm:text-[10px]">
                                <span />
                                {DAY_LABELS.map((d, i) => (
                                    <span
                                        key={i}
                                        className="text-center text-muted-foreground"
                                    >
                                        {d}
                                    </span>
                                ))}
                                {heatmap.buckets.map((bucket) => (
                                    <>
                                        <span
                                            key={bucket.label}
                                            className="pr-1.5 whitespace-nowrap text-muted-foreground sm:pr-2"
                                        >
                                            {bucket.label}
                                        </span>
                                        {bucket.cells.map((cell, ci) => (
                                            <div
                                                key={ci}
                                                title={`${cell.count} check-ins`}
                                                className={`h-3 rounded sm:h-3.5 ${heatColor(cell.intensity)}`}
                                            />
                                        ))}
                                    </>
                                ))}
                            </div>
                        </div>

                        {/* mt-auto pins the legend to the card's bottom edge
                            regardless of how much extra height flex-1 above
                            absorbed, so it lines up with the bottom of the
                            hourly-attendance card next to it. */}
                        <div className="mt-auto flex items-center justify-end gap-1 pt-2 text-[9px] text-muted-foreground sm:gap-1.5 sm:pt-3 sm:text-[10px]">
                            Less
                            <span className="h-2 w-2 rounded bg-muted sm:h-2.5 sm:w-2.5" />
                            <span className="h-2 w-2 rounded bg-emerald-500/20 sm:h-2.5 sm:w-2.5" />
                            <span className="h-2 w-2 rounded bg-emerald-500/40 sm:h-2.5 sm:w-2.5" />
                            <span className="h-2 w-2 rounded bg-emerald-500/70 sm:h-2.5 sm:w-2.5" />
                            <span className="h-2 w-2 rounded bg-emerald-500 sm:h-2.5 sm:w-2.5" />
                            More
                        </div>
                    </Panel>
                </div>

                <div className="rounded-2xl border border-border bg-card sm:rounded-xl">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
                        <div>
                            <p className="text-[12px] font-semibold text-foreground sm:text-sm">
                                Recent attendance records
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
                                {recordDate
                                    ? `Showing ${recordDate}`
                                    : "Click a record to view details"}
                            </p>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowFilter((s) => !s)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-foreground/80 hover:bg-muted sm:px-3 sm:py-1.5 sm:text-[13px]"
                            >
                                <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Filter
                            </button>
                            {showFilter && (
                                <div className="absolute right-0 z-10 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 shadow-xl sm:w-64 sm:p-4">
                                    <label className="mb-2 block text-[10px] text-muted-foreground sm:text-[11px]">
                                        Select date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateInput}
                                        onChange={(e) =>
                                            setDateInput(e.target.value)
                                        }
                                        className="mb-3 w-full rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[12px] text-foreground sm:px-3 sm:py-1.5 sm:text-[13px]"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={applyRecordDate}
                                            className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90 sm:text-[13px]"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={clearRecordDate}
                                            className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-foreground/80 hover:bg-muted sm:text-[13px]"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {recentRecords.length === 0 ? (
                        <p className="py-10 text-center text-[13px] text-muted-foreground">
                            No attendance records yet.
                        </p>
                    ) : (
                        <>
                            {/* Desktop / tablet: table. */}
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-5 py-2.5 text-xs font-medium tracking-wide text-muted-foreground">
                                                Record ID
                                            </th>
                                            <th className="px-5 py-2.5 text-xs font-medium tracking-wide text-muted-foreground">
                                                Member
                                            </th>
                                            <th className="px-5 py-2.5 text-xs font-medium tracking-wide text-muted-foreground">
                                                Type
                                            </th>
                                            <th className="px-5 py-2.5 text-xs font-medium tracking-wide text-muted-foreground">
                                                Time
                                            </th>
                                            <th className="px-5 py-2.5 text-xs font-medium tracking-wide text-muted-foreground">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentRecords.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="cursor-pointer hover:bg-muted/40"
                                            >
                                                <td className="px-5 py-3 font-semibold text-foreground">
                                                    ATT-
                                                    {String(r.id).padStart(
                                                        4,
                                                        "0",
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-foreground/80">
                                                    {r.name}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <StatusBadge record={r} />
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground">
                                                    {r.time}
                                                </td>
                                                <td className="px-5 py-3 text-muted-foreground">
                                                    {r.date}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile: stacked cards instead of a squeezed
                                5-column table. */}
                            <ul className="divide-y divide-border sm:hidden">
                                {recentRecords.map((r) => (
                                    <li key={r.id} className="px-3 py-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-semibold text-foreground">
                                                    ATT-
                                                    {String(r.id).padStart(
                                                        4,
                                                        "0",
                                                    )}
                                                </p>
                                                <p className="truncate text-[11px] text-foreground/80">
                                                    {r.name}
                                                </p>
                                            </div>
                                            <StatusBadge record={r} />
                                        </div>
                                        <p className="mt-1.5 text-[10px] text-muted-foreground">
                                            {r.time} · {r.date}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

Attendance.layout = {
    breadcrumbs: [{ title: "Attendance", href: dashboard() }],
};
