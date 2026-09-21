import { Head, Link } from "@inertiajs/react";
import {
    Users,
    ShieldCheck,
    Flame,
    QrCode,
    XCircle,
} from "lucide-react";
import { dashboard } from "@/routes";

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

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Greeting */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                            {greeting.dateLabel}
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">
                            Good {greeting.timeOfDay}, {greeting.name}
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500">
                            Here&apos;s what&apos;s happening at the front
                            desk today.
                        </p>
                    </div>

                    <Link
                        href={route("staff.qr-checkin")}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                    >
                        <QrCode className="h-4 w-4" />
                        Scan member
                    </Link>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                            <Users className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-neutral-500">
                            Today&apos;s check-ins
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                            {stats.checkInsToday.value.toLocaleString()}
                        </p>
                        <p
                            className={`mt-1 text-xs ${
                                stats.checkInsToday.change >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                            }`}
                        >
                            {stats.checkInsToday.change >= 0 ? "↗" : "↘"}{" "}
                            {Math.abs(stats.checkInsToday.change)}% vs{" "}
                            {stats.checkInsToday.compareLabel}
                        </p>
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Users className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-neutral-500">
                            New members this month
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                            {stats.newMembersThisMonth.value.toLocaleString()}
                        </p>
                        <p
                            className={`mt-1 text-xs ${
                                stats.newMembersThisMonth.change >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                            }`}
                        >
                            {stats.newMembersThisMonth.change >= 0
                                ? "↗"
                                : "↘"}{" "}
                            {Math.abs(stats.newMembersThisMonth.change)}% vs
                            last month
                        </p>
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-neutral-500">
                            Active members
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                            {stats.activeMembers.value.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                            Currently active
                        </p>
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                            <Flame className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-neutral-500">Peak hours</p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                            {stats.peakHours}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                            Highest traffic window · last 7 days
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
                    {/* Attendance overview */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Attendance overview
                                </h2>
                                <p className="text-xs text-neutral-500">
                                    Last 7 days
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-6 h-48 w-full">
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

                        <div className="mt-2 grid grid-cols-7 text-center text-xs text-neutral-500">
                            {attendanceOverview.series.map((d) => (
                                <span key={d.label}>{d.label}</span>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-4 text-xs">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-neutral-400">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Check-ins{" "}
                                    <span className="font-medium text-white">
                                        {attendanceOverview.totalCheckIns}
                                    </span>
                                </span>
                                <span className="flex items-center gap-1.5 text-neutral-400">
                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                    Denied{" "}
                                    <span className="font-medium text-white">
                                        {attendanceOverview.totalDenied}
                                    </span>
                                </span>
                            </div>
                            <span
                                className={
                                    attendanceOverview.changeVsLastWeek >= 0
                                        ? "text-emerald-400"
                                        : "text-rose-400"
                                }
                            >
                                {attendanceOverview.changeVsLastWeek >= 0
                                    ? "↗"
                                    : "↘"}{" "}
                                {Math.abs(attendanceOverview.changeVsLastWeek)}
                                % from last week
                            </span>
                        </div>
                    </div>

                    {/* Recent activity */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                        <h2 className="text-lg font-semibold text-white">
                            Recent activity
                        </h2>

                        {liveActivity.length === 0 ? (
                            <p className="mt-6 text-sm text-neutral-500">
                                No scans yet today.
                            </p>
                        ) : (
                            <div className="mt-4 divide-y divide-neutral-800">
                                {liveActivity.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.status === "success" ? (
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-400">
                                                    {item.initials}
                                                </div>
                                            ) : (
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                                                    <XCircle className="h-4 w-4" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-neutral-100">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs">
                                                    {item.status ===
                                                    "success" ? (
                                                        <span className="text-emerald-400">
                                                            checked in
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-400">
                                                            denied
                                                            {item.reason
                                                                ? ` · ${item.reason}`
                                                                : ""}
                                                        </span>
                                                    )}{" "}
                                                    <span className="text-neutral-500">
                                                        · {item.method}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-neutral-500">
                                            {item.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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