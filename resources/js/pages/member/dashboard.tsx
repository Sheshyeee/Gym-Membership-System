import { Head, router, Link } from "@inertiajs/react";
import { useState } from "react";
import {
    Calendar,
    Flame,
    HeartPulse,
    QrCode,
    CreditCard,
    ChevronDown,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { dashboard } from "@/routes";

type CurrentMembership = {
    plan_name: string;
    tagline: string;
    status: string;
    valid_until: string | null;
    days_remaining: number;
    percent_used: number;
};

type CalendarDay = {
    day: number;
    date: string;
    weekday: number;
    checked_in: boolean;
    is_future: boolean;
};

type WeekBar = { label: string; visits: number };

type CheckIn = { id: number; when: string; method: string | null };

type MonthOption = { value: string; label: string };

export default function Dashboard({
    hasSubscription,
    currentMembership,
    selectedMonth,
    selectedMonthLabel,
    availableMonths = [],
    calendar = [],
    stats,
    weeklyRhythm = [],
    avgVisitsPerWeek,
    recentCheckIns = [],
}: {
    hasSubscription: boolean;
    currentMembership: CurrentMembership | null;
    selectedMonth: string;
    selectedMonthLabel: string;
    availableMonths: MonthOption[];
    calendar: CalendarDay[];
    stats: {
        visits: number;
        visitsChangeVsLastMonth: number;
        currentStreak: number;
        bestStreak: number;
        attendanceRate: number;
        attendanceRateAboveAverage: boolean;
    };
    weeklyRhythm: WeekBar[];
    avgVisitsPerWeek: number;
    recentCheckIns: CheckIn[];
}) {
    const [pickerOpen, setPickerOpen] = useState(false);

    const goToMonth = (value: string) => {
        const [year, month] = value.split("-");
        setPickerOpen(false);
        router.get(
            "/dashboard",
            { year, month: Number(month) },
            { preserveScroll: true, preserveState: true },
        );
    };

    // Leading blank cells so the grid starts on the correct weekday (Mon-first)
    const leadingBlanks = calendar.length ? calendar[0].weekday - 1 : 0;
    const maxWeekVisits = Math.max(1, ...weeklyRhythm.map((w) => w.visits));
    const hasAnyVisits = weeklyRhythm.some((w) => w.visits > 0);

    // Ring geometry for membership progress
    const RADIUS = 42;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const pct = currentMembership
        ? Math.min(100, Math.max(0, currentMembership.percent_used))
        : 0;
    const ringOffset = CIRCUMFERENCE * (1 - pct / 100);

    const statCards = [
        {
            key: "visits",
            label: "Gym visits",
            value: stats.visits,
            icon: QrCode,
            color: "blue",
            change: stats.visitsChangeVsLastMonth,
        },
        {
            key: "streak",
            label: `Current streak · best ${stats.bestStreak}d`,
            value: `${stats.currentStreak}d`,
            icon: Flame,
            color: "amber",
            change: null,
        },
        {
            key: "attendance",
            label: stats.attendanceRateAboveAverage
                ? "Attendance · above average"
                : "Attendance · below average",
            value: `${stats.attendanceRate}%`,
            icon: HeartPulse,
            color: "emerald",
            change: null,
        },
    ] as const;

    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-400",
        amber: "bg-amber-500/10 text-amber-400",
        emerald: "bg-emerald-500/10 text-emerald-400",
    };

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-3 sm:gap-8 sm:p-4 md:p-6">
                {!hasSubscription && (
                    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-amber-200/90 sm:text-sm">
                            You&apos;re browsing with limited access. Pick a
                            plan to unlock full features.
                        </p>
                        <Link
                            href="/onboarding"
                            className="w-fit whitespace-nowrap rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:text-sm"
                        >
                            Choose a plan
                        </Link>
                    </div>
                )}

                {/* Membership hero */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
                    <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-4 sm:p-6">
                        {currentMembership ? (
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-1">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            {currentMembership.status ===
                                            "active"
                                                ? "Active"
                                                : currentMembership.status}
                                        </span>
                                    </div>

                                    <h1 className="text-xl font-semibold text-white sm:text-2xl">
                                        {currentMembership.plan_name}
                                    </h1>
                                    <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
                                        {currentMembership.tagline}
                                    </p>

                                    <div className="mt-4 flex gap-6 text-xs sm:mt-5 sm:gap-8 sm:text-sm">
                                        <div>
                                            <p className="text-neutral-500">
                                                Valid until
                                            </p>
                                            <p className="mt-0.5 font-medium text-neutral-200">
                                                {currentMembership.valid_until ??
                                                    "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-500">
                                                Days remaining
                                            </p>
                                            <p className="mt-0.5 font-medium text-neutral-200">
                                                {
                                                    currentMembership.days_remaining
                                                }{" "}
                                                days
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        href="/member/membership"
                                        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-amber-400 transition hover:text-amber-300 sm:mt-5 sm:text-sm"
                                    >
                                        Manage plan
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>

                                {/* Progress ring */}
                                <div className="flex shrink-0 flex-col items-center self-center">
                                    <div className="relative flex h-20 w-20 items-center justify-center sm:h-28 sm:w-28">
                                        <svg
                                            viewBox="0 0 100 100"
                                            className="h-20 w-20 -rotate-90 sm:h-28 sm:w-28"
                                        >
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r={RADIUS}
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                className="text-neutral-800"
                                            />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r={RADIUS}
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                strokeDasharray={CIRCUMFERENCE}
                                                strokeDashoffset={ringOffset}
                                                className="text-amber-400 transition-[stroke-dashoffset] duration-500"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-base font-semibold text-white sm:text-xl">
                                                {
                                                    currentMembership.days_remaining
                                                }
                                            </span>
                                            <span className="text-[9px] text-neutral-500 sm:text-[10px]">
                                                days left
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col justify-center">
                                <p className="text-sm text-neutral-300">
                                    You don&apos;t have an active membership
                                    yet.
                                </p>
                                <Link
                                    href="/onboarding"
                                    className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300"
                                >
                                    Choose a plan
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Quick access */}
                    <div className="flex flex-col gap-1.5 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3 sm:gap-2 sm:p-4">
                        <Link
                            href="/member/payments"
                            className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-neutral-800/60 sm:px-3 sm:py-3"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 sm:h-9 sm:w-9">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-100">
                                    Payments
                                </p>
                                <p className="text-xs text-neutral-500">
                                    View your history
                                </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-neutral-600 transition group-hover:text-neutral-400" />
                        </Link>

                        <Link
                            href="/qraccess"
                            className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-neutral-800/60 sm:px-3 sm:py-3"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 sm:h-9 sm:w-9">
                                <QrCode className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-100">
                                    Show QR code
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Enter the gym
                                </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-neutral-600 transition group-hover:text-neutral-400" />
                        </Link>

                        <Link
                            href="/member/membership"
                            className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-neutral-800/60 sm:px-3 sm:py-3"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 sm:h-9 sm:w-9">
                                <Flame className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-100">
                                    Manage plan
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Renew or change plan
                                </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-neutral-600 transition group-hover:text-neutral-400" />
                        </Link>
                    </div>
                </div>

                {/* Consistency section header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white sm:text-xl">
                            Your consistency
                        </h2>
                        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                            The best workout is the one you keep coming back to.
                        </p>
                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={pickerOpen}
                            onClick={() => setPickerOpen((v) => !v)}
                            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-200 transition hover:border-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:px-4 sm:py-2 sm:text-sm"
                        >
                            <Calendar className="h-3.5 w-3.5 text-neutral-500 sm:h-4 sm:w-4" />
                            {selectedMonthLabel}
                            <ChevronDown className="h-3.5 w-3.5 text-neutral-500 sm:h-4 sm:w-4" />
                        </button>

                        {pickerOpen && (
                            <div
                                role="listbox"
                                className="absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl"
                            >
                                {availableMonths.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        role="option"
                                        aria-selected={
                                            m.value === selectedMonth
                                        }
                                        onClick={() => goToMonth(m.value)}
                                        className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-neutral-800 ${
                                            m.value === selectedMonth
                                                ? "text-amber-400"
                                                : "text-neutral-300"
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                    {statCards.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={s.key}
                                className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 sm:p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${colorMap[s.color]}`}
                                    >
                                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </div>
                                    {s.change !== null && (
                                        <span
                                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                                s.change >= 0
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-red-500/10 text-red-400"
                                            }`}
                                        >
                                            {s.change >= 0 ? (
                                                <TrendingUp className="h-2.5 w-2.5" />
                                            ) : (
                                                <TrendingDown className="h-2.5 w-2.5" />
                                            )}
                                            {Math.abs(s.change)}%
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2.5 text-xl font-semibold text-white sm:mt-3 sm:text-2xl">
                                    {s.value}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] text-neutral-500 sm:text-xs">
                                    {s.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Attendance map */}
                    <div className="flex h-full flex-col rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5">
                        <div className="flex items-baseline justify-between">
                            <h3 className="text-sm font-medium text-neutral-200">
                                Attendance map
                            </h3>
                            <span className="text-xs text-neutral-500">
                                {selectedMonthLabel}
                            </span>
                        </div>

                        <div className="mx-auto mt-4 w-full max-w-[280px]">
                            <div className="grid grid-cols-7 justify-items-center gap-1 text-center text-[10px] text-neutral-500">
                                {["M", "T", "W", "T", "F", "S", "S"].map(
                                    (d, i) => (
                                        <div key={i}>{d}</div>
                                    ),
                                )}
                            </div>

                            <div className="mt-1.5 grid grid-cols-7 justify-items-center gap-1">
                                {Array.from({ length: leadingBlanks }).map(
                                    (_, i) => (
                                        <div
                                            key={`blank-${i}`}
                                            className="h-7 w-7"
                                        />
                                    ),
                                )}
                                {calendar.map((d) => (
                                    <div
                                        key={d.date}
                                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-medium ${
                                            d.checked_in
                                                ? "border border-amber-500/60 bg-amber-500/10 text-amber-400"
                                                : d.is_future
                                                  ? "bg-neutral-900 text-neutral-700"
                                                  : "bg-neutral-800/60 text-neutral-500"
                                        }`}
                                    >
                                        {d.day}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-center gap-4 pt-4 text-[11px] text-neutral-500">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-sm bg-amber-500" />
                                Checked in
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-sm bg-neutral-700" />
                                Rest day
                            </span>
                        </div>
                    </div>

                    {/* Weekly rhythm */}
                    <div className="flex h-full flex-col rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5">
                        <div className="flex items-baseline justify-between">
                            <h3 className="text-sm font-medium text-neutral-200">
                                Visits over time
                            </h3>
                            <span className="text-xs text-neutral-500">
                                Weekly
                            </span>
                        </div>

                        <div className="flex flex-1 flex-col justify-center">
                            {hasAnyVisits ? (
                                <div className="flex h-24 gap-2 sm:h-28">
                                    {weeklyRhythm.map((w, i) => (
                                        <div
                                            key={i}
                                            className="flex h-full flex-1 flex-col justify-end gap-1.5"
                                        >
                                            <div className="flex w-full flex-1 items-end">
                                                {w.visits > 0 && (
                                                    <div
                                                        className="w-full rounded-t-sm bg-amber-500/70"
                                                        style={{
                                                            height: `${(w.visits / maxWeekVisits) * 100}%`,
                                                        }}
                                                        title={`${w.visits} visits`}
                                                    />
                                                )}
                                            </div>
                                            <span className="text-center text-[10px] text-neutral-600">
                                                {w.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-800 sm:h-28">
                                    <Calendar className="h-4 w-4 text-neutral-700" />
                                    <p className="text-xs text-neutral-600">
                                        No visits logged yet this month
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto flex items-center gap-6 border-t border-neutral-800 pt-4 sm:gap-8">
                            <div>
                                <p className="text-base font-semibold text-white sm:text-lg">
                                    {avgVisitsPerWeek}
                                </p>
                                <p className="text-[11px] text-neutral-500">
                                    Avg visits / week
                                </p>
                            </div>
                            <div>
                                <p className="text-base font-semibold text-white sm:text-lg">
                                    {stats.visitsChangeVsLastMonth >= 0
                                        ? "+"
                                        : ""}
                                    {stats.visitsChangeVsLastMonth}%
                                </p>
                                <p className="text-[11px] text-neutral-500">
                                    From last month
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent check-ins */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-neutral-200">
                        Recent check-ins
                    </h3>

                    {recentCheckIns.length === 0 ? (
                        <p className="mt-4 text-sm text-neutral-500">
                            No check-ins yet — scan in at the front desk to get
                            started.
                        </p>
                    ) : (
                        <div className="mt-2 divide-y divide-neutral-800">
                            {recentCheckIns.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 sm:h-9 sm:w-9">
                                            <QrCode className="h-4 w-4" />
                                        </div>
                                        <div>
                                            {/* Placeholder: no Gym/Location model available */}
                                            <p className="text-sm font-medium text-neutral-100">
                                                FitFlow Main Gym
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {c.when}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 sm:px-2.5 sm:text-xs">
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        Verified
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
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
