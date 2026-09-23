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

    // Ring geometry for membership progress.
    // percent_used = how much of the billing period has elapsed (0 at the
    // start of the sub, 100 once it's fully used up). The ring should show
    // the opposite: full orange when the sub just started, draining down as
    // days run out — so we draw the *remaining* percentage, not the used one.
    const RADIUS = 42;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const percentRemaining = currentMembership
        ? Math.min(100, Math.max(0, 100 - currentMembership.percent_used))
        : 0;
    const ringOffset = CIRCUMFERENCE * (1 - percentRemaining / 100);

    const statCards = [
        {
            key: "visits",
            label: "Gym visits",
            value: String(stats.visits),
            icon: QrCode,
            color: "bg-blue-500/10 text-blue-400",
            change: stats.visitsChangeVsLastMonth,
        },
        {
            key: "streak",
            label: `Current streak · best ${stats.bestStreak}d`,
            value: `${stats.currentStreak}d`,
            icon: Flame,
            color: "bg-primary/10 text-primary",
            change: null,
        },
        {
            key: "attendance",
            label: stats.attendanceRateAboveAverage
                ? "Attendance · above average"
                : "Attendance · below average",
            value: `${stats.attendanceRate}%`,
            icon: HeartPulse,
            color: "bg-emerald-500/10 text-emerald-400",
            change: null,
        },
    ] as const;

    const quickLinks = [
        {
            key: "payments",
            href: "/member/payments",
            title: "Payments",
            subtitle: "View history",
            icon: CreditCard,
            color: "bg-blue-500/10 text-blue-400",
        },
        {
            key: "qr",
            href: "/qraccess",
            title: "Show QR code",
            subtitle: "Enter the gym",
            icon: QrCode,
            color: "bg-emerald-500/10 text-emerald-400",
        },
        {
            key: "manage",
            href: "/member/membership",
            title: "Manage plan",
            subtitle: "Renew or change",
            icon: Flame,
            color: "bg-primary/10 text-primary",
        },
    ] as const;

    const monthPicker = (
        <div className="relative">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((v) => !v)}
                className="flex items-center gap-1 rounded-full border border-border/70 bg-background/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-border hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-xs"
            >
                <Calendar className="h-3 w-3" />
                {selectedMonthLabel}
                <ChevronDown className="h-3 w-3" />
            </button>

            {pickerOpen && (
                <div
                    role="listbox"
                    className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
                >
                    {availableMonths.map((m) => (
                        <button
                            key={m.value}
                            type="button"
                            role="option"
                            aria-selected={m.value === selectedMonth}
                            onClick={() => goToMonth(m.value)}
                            className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-accent ${
                                m.value === selectedMonth
                                    ? "text-primary"
                                    : "text-foreground/80"
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    // Each section is built once as a JSX value below, then placed into two
    // different parent layouts further down: a single-column mobile/tablet
    // stack (in the exact order requested) and a two-column desktop layout.
    // Only one of the two wrappers is visible at a time (toggled with
    // `lg:hidden` / `hidden lg:flex`), so there's no logic duplication and
    // no risk of the two layouts drifting apart.

    const heroCard = (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />

            {currentMembership ? (
                <div className="relative flex flex-row-reverse items-center justify-between gap-4 sm:gap-6">
                    {/* Progress ring — left on mobile, right on sm+ (flex-row-reverse) */}
                    <div className="flex shrink-0 flex-col items-center self-center">
                        <div className="relative flex h-16 w-16 items-center justify-center sm:h-28 sm:w-28">
                            <svg
                                viewBox="0 0 100 100"
                                className="h-16 w-16 -rotate-90 sm:h-28 sm:w-28"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={RADIUS}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-border"
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
                                    className="text-primary transition-[stroke-dashoffset] duration-500"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-sm font-semibold text-foreground sm:text-xl">
                                    {currentMembership.days_remaining}
                                </span>
                                <span className="text-[8px] text-muted-foreground sm:text-[10px]">
                                    days left
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {currentMembership.status === "active"
                                    ? "Active"
                                    : currentMembership.status}
                            </span>

                            {monthPicker}
                        </div>

                        <h1 className="truncate text-lg font-semibold text-foreground sm:text-2xl">
                            {currentMembership.plan_name}
                        </h1>
                        <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
                            {currentMembership.tagline}
                        </p>

                        <div className="mt-4 flex gap-6 text-xs sm:mt-5 sm:gap-8 sm:text-sm">
                            <div>
                                <p className="text-muted-foreground">
                                    Valid until
                                </p>
                                <p className="mt-0.5 font-medium text-foreground">
                                    {currentMembership.valid_until ?? "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">
                                    Days remaining
                                </p>
                                <p className="mt-0.5 font-medium text-foreground">
                                    {currentMembership.days_remaining} days
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/member/membership"
                            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary transition hover:opacity-80 sm:mt-5 sm:text-sm"
                        >
                            Manage plan
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="relative flex h-full flex-col justify-center">
                    <p className="text-sm text-foreground/80">
                        You don&apos;t have an active membership yet.
                    </p>
                    <Link
                        href="/onboarding"
                        className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
                    >
                        Choose a plan
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            )}
        </div>
    );

    const quickAccessCard = (
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2">
                {quickLinks.map((q) => {
                    const Icon = q.icon;
                    return (
                        <Link
                            key={q.key}
                            href={q.href}
                            className="group flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-background/30 px-2 py-3 text-center transition hover:border-border hover:bg-accent"
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${q.color}`}
                            >
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium text-foreground sm:text-xs">
                                    {q.title}
                                </p>
                                <p className="hidden truncate text-[10px] text-muted-foreground sm:block">
                                    {q.subtitle}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );

    const statsCard = (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {statCards.map((s) => {
                const Icon = s.icon;
                return (
                    <div
                        key={s.key}
                        className="relative overflow-hidden rounded-xl border border-border bg-card p-2.5 sm:p-4"
                    >
                        <Icon className="pointer-events-none absolute -right-2 -bottom-2 h-10 w-10 rotate-[15deg] text-foreground opacity-[0.06] sm:-right-3 sm:-bottom-3 sm:h-14 sm:w-14" />

                        <div className="relative flex items-center justify-between gap-1">
                            <div
                                className={`flex h-6 w-6 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${s.color}`}
                            >
                                <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                            {s.change !== null && (
                                <span
                                    className={`inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[8px] font-medium sm:px-1.5 sm:text-[10px] ${
                                        s.change >= 0
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-red-500/10 text-red-400"
                                    }`}
                                >
                                    {s.change >= 0 ? (
                                        <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                    ) : (
                                        <TrendingDown className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                    )}
                                    {Math.abs(s.change)}%
                                </span>
                            )}
                        </div>
                        <p className="relative mt-2 text-base font-semibold text-foreground sm:mt-3 sm:text-2xl">
                            {s.value}
                        </p>
                        <p className="relative mt-0.5 text-[9px] leading-snug text-muted-foreground sm:mt-0.5 sm:truncate sm:text-xs">
                            {s.label}
                        </p>
                    </div>
                );
            })}
        </div>
    );

    const visitsCard = (
        <div className="flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-medium text-foreground">
                    Visits over time
                </h3>
                <span className="text-xs text-muted-foreground">Weekly</span>
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
                                            className="w-full rounded-t-sm bg-primary/70"
                                            style={{
                                                height: `${(w.visits / maxWeekVisits) * 100}%`,
                                            }}
                                            title={`${w.visits} visits`}
                                        />
                                    )}
                                </div>
                                <span className="text-center text-[10px] text-muted-foreground/70">
                                    {w.label}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border sm:h-28">
                        <Calendar className="h-4 w-4 text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground">
                            No visits logged yet this month
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center gap-6 border-t border-border pt-4 sm:gap-8">
                <div>
                    <p className="text-base font-semibold text-foreground sm:text-lg">
                        {avgVisitsPerWeek}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        Avg visits / week
                    </p>
                </div>
                <div>
                    <p className="text-base font-semibold text-foreground sm:text-lg">
                        {stats.visitsChangeVsLastMonth >= 0 ? "+" : ""}
                        {stats.visitsChangeVsLastMonth}%
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        From last month
                    </p>
                </div>
            </div>
        </div>
    );

    const attendanceCard = (
        <div className="flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-medium text-foreground">
                    Attendance map
                </h3>
                <span className="text-xs text-muted-foreground">
                    {selectedMonthLabel}
                </span>
            </div>

            <div className="mx-auto mt-4 w-full max-w-[280px]">
                <div className="grid grid-cols-7 justify-items-center gap-1 text-center text-[10px] text-muted-foreground">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <div key={i}>{d}</div>
                    ))}
                </div>

                <div className="mt-1.5 grid grid-cols-7 justify-items-center gap-1">
                    {Array.from({ length: leadingBlanks }).map((_, i) => (
                        <div key={`blank-${i}`} className="h-7 w-7" />
                    ))}
                    {calendar.map((d) => (
                        <div
                            key={d.date}
                            className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-medium ${
                                d.checked_in
                                    ? "border border-primary/60 bg-primary/10 text-primary"
                                    : d.is_future
                                      ? "bg-muted/30 text-muted-foreground/50"
                                      : "bg-muted/60 text-muted-foreground"
                            }`}
                        >
                            {d.day}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 pt-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-primary" />
                    Checked in
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-muted-foreground/40" />
                    Rest day
                </span>
            </div>
        </div>
    );

    const recentCheckinsCard = (
        <div className="flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5">
            <h3 className="text-sm font-medium text-foreground">
                Recent check-ins
            </h3>

            {recentCheckIns.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                    No check-ins yet — scan in at the front desk to get started.
                </p>
            ) : (
                <div className="mt-1 divide-y divide-border overflow-y-auto">
                    {recentCheckIns.map((c) => (
                        <div
                            key={c.id}
                            className="flex items-center justify-between gap-2 py-3"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                                    <QrCode className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    {/* Placeholder: no Gym/Location model available */}
                                    <p className="truncate text-sm font-medium text-foreground">
                                        FitFlow Main Gym
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {c.when}
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                Verified
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-3 overflow-x-auto rounded-xl p-3 sm:gap-4 sm:p-4 md:p-6">
                {!hasSubscription && (
                    <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-accent-foreground sm:text-sm">
                            You&apos;re browsing with limited access. Pick a
                            plan to unlock full features.
                        </p>
                        <Link
                            href="/onboarding"
                            className="w-fit whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-sm"
                        >
                            Choose a plan
                        </Link>
                    </div>
                )}

                {/*
                    Mobile / tablet (< lg): one flex column, so every card's
                    height is purely its own content — nothing is paired
                    into a shared grid row, so there's never dead space
                    under a shorter card. Order here is exactly what was
                    asked for: Hero, Quick access, Stats, Attendance map,
                    Visits over time, Recent check-ins.
                */}
                <div className="flex flex-col gap-3 sm:gap-4 lg:hidden">
                    {heroCard}
                    {quickAccessCard}
                    {statsCard}
                    {attendanceCard}
                    {visitsCard}
                    {recentCheckinsCard}
                </div>

                {/*
                    Desktop (lg+): two independent columns side by side.
                    Each column is its own flex-col, so its total height is
                    just the sum of its own cards — it is never forced to
                    match the other column's height. That's what removes
                    the old dead space under Quick access and under the
                    stat cards (they used to be grid-row-paired with the
                    taller Hero and Visits cards).
                */}
                <div className="hidden flex-col gap-4 lg:flex">
                    <div className="grid grid-cols-[1.6fr_1fr] items-start gap-4">
                        <div className="flex flex-col gap-4">
                            {heroCard}
                            {statsCard}
                        </div>
                        <div className="flex flex-col gap-4">
                            {quickAccessCard}
                            {visitsCard}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 items-stretch gap-4">
                        {attendanceCard}
                        {recentCheckinsCard}
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
