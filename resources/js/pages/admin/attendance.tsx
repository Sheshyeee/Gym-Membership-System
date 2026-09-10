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

const PLAN_STYLES: Record<string, string> = {
    Basic: "bg-blue-500/10 text-blue-400",
    Premium: "bg-amber-500/10 text-amber-400",
    Elite: "bg-purple-500/10 text-purple-400",
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function heatColor(intensity: number) {
    if (intensity === 0) return "bg-neutral-800";
    if (intensity <= 0.25) return "bg-emerald-900/60";
    if (intensity <= 0.5) return "bg-emerald-700/70";
    if (intensity <= 0.75) return "bg-emerald-500/80";
    return "bg-emerald-400";
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
            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <p className="text-xs font-medium tracking-widest text-amber-500/80 uppercase mb-2">
                            Live workspace
                        </p>
                        <h1 className="text-3xl font-semibold text-white mb-1">
                            Attendance Analytics
                        </h1>
                        <p className="text-sm text-neutral-400">
                            Track member activity and peak gym utilization.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard
                            icon={
                                <Activity className="h-5 w-5 text-amber-500" />
                            }
                            iconBg="bg-amber-500/10"
                            label="Total check-ins"
                            value={stats.totalCheckIns.toLocaleString()}
                            sub="Last 30 days"
                        />
                        <StatCard
                            icon={<Clock className="h-5 w-5 text-orange-500" />}
                            iconBg="bg-orange-500/10"
                            label="Peak hour"
                            value={stats.peakHour}
                            sub={`${stats.peakHourMembers} members, last 30 days`}
                        />
                        <StatCard
                            icon={
                                <Users className="h-5 w-5 text-emerald-500" />
                            }
                            iconBg="bg-emerald-500/10"
                            label="Active members"
                            value={stats.activeMembers.toLocaleString()}
                            sub="Currently subscribed"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 mb-6">
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                <div>
                                    <p className="font-semibold text-white">
                                        Hourly attendance
                                    </p>
                                    <p className="text-xs text-neutral-500">
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
                                    className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white"
                                />
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourly.data}>
                                        <XAxis
                                            dataKey="label"
                                            stroke="#737373"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={2}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{
                                                background: "#171717",
                                                border: "1px solid #262626",
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
                        </div>

                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-white">
                                    Weekly heatmap
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => navigateWeek(-1)}
                                        className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                        aria-label="Previous week"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => navigateWeek(1)}
                                        disabled={heatmap.isCurrentWeek}
                                        className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                                        aria-label="Next week"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-neutral-500 mb-4">
                                {heatmap.weekLabel}
                            </p>

                            <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1.5 items-center text-xs">
                                <span />
                                {DAY_LABELS.map((d, i) => (
                                    <span
                                        key={i}
                                        className="text-center text-neutral-500"
                                    >
                                        {d}
                                    </span>
                                ))}
                                {heatmap.buckets.map((bucket) => (
                                    <>
                                        <span
                                            key={bucket.label}
                                            className="pr-2 text-neutral-500 whitespace-nowrap"
                                        >
                                            {bucket.label}
                                        </span>
                                        {bucket.cells.map((cell, ci) => (
                                            <div
                                                key={ci}
                                                title={`${cell.count} check-ins`}
                                                className={`aspect-square rounded ${heatColor(cell.intensity)}`}
                                            />
                                        ))}
                                    </>
                                ))}
                            </div>

                            <div className="flex items-center justify-end gap-1.5 mt-4 text-xs text-neutral-500">
                                Less
                                <span className="h-3 w-3 rounded bg-neutral-800" />
                                <span className="h-3 w-3 rounded bg-emerald-900/60" />
                                <span className="h-3 w-3 rounded bg-emerald-700/70" />
                                <span className="h-3 w-3 rounded bg-emerald-500/80" />
                                <span className="h-3 w-3 rounded bg-emerald-400" />
                                More
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                        <div>
                            <p className="font-semibold text-white">
                                Recent attendance records
                            </p>
                            <p className="text-xs text-neutral-500">
                                {recordDate
                                    ? `Showing ${recordDate}`
                                    : "Click a record to view details"}
                            </p>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowFilter((s) => !s)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
                            >
                                <Filter className="h-3.5 w-3.5" />
                                Filter
                            </button>
                            {showFilter && (
                                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-xl z-10">
                                    <label className="block text-xs text-neutral-500 mb-2">
                                        Select date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateInput}
                                        onChange={(e) =>
                                            setDateInput(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white mb-3"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={applyRecordDate}
                                            className="flex-1 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={clearRecordDate}
                                            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {recentRecords.length === 0 ? (
                            <p className="py-6 text-sm text-neutral-500 text-center">
                                No attendance records yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-800 text-left">
                                            <th className="pb-3 pr-4 font-medium text-neutral-500 text-xs tracking-wide">
                                                Record ID
                                            </th>
                                            <th className="pb-3 pr-4 font-medium text-neutral-500 text-xs tracking-wide">
                                                Member
                                            </th>
                                            <th className="pb-3 pr-4 font-medium text-neutral-500 text-xs tracking-wide">
                                                Type
                                            </th>
                                            <th className="pb-3 pr-4 font-medium text-neutral-500 text-xs tracking-wide">
                                                Time
                                            </th>
                                            <th className="pb-3 font-medium text-neutral-500 text-xs tracking-wide">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {recentRecords.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="cursor-pointer hover:bg-neutral-800/40"
                                            >
                                                <td className="py-3 pr-4 font-semibold text-white">
                                                    ATT-
                                                    {String(r.id).padStart(
                                                        4,
                                                        "0",
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4 text-neutral-300">
                                                    {r.name}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {r.status === "denied" ? (
                                                        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                                                            Denied
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                                            Check-in
                                                        </span>
                                                    )}
                                                    {r.status !== "denied" &&
                                                        r.plan && (
                                                            <span
                                                                className={`ml-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${PLAN_STYLES[r.plan] ?? "bg-neutral-500/10 text-neutral-400"}`}
                                                            >
                                                                {r.plan}
                                                            </span>
                                                        )}
                                                </td>
                                                <td className="py-3 pr-4 text-neutral-400">
                                                    {r.time}
                                                </td>
                                                <td className="py-3 text-neutral-400">
                                                    {r.date}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
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
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
            <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} mb-4`}
            >
                {icon}
            </div>
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-white mb-1">{value}</p>
            <p className="text-xs text-neutral-500">{sub}</p>
        </div>
    );
}

Attendance.layout = {
    breadcrumbs: [{ title: "Attendance", href: dashboard() }],
};
