import { Head, Link, usePage } from "@inertiajs/react";
import { dashboard } from "@/routes";
import LoginDialog from "@/components/login-dialog";
import AppLogo from "@/components/app-logo";
import AppearanceToggleIcon from "@/components/appearance-toggle-icon";
import {
    ArrowRight,
    BarChart3,
    CalendarCheck,
    Check,
    CreditCard,
    Flame,
    TriangleAlert,
    Users,
} from "lucide-react";

type PageProps = {
    auth: { user: { id: number } | null };
};

const weekAttendance = [
    { day: "M", height: 38 },
    { day: "T", height: 62 },
    { day: "W", height: 48 },
    { day: "T", height: 82 },
    { day: "F", height: 96 },
    { day: "S", height: 54 },
    { day: "S", height: 20 },
];

// 4 weeks, 7 days each — 1 = checked in, 0 = missed
const streakDays = [
    1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
    1, 1, 1,
];

const features = [
    {
        icon: Users,
        title: "Members & staff",
        description:
            "Every profile, role, and plan lives in one roster — no more juggling three spreadsheets to answer one question.",
    },
    {
        icon: CalendarCheck,
        title: "Attendance",
        description:
            "Check-ins are logged at the door and roll straight into today's numbers, no manual entry required.",
    },
    {
        icon: CreditCard,
        title: "Payments & renewals",
        description:
            "Plans bill on their own cycle. When one's about to lapse, renewing takes one tap instead of a phone call.",
    },
    {
        icon: BarChart3,
        title: "Revenue analytics",
        description:
            "Revenue, active members, and payment success update as it happens, not at the end of the month.",
    },
];

const steps = [
    {
        title: "Check in",
        description:
            "Members tap in at the front desk. No forms, no waiting at the counter.",
    },
    {
        title: "Build a streak",
        description:
            "Every visit adds to their count, right there on their own dashboard.",
    },
    {
        title: "Renew in a tap",
        description:
            "A reminder lands before a plan expires, and renewing takes one tap.",
    },
];

export default function Welcome() {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="My Gymrat — Run your gym at full strength" />

            <div className="min-h-screen bg-background text-foreground">
                {/* Nav */}
                <header className="sticky top-0 z-40 border-b border-border/60">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                        <AppLogo />

                        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
                            <a
                                href="#features"
                                className="transition hover:text-foreground"
                            >
                                Features
                            </a>
                            <a
                                href="#streaks"
                                className="transition hover:text-foreground"
                            >
                                Streaks
                            </a>
                            <a
                                href="#how-it-works"
                                className="transition hover:text-foreground"
                            >
                                How it works
                            </a>
                        </nav>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <AppearanceToggleIcon />

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <LoginDialog
                                    trigger={
                                        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                                            Get started
                                        </button>
                                    }
                                />
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="mx-auto grid max-w-6xl gap-14 px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                                <Flame className="h-3.5 w-3.5 text-primary" />
                                Built around the streak, not the spreadsheet
                            </div>

                            <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                                Every check-in counts.
                            </h1>

                            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
                                My Gymrat runs the front desk, the streaks, and
                                the renewals — so your members keep showing up,
                                and you can see exactly why.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <LoginDialog
                                    trigger={
                                        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                                            Get started
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    }
                                />
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/60"
                                >
                                    See how it works
                                </a>
                            </div>

                            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />{" "}
                                    Attendance & streaks
                                </span>
                                <span className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />{" "}
                                    One-tap renewals
                                </span>
                                <span className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />{" "}
                                    Live revenue
                                </span>
                            </div>
                        </div>

                        {/* Hero visual */}
                        <div className="relative">
                            <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />

                            <div className="relative rounded-2xl border border-border bg-card/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Your streak
                                    </p>
                                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        Checked in today
                                    </span>
                                </div>

                                <div className="mt-2 flex items-end gap-2">
                                    <Flame className="mb-1 h-8 w-8 text-primary" />
                                    <span className="text-4xl font-bold">
                                        18
                                    </span>
                                    <span className="mb-1 text-sm text-muted-foreground">
                                        days
                                    </span>
                                </div>

                                <div className="mt-6 flex items-end gap-2">
                                    {weekAttendance.map((d) => (
                                        <div
                                            key={d.day + d.height}
                                            className="flex flex-1 flex-col items-center gap-2"
                                        >
                                            <div className="flex h-20 w-full items-end rounded-md bg-muted">
                                                <div
                                                    className="w-full rounded-md bg-primary"
                                                    style={{
                                                        height: `${d.height}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {d.day}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        Plan renewed automatically
                                    </div>
                                    <Check className="h-4 w-4 text-emerald-400" />
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-xl border border-border bg-card p-3 shadow-xl shadow-black/30 sm:block">
                                <div className="flex items-start gap-2">
                                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                    <div>
                                        <p className="text-xs font-medium text-amber-400">
                                            Plan expiring in 3 days
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                            Renew now to keep your streak
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section
                    id="features"
                    className="border-t border-border/60 bg-muted/20"
                >
                    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                        <div className="max-w-xl">
                            <p className="text-sm font-medium text-primary">
                                Everything in one place
                            </p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                Run the gym without running spreadsheets
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Members, staff, attendance, and money — one
                                system your whole team already knows how to use.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="rounded-2xl border border-border bg-card p-6"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <feature.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-4 font-semibold">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Streaks */}
                <section id="streaks" className="border-t border-border/60">
                    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
                        <div>
                            <p className="text-sm font-medium text-primary">
                                The streak
                            </p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                Missing a day feels different when you can see
                                it
                            </h2>
                            <p className="mt-4 max-w-md text-muted-foreground">
                                Every check-in adds to a member's streak. My
                                Gymrat tracks it automatically and nudges them
                                before a missed day — or an expiring plan —
                                breaks the chain.
                            </p>

                            <div className="mt-8 flex items-center gap-6">
                                <div>
                                    <p className="text-3xl font-bold text-primary">
                                        18
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        day streak
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-border" />
                                <div>
                                    <p className="text-3xl font-bold">24</p>
                                    <p className="text-xs text-muted-foreground">
                                        visits this month
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    Last 4 weeks
                                </p>
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="h-2 w-2 rounded-sm bg-primary" />
                                    checked in
                                </span>
                            </div>
                            <div className="mt-5 grid grid-cols-7 gap-2">
                                {streakDays.map((present, i) => (
                                    <div
                                        key={i}
                                        className={`aspect-square rounded-md ${
                                            present ? "bg-primary" : "bg-muted"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section
                    id="how-it-works"
                    className="border-t border-border/60 bg-muted/20"
                >
                    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                        <div className="max-w-xl">
                            <p className="text-sm font-medium text-primary">
                                How it works
                            </p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                                Three steps, every visit
                            </h2>
                        </div>

                        <div className="mt-12 grid gap-10 sm:grid-cols-3">
                            {steps.map((step, i) => (
                                <div key={step.title}>
                                    <span className="text-sm font-semibold text-primary">
                                        0{i + 1}
                                    </span>
                                    <h3 className="mt-3 text-lg font-semibold">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="border-t border-border/60">
                    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 text-center sm:p-16">
                            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

                            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
                                Ready to run your gym at full strength?
                            </h2>
                            <p className="relative mt-3 text-muted-foreground">
                                Set up members, staff, and plans in one sitting.
                            </p>
                            <div className="relative mt-8 flex justify-center">
                                <LoginDialog
                                    trigger={
                                        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                                            Get started
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border/60">
                    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
                        <AppLogo />
                        <p>
                            © {new Date().getFullYear()} My Gymrat. All rights
                            reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
