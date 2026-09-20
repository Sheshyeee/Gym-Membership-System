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

            <div className="mx-auto max-w-6xl space-y-1 p-6">
                <p className="text-xs font-medium tracking-wide text-orange-400 uppercase">
                    Membership &amp; Plans
                </p>
                <div className=" flex justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Your membership
                        </h1>
                        <p className="text-sm text-neutral-400">
                            Keep your access active and make every session
                            count.
                        </p>
                    </div>
                    <div>
                        <Button asChild>
                            <Link href="/member/payments">Payments</Link>
                        </Button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
                    {/* Current plan */}
                    <div className="rounded-2xl border border-orange-900/40 bg-gradient-to-br from-orange-950/40 to-neutral-900 p-6">
                        {currentSubscription ? (
                            <>
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-xs font-medium tracking-wide text-orange-300 uppercase">
                                        Your current plan
                                    </p>
                                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                                        ●{" "}
                                        {currentSubscription.status === "active"
                                            ? "Active"
                                            : currentSubscription.status}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-white">
                                    {currentSubscription.plan_name}
                                </h2>
                                <p className="mt-1 text-sm text-neutral-400">
                                    Billed{" "}
                                    {currentSubscription.billing_cycle ===
                                    "annual"
                                        ? "annually"
                                        : "monthly"}
                                </p>

                                <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-neutral-500">
                                            Started
                                        </p>
                                        <p className="font-medium text-orange-300">
                                            {currentSubscription.started_at ??
                                                "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">
                                            Valid until
                                        </p>
                                        <p className="font-medium text-orange-300">
                                            {currentSubscription.valid_until ??
                                                "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">
                                            Remaining
                                        </p>
                                        <p className="font-medium text-orange-300">
                                            {currentSubscription.days_remaining}{" "}
                                            days
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                                    <div
                                        className="h-full rounded-full bg-orange-500"
                                        style={{
                                            width: `${currentSubscription.percent_used}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-neutral-500">
                                    {currentSubscription.percent_used}% of your
                                    plan
                                </p>

                                <div className="mt-6 flex gap-3">
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
                                        className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-black hover:bg-orange-400"
                                    >
                                        ↻ Renew membership
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="text-neutral-400">
                                You don't have an active membership yet.
                            </p>
                        )}
                    </div>

                    {/* Plan picker */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-orange-400 uppercase">
                                    Find your fit
                                </p>
                                <h2 className="text-xl font-bold text-white">
                                    Choose a plan
                                </h2>
                            </div>

                            <div className="flex rounded-lg border border-neutral-700 p-1 text-xs">
                                <button
                                    onClick={() => setCycle("monthly")}
                                    className={`rounded-md px-3 py-1 font-medium ${
                                        cycle === "monthly"
                                            ? "bg-orange-500 text-black"
                                            : "text-neutral-400"
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setCycle("annual")}
                                    className={`rounded-md px-3 py-1 font-medium ${
                                        cycle === "annual"
                                            ? "bg-orange-500 text-black"
                                            : "text-neutral-400"
                                    }`}
                                >
                                    Annual
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
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
                                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                                            isSelected
                                                ? "border-orange-500 bg-orange-950/30"
                                                : "border-neutral-800 bg-neutral-900"
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white">
                                                    {plan.name}
                                                </span>
                                                {plan.highlighted && (
                                                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                                                        Most popular
                                                    </span>
                                                )}
                                                {isCurrent && (
                                                    <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-neutral-400">
                                                {plan.tagline}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-semibold text-orange-300">
                                                {formatPeso(price)}
                                            </p>
                                            
                                            <p className="text-xs text-neutral-500">
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
                            className="mt-4 w-full rounded-lg bg-orange-500 py-3 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
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
