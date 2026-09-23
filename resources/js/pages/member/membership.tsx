import { Head, Link, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { dashboard } from "@/routes";
import { Button } from "@/components/ui/button";

type BillingCycle = "monthly" | "annual";

type CurrentSubscription = {
    plan_id: number;
    plan_name: string;
    plan_slug: string;
    billing_cycle: BillingCycle;
    status: string;
    started_at: string | null;
    valid_until: string | null;
    days_remaining: number;
    percent_used: number;
};

type Plan = {
    id: number;
    name: string;
    slug: string;
    tagline: string;
    highlighted: boolean;
    pricing: {
        monthly: {
            base_amount: number;
            tax_amount: number;
            total_amount: number;
            per_month_equivalent: number;
        };
        annual: {
            base_amount: number;
            tax_amount: number;
            total_amount: number;
            per_month_equivalent: number;
        };
    };
};

function formatPeso(centavos: number) {
    return `₱${(centavos / 100).toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}

export default function Membership({
    currentSubscription,
    plans,
}: {
    currentSubscription: CurrentSubscription | null;
    plans: Plan[];
}) {
    const [cycle, setCycle] = useState<BillingCycle>(
        currentSubscription?.billing_cycle ?? "monthly",
    );
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
        currentSubscription?.plan_id ?? plans[0]?.id ?? null,
    );

    const selectedPlan = useMemo(
        () => plans.find((p) => p.id === selectedPlanId) ?? null,
        [plans, selectedPlanId],
    );

    const isSamePlanAndCycle =
        !!currentSubscription &&
        currentSubscription.plan_id === selectedPlanId &&
        currentSubscription.billing_cycle === cycle;

    function goToCheckout() {
        if (!selectedPlanId) return;

        router.get(
            "/member/membership/checkout",
            { plan_id: selectedPlanId, billing_cycle: cycle },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Membership" />

            <div className="mx-auto max-w-6xl space-y-1 p-3 sm:p-6">
                <p className="text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
                    Membership &amp; Plans
                </p>
                <div className="flex flex-row items-center justify-between gap-2">
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-bold text-foreground sm:text-3xl">
                            Your membership
                        </h1>
                        <p className="truncate text-[11px] text-muted-foreground sm:text-sm">
                            Keep your access active and make every session
                            count.
                        </p>
                    </div>
                    <div className="shrink-0">
                        <Button
                            asChild
                            size="sm"
                            className="h-7 px-2.5 text-[11px] sm:h-9 sm:px-4 sm:text-sm"
                        >
                            <Link href="/member/payments">Payments</Link>
                        </Button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[1fr_1fr]">
                    {/* Current plan */}
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6">
                        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

                        {currentSubscription ? (
                            <div className="relative">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
                                        Your current plan
                                    </p>
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 sm:px-3 sm:text-xs">
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        {currentSubscription.status === "active"
                                            ? "Active"
                                            : currentSubscription.status}
                                    </span>
                                </div>

                                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                                    {currentSubscription.plan_name}
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                    Billed{" "}
                                    {currentSubscription.billing_cycle ===
                                    "annual"
                                        ? "annually"
                                        : "monthly"}
                                </p>

                                <div className="mt-5 grid grid-cols-3 gap-3 text-xs sm:mt-6 sm:gap-4 sm:text-sm">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Started
                                        </p>
                                        <p className="font-medium text-primary">
                                            {currentSubscription.started_at ??
                                                "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Valid until
                                        </p>
                                        <p className="font-medium text-primary">
                                            {currentSubscription.valid_until ??
                                                "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Remaining
                                        </p>
                                        <p className="font-medium text-primary">
                                            {currentSubscription.days_remaining}{" "}
                                            days
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted sm:mt-6">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{
                                            width: `${currentSubscription.percent_used}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                                    {currentSubscription.percent_used}% of your
                                    plan
                                </p>

                                <div className="mt-5 flex gap-3 sm:mt-6">
                                    <button
                                        onClick={() => {
                                            setSelectedPlanId(
                                                currentSubscription.plan_id,
                                            );
                                            setCycle(
                                                currentSubscription.billing_cycle,
                                            );
                                            router.get(
                                                "/member/membership/checkout",
                                                {
                                                    plan_id:
                                                        currentSubscription.plan_id,
                                                    billing_cycle:
                                                        currentSubscription.billing_cycle,
                                                },
                                                { preserveScroll: true },
                                            );
                                        }}
                                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 sm:text-sm"
                                    >
                                        ↻ Renew membership
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="relative text-sm text-muted-foreground">
                                You don't have an active membership yet.
                            </p>
                        )}
                    </div>

                    {/* Plan picker */}
                    <div>
                        <div className="mb-4 flex flex-row items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium tracking-wide text-primary uppercase sm:text-xs">
                                    Find your fit
                                </p>
                                <h2 className="truncate text-sm font-bold text-foreground sm:text-xl">
                                    Choose a plan
                                </h2>
                            </div>

                            <div className="flex w-fit shrink-0 rounded-lg border border-border p-0.5 text-[10px] sm:p-1 sm:text-xs">
                                <button
                                    onClick={() => setCycle("monthly")}
                                    className={`rounded-md px-2 py-0.5 font-medium transition sm:px-3 sm:py-1 ${
                                        cycle === "monthly"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setCycle("annual")}
                                    className={`rounded-md px-2 py-0.5 font-medium transition sm:px-3 sm:py-1 ${
                                        cycle === "annual"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    Annual
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2.5 sm:space-y-3">
                            {plans.map((plan) => {
                                const price = plan.pricing[cycle].total_amount;
                                const isCurrent =
                                    currentSubscription?.plan_id === plan.id &&
                                    currentSubscription?.billing_cycle ===
                                        cycle;
                                const isSelected = selectedPlanId === plan.id;

                                return (
                                    <button
                                        key={plan.id}
                                        onClick={() =>
                                            setSelectedPlanId(plan.id)
                                        }
                                        className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition sm:p-4 ${
                                            isSelected
                                                ? "border-primary bg-primary/10"
                                                : "border-border bg-card"
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                <span className="text-sm font-semibold text-foreground sm:text-base">
                                                    {plan.name}
                                                </span>
                                                {plan.highlighted && (
                                                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                        Most popular
                                                    </span>
                                                )}
                                                {isCurrent && (
                                                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                                {plan.tagline}
                                            </p>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-semibold text-primary sm:text-base">
                                                {formatPeso(price)}
                                            </p>

                                            <p className="text-[11px] text-muted-foreground sm:text-xs">
                                                {cycle === "annual"
                                                    ? "per year"
                                                    : "per month"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={goToCheckout}
                            disabled={!selectedPlan}
                            className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:py-3"
                        >
                            {isSamePlanAndCycle
                                ? `Renew ${selectedPlan?.name ?? ""}`
                                : `Continue with ${selectedPlan?.name ?? ""}`}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

Membership.layout = {
    breadcrumbs: [
        {
            title: "Membership",
            href: dashboard(),
        },
    ],
};
