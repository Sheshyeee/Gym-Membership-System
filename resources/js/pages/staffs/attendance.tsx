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
    Basic: "bg-blue-500/10 text-blue-400",
    Premium: "bg-amber-500/10 text-amber-400",
    Elite: "bg-purple-500/10 text-purple-400",
};

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
            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                        <div>
                            <p className="text-xs font-medium tracking-widest text-amber-500/80 uppercase mb-2">
                                Operations Analytics
                            </p>
                            <h1 className="text-3xl font-semibold text-white mb-1">
                                Attendance
                            </h1>
                            <p className="text-sm text-neutral-400">
                                Keep a pulse on traffic, peak hours, and recent
                                visits.
                            </p>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg border border-neutral-800 p-1">
                            {(["today", "week", "month"] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                                        range === r
                                            ? "bg-neutral-800 text-white"
                                            : "text-neutral-400 hover:text-neutral-200"
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard
                            icon={
                                <Activity className="h-5 w-5 text-amber-500" />
                            }
                            iconBg="bg-amber-500/10"
                            label="Total visits"
                            value={stats.totalVisits.toString()}
                            sub={`${stats.deniedCount} denied attempts`}
                        />
                        <StatCard
                            icon={
                                <Clock className="h-5 w-5 text-emerald-500" />
                            }
                            iconBg="bg-emerald-500/10"
                            label="Peak hour"
                            value={stats.peakHour}
                            sub="Most check-ins recorded"
                        />
                        <StatCard
                            icon={<Flame className="h-5 w-5 text-orange-500" />}
                            iconBg="bg-orange-500/10"
                            label="Busiest day"
                            value={stats.busiestDay}
                            sub={`${stats.busiestDayCount} total visits`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 mb-6">
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                            <p className="font-semibold text-white mb-4">
                                Visits by {range === "today" ? "hour" : "day"}
                            </p>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <XAxis
                                            dataKey="label"
                                            stroke="#737373"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
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
                            <p className="font-semibold text-white mb-1">
                                Peak hours
                            </p>
                            <p className="text-xs text-neutral-500 mb-4 capitalize">
                                {range}
                            </p>
                            <div className="space-y-3">
                                {stats.peakHours.length === 0 && (
                                    <p className="text-sm text-neutral-500">
                                        No check-ins yet.
                                    </p>
                                )}
                                {stats.peakHours.map((h, i) => (
                                    <div
                                        key={h.hour}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="flex items-center gap-2 text-neutral-300">
                                            <span
                                                className={`h-2 w-2 rounded-full ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-orange-500" : "bg-emerald-500"}`}
                                            />
                                            {h.hour}
                                        </span>
                                        <span className="font-medium text-white">
                                            {h.total} visits
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="font-semibold text-white">
                                    Recent attendance records
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {filterDate
                                        ? `Showing ${filterDate}`
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
                                                onClick={applyDateFilter}
                                                className="flex-1 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500"
                                            >
                                                Apply
                                            </button>
                                            <button
                                                onClick={clearDateFilter}
                                                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {recentVisits.length === 0 ? (
                            <p className="py-6 text-sm text-neutral-500 text-center">
                                No visits recorded for this period.
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
                                        {recentVisits.map((v) => (
                                            <tr
                                                key={v.id}
                                                className="cursor-pointer hover:bg-neutral-800/40"
                                            >
                                                <td className="py-3 pr-4 font-semibold text-white">
                                                    ATT-
                                                    {String(v.id).padStart(
                                                        4,
                                                        "0",
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4 text-neutral-300">
                                                    {v.name}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {v.status === "denied" ? (
                                                        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                                                            Denied
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                v.plan
                                                                    ? (PLAN_STYLES[
                                                                          v.plan
                                                                      ] ??
                                                                      "bg-neutral-500/10 text-neutral-400")
                                                                    : "bg-neutral-500/10 text-neutral-400"
                                                            }`}
                                                        >
                                                            {v.plan ??
                                                                "No plan"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4 text-neutral-400">
                                                    {v.time}
                                                </td>
                                                <td className="py-3 text-neutral-400">
                                                    {v.date}
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
