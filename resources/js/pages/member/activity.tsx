import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { Calendar, Flame, HeartPulse, QrCode, ChevronDown } from "lucide-react";
import { dashboard } from "@/routes";

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

export default function Activity({
    selectedMonth,
    selectedMonthLabel,
    availableMonths = [],
    calendar = [],
    stats,
    weeklyRhythm = [],
    avgVisitsPerWeek,
    recentCheckIns = [],
}: {
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
            "/member/activity",
            { year, month: Number(month) },
            { preserveScroll: true, preserveState: true },
        );
    };

    // Leading blank cells so the grid starts on the correct weekday (Mon-first)
    const leadingBlanks = calendar.length ? calendar[0].weekday - 1 : 0;
    const maxWeekVisits = Math.max(1, ...weeklyRhythm.map((w) => w.visits));

    return (
        <>
            <Head title="Activity" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                            Activity &amp; Attendance
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            Your consistency
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            The best workout is the one you keep coming back to.
                        </p>
                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setPickerOpen((v) => !v)}
                            className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium hover:bg-muted/60"
                        >
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {selectedMonthLabel}
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>

                        {pickerOpen && (
                            <div className="absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                                {availableMonths.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => goToMonth(m.value)}
                                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-muted/60 ${
                                            m.value === selectedMonth
                                                ? "text-amber-400"
                                                : "text-foreground"
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-amber-400" />
                            <span className="text-2xl font-semibold">
                                {stats.visits}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gym visits
                        </p>
                        <p className="mt-1 text-xs text-emerald-400">
                            {stats.visitsChangeVsLastMonth >= 0 ? "↗" : "↘"}{" "}
                            {Math.abs(stats.visitsChangeVsLastMonth)}% vs last
                            month
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2">
                            <Flame className="h-5 w-5 text-amber-400" />
                            <span className="text-2xl font-semibold">
                                {stats.currentStreak}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Current streak
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Best streak · {stats.bestStreak} days
                        </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2">
                            <HeartPulse className="h-5 w-5 text-amber-400" />
                            <span className="text-2xl font-semibold">
                                {stats.attendanceRate}%
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Attendance rate
                        </p>
                        <p
                            className={`mt-1 text-xs ${
                                stats.attendanceRateAboveAverage
                                    ? "text-emerald-400"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {stats.attendanceRateAboveAverage
                                ? "Above your average"
                                : "Below your average"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Attendance map */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                            Attendance map
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-amber-400">
                            {selectedMonthLabel}
                        </h2>

                        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
                            {[
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                                "Sun",
                            ].map((d) => (
                                <div key={d}>{d}</div>
                            ))}
                        </div>

                        <div className="mt-2 grid grid-cols-7 gap-2">
                            {Array.from({ length: leadingBlanks }).map(
                                (_, i) => (
                                    <div key={`blank-${i}`} />
                                ),
                            )}
                            {calendar.map((d) => (
                                <div
                                    key={d.date}
                                    className={`flex aspect-square items-center justify-center rounded-lg text-sm font-medium ${
                                        d.checked_in
                                            ? "border border-amber-500 bg-amber-500/10 text-amber-400"
                                            : d.is_future
                                              ? "bg-muted/20 text-muted-foreground/50"
                                              : "bg-muted/40 text-muted-foreground"
                                    }`}
                                >
                                    {d.day}
                                    {d.checked_in && (
                                        <span className="ml-0.5">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-sm bg-amber-500" />{" "}
                                Checked in
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-sm bg-muted-foreground/40" />{" "}
                                Rest day
                            </span>
                        </div>
                    </div>

                    {/* Weekly rhythm */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                            Weekly rhythm
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-amber-400">
                            Visits over time
                        </h2>

                        <div className="mt-6 flex h-40 gap-2">
                            {weeklyRhythm.map((w, i) => (
                                <div
                                    key={i}
                                    className="flex h-full flex-1 flex-col justify-end gap-2"
                                >
                                    <div className="flex w-full flex-1 items-end">
                                        <div
                                            className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400"
                                            style={{
                                                height: `${Math.max(4, (w.visits / maxWeekVisits) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {w.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center gap-8 border-t border-border pt-4">
                            <div>
                                <p className="text-lg font-semibold text-amber-400">
                                    {avgVisitsPerWeek}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Average visits / week
                                </p>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-amber-400">
                                    {stats.visitsChangeVsLastMonth >= 0
                                        ? "+"
                                        : ""}
                                    {stats.visitsChangeVsLastMonth}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    From last month
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent check-ins */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Recent check-ins
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-amber-400">
                        You showed up
                    </h2>

                    {recentCheckIns.length === 0 ? (
                        <p className="mt-6 text-sm text-muted-foreground">
                            No check-ins yet — scan in at the front desk to get
                            started.
                        </p>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                            {recentCheckIns.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between border-b border-border pb-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <QrCode className="h-4 w-4" />
                                        </div>
                                        <div>
                                            {/* Placeholder: no Gym/Location model available */}
                                            <p className="text-sm font-medium text-amber-400">
                                                FitFlow Main Gym
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {c.when}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
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

Activity.layout = {
    breadcrumbs: [
        {
            title: "Activity",
            href: dashboard(),
        },
    ],
};
