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
            <Head title="My Gymrat — Membership Redefined" />

            <div className="min-h-screen bg-background text-foreground">
                {/* Nav */}
                <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                        <AppLogo />

                        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm text-muted-foreground md:flex">
                            <a
                                href="#"
                                className="transition hover:text-foreground"
                            >
                                Home
                            </a>
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
                            <a
                                href="#contact"
                                className="transition hover:text-foreground"
                            >
                                Contact
                            </a>
                        </nav>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <AppearanceToggleIcon />

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <LoginDialog
                                    trigger={
                                        <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                                            Get started
                                        </button>
                                    }
                                />
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden border-b border-border/60">
                    <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:pt-14">
                        {/* decorative dot grid, desktop only */}
                        <div
                            className="pointer-events-none absolute top-20 right-0 hidden h-[28rem] w-[42%] lg:block"
                            style={{
                                backgroundImage:
                                    "radial-gradient(color-mix(in oklch, var(--foreground) 14%, transparent) 1.5px, transparent 1.5px)",
                                backgroundSize: "22px 22px",
                            }}
                        />

                        {/* Giant headline */}
                        <h1 className="relative z-10 text-center text-[2.75rem] leading-[0.85] font-black tracking-tight uppercase sm:text-6xl md:text-7xl lg:text-left lg:text-[5.5rem] xl:text-[6.5rem]">
                            Membership
                            <br />
                            Redefined
                        </h1>

                        {/* Photo row — pulled up over the headline on desktop */}
                        <div className="relative z-20 mt-8 lg:-mt-16 lg:grid lg:grid-cols-[0.85fr_1.3fr_0.9fr] lg:items-end lg:gap-6">
                            {/* Polaroid collage — desktop only */}
                            <div className="relative hidden h-72 lg:block">
                                <img
                                    src="https://images.unsplash.com/photo-1707538320664-1fca7c3c7770?q=80&w=500&auto=format&fit=crop"
                                    alt="Member resting between sets"
                                    className="absolute top-12 left-0 h-40 w-32 -rotate-6 rounded-lg border-4 border-card object-cover shadow-xl shadow-black/20"
                                />
                                <img
                                    src="https://images.unsplash.com/photo-1758875570185-eaed16371474?q=80&w=500&auto=format&fit=crop"
                                    alt="Trainer coaching a member"
                                    className="absolute top-0 left-24 h-44 w-36 rotate-3 rounded-lg border-4 border-card object-cover shadow-xl shadow-black/20"
                                />
                            </div>

                            {/* Main photo + badge */}
                            <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
                                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border">
                                    <img
                                        src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1400&auto=format&fit=crop"
                                        alt="Athlete lifting a barbell mid check-in"
                                        className="h-full w-full object-cover grayscale-[15%] contrast-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
                                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                                    <p className="absolute right-4 bottom-3 text-[10px] text-background/70 mix-blend-difference">
                                        Photo: Victor Freitas / Unsplash
                                    </p>
                                </div>

                                {/* Spinning badge */}
                                <div className="absolute -top-6 -right-6 h-24 w-24 sm:h-28 sm:w-28 lg:-top-8 lg:-right-8 lg:h-32 lg:w-32">
                                    <svg
                                        viewBox="0 0 100 100"
                                        className="h-full w-full animate-[spin_18s_linear_infinite] motion-reduce:animate-none"
                                    >
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="49"
                                            strokeWidth="1"
                                            className="fill-card stroke-border"
                                        />
                                        <path
                                            id="badgeCircle"
                                            d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                                            fill="none"
                                        />
                                        <text
                                            className="fill-primary font-semibold uppercase"
                                            style={{
                                                fontSize: "6.2px",
                                                letterSpacing: "2px",
                                            }}
                                        >
                                            <textPath
                                                href="#badgeCircle"
                                                startOffset="0%"
                                            >
                                                Stronger every day • Powered by
                                                Gymrat •{" "}
                                            </textPath>
                                        </text>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Flame className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                                    </div>
                                </div>
                            </div>

                            {/* Text stack — desktop only */}
                            <div className="hidden flex-col gap-0.5 pb-4 text-2xl font-bold lg:flex xl:text-3xl">
                                <p>Every check-in.</p>
                                <p>Every streak.</p>
                                <p className="text-primary">One dashboard.</p>
                            </div>
                        </div>

                        {/* Copy + CTA */}
                        <div className="relative z-20 mx-auto mt-10 max-w-xl pb-14 text-center sm:pb-20 lg:mx-0 lg:max-w-md lg:pb-24 lg:text-left">
                            <p className="text-muted-foreground sm:text-lg">
                                My Gymrat runs the front desk, the streaks, and
                                the renewals — so members keep coming back, and
                                you can see exactly why.
                            </p>

                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                                <LoginDialog
                                    trigger={
                                        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                                            Get started
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    }
                                />
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/60"
                                >
                                    See how it works
                                </a>
                            </div>

                            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start">
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
                    </div>
                </section>

                {/* Features */}
                <section
                    id="features"
                    className="border-b border-border/60 bg-muted/20"
                >
                    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
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
                <section id="streaks" className="border-b border-border/60">
                    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
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

                            <div className="mt-6 border-t border-border pt-5">
                                <p className="text-xs text-muted-foreground">
                                    This week
                                </p>
                                <div className="mt-3 flex items-end gap-2">
                                    {weekAttendance.map((d) => (
                                        <div
                                            key={d.day + d.height}
                                            className="flex flex-1 flex-col items-center gap-2"
                                        >
                                            <div className="flex h-14 w-full items-end rounded-md bg-muted">
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
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section
                    id="how-it-works"
                    className="border-b border-border/60 bg-muted/20"
                >
                    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
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
                <section className="border-b border-border/60">
                    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 text-center sm:p-16">
                            <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
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
                                        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
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
                <footer id="contact" className="border-b border-border/60">
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
