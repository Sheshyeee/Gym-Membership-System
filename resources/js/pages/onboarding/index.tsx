import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import { OnboardingStepper } from "@/components/OnboardingStepper";

type PricingBreakdown = {
    base_amount: number;
    tax_amount: number;
    total_amount: number; // what's actually charged today
    per_month_equivalent: number;
};

type Plan = {
    id: number;
    name: string;
    slug: string;
    tagline: string;
    monthly_price: number;
    annual_price: number | null;
    features: string[];
    highlighted?: boolean;
    pricing: {
        monthly: PricingBreakdown;
        annual: PricingBreakdown;
    };
};

type Step = 1 | 2 | 3 | 4;

export default function OnboardingIndex({ plans }: { plans: Plan[] }) {
    const { auth } = usePage().props as any;
    const firstName = auth?.user?.name?.split(" ")[0] ?? "there";

    const [step, setStep] = useState<Step>(1);
    const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        plan_id: null as number | null,
        billing_cycle: "monthly",
        payment_method_type: "" as "" | "gcash" | "paymaya",
    });

    function goToPlan() {
        setStep(2);
    }

    function choosePlan(plan: Plan) {
        setSelectedPlan(plan);
        setData((d) => ({ ...d, plan_id: plan.id, billing_cycle: cycle }));
        setStep(3);
    }

    function submitPayment(e: React.FormEvent) {
        e.preventDefault();
        if (!data.payment_method_type) return;

        // This triggers a real redirect to GCash/Maya's site (Inertia::location
        // on the backend), so there's no onSuccess step-advance here — the user
        // leaves this page entirely and comes back via /onboarding/payment/return.
        post("/onboarding/complete", {
            preserveScroll: true,
        });
    }

    const fmt = (n: number) => `₱${(n / 100).toLocaleString()}`;

    const nextBillingLabel = (() => {
        const d = new Date();
        cycle === "annual"
            ? d.setFullYear(d.getFullYear() + 1)
            : d.setMonth(d.getMonth() + 1);
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    })();
    const pricing = selectedPlan?.pricing[cycle];

    return (
        <>
            <Head title="Set up your membership" />
            <div className="min-h-screen bg-neutral-950 text-white overflow-hidden">
                <div className="px-6 py-12">
                    <OnboardingStepper current={step} />
                </div>

                {/* Slider track */}
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
                >
                    {/* Step 1: Welcome */}
                    <div className="w-full shrink-0 flex flex-col items-center justify-center px-6 pb-20">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-amber-500/20">
                            🏋️
                        </div>
                        <h1 className="text-3xl font-bold mb-3 text-center">
                            Welcome to FitFlow, {firstName} ✨
                        </h1>
                        <p className="text-neutral-400 text-center max-w-md mb-8">
                            Let's get you set up with a membership so you can
                            start training. It only takes a minute.
                        </p>
                        <button
                            onClick={goToPlan}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-2"
                        >
                            Get started →
                        </button>
                        <p className="text-neutral-500 text-sm mt-6">
                            Step 1 of 3 · Choose a plan and activate your
                            membership
                        </p>
                    </div>

                    {/* Step 2: Plan */}
                    <div className="w-full shrink-0 px-6 pb-20">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-2">
                                Choose your plan
                            </h1>
                            <p className="text-neutral-400">
                                Pick the plan that fits your goals. You can
                                upgrade anytime.
                            </p>
                        </div>

                        <div className="flex justify-center mb-10">
                            <div className="inline-flex rounded-full bg-neutral-900 p-1 border border-neutral-800">
                                <button
                                    onClick={() => setCycle("monthly")}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                                        cycle === "monthly"
                                            ? "bg-amber-500 text-black"
                                            : "text-neutral-400"
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setCycle("annual")}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${
                                        cycle === "annual"
                                            ? "bg-amber-500 text-black"
                                            : "text-neutral-400"
                                    }`}
                                >
                                    Annual
                                    <span className="text-[10px] bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded-full">
                                        Save 20%
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <button
                                onClick={() => router.post("/onboarding/skip")}
                                className="text-sm text-neutral-500 hover:text-neutral-300 underline underline-offset-2"
                            >
                                Skip for now — explore without a membership
                            </button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
                            {plans.map((plan) => {
                                const p =
                                    plan.pricing[cycle].per_month_equivalent;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-2xl border p-6 flex flex-col ${
                                            plan.highlighted
                                                ? "border-amber-500 bg-neutral-900"
                                                : "border-neutral-800 bg-neutral-900/60"
                                        }`}
                                    >
                                        {plan.highlighted && (
                                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-full">
                                                Most popular
                                            </span>
                                        )}
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                                                plan.highlighted
                                                    ? "bg-amber-500/20"
                                                    : "bg-neutral-800"
                                            }`}
                                        >
                                            ⚡
                                        </div>
                                        <h3
                                            className={`text-xl font-bold ${
                                                plan.highlighted
                                                    ? "text-amber-400"
                                                    : "text-white"
                                            }`}
                                        >
                                            {plan.name}
                                        </h3>
                                        <p className="text-sm text-neutral-400 mb-4">
                                            {plan.tagline}
                                        </p>
                                        <div className="mb-6">
                                            <span className="text-3xl font-bold">
                                                ₱{(p / 100).toLocaleString()}
                                            </span>
                                            <span className="text-neutral-400">
                                                /month
                                            </span>
                                        </div>
                                        <ul className="space-y-2 mb-6 flex-1">
                                            {(plan.features ?? []).map((f) => (
                                                <li
                                                    key={f}
                                                    className="flex items-center gap-2 text-sm text-neutral-300"
                                                >
                                                    <span className="text-green-500">
                                                        ✓
                                                    </span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => choosePlan(plan)}
                                            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                                                plan.highlighted
                                                    ? "bg-amber-500 text-black hover:bg-amber-400"
                                                    : "bg-neutral-800 text-white hover:bg-neutral-700"
                                            }`}
                                        >
                                            Select {plan.name} →
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 3: Payment */}
                    <div className="w-full shrink-0 px-6 pb-20">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-2">
                                Complete your membership
                            </h1>
                            <p className="text-neutral-400">
                                You're one step away from full access to
                                FitFlow.
                            </p>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className="inline-flex items-center gap-1 text-neutral-400 hover:text-white mb-6"
                        >
                            ← Back
                        </button>

                        {selectedPlan && pricing && (
                            <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
                                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                                    <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
                                        Order summary
                                    </p>
                                    <p className="font-semibold text-amber-400">
                                        {selectedPlan.name} membership
                                    </p>
                                    <p className="text-sm text-neutral-400 mb-4 capitalize">
                                        {cycle} billing
                                    </p>
                                    <button
                                        onClick={() => setStep(2)}
                                        className="text-xs text-neutral-400 hover:text-white mb-4"
                                    >
                                        ← Change plan
                                    </button>

                                    <div className="border-t border-neutral-800 pt-4 space-y-2 text-sm">
                                        <div className="flex justify-between text-neutral-300">
                                            <span>
                                                Plan price
                                                {cycle === "annual"
                                                    ? " (annual)"
                                                    : ""}
                                            </span>
                                            <span>
                                                {fmt(pricing.base_amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-neutral-300">
                                            <span>Tax (12% VAT)</span>
                                            <span>
                                                {fmt(pricing.tax_amount)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-neutral-800 mt-4 pt-4">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-amber-400 font-semibold">
                                                Total due today
                                            </span>
                                            <span className="text-2xl font-bold text-amber-400">
                                                {fmt(pricing.total_amount)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {cycle === "annual"
                                                ? `Renews annually at ${fmt(pricing.total_amount)} (≈ ${fmt(pricing.per_month_equivalent)}/mo)`
                                                : `Renews monthly at ${fmt(pricing.total_amount)}`}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-neutral-500 mb-4">
                                    You'll be redirected to{" "}
                                    {data.payment_method_type === "gcash"
                                        ? "GCash"
                                        : "Maya"}{" "}
                                    to approve the payment. If anything goes
                                    wrong there, just return to this tab — we'll
                                    pick up where you left off.
                                </p>

                                <form
                                    onSubmit={submitPayment}
                                    className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6"
                                >
                                    <p className="text-amber-400 font-semibold mb-4">
                                        Choose payment method
                                    </p>

                                    <div className="space-y-3 mb-6">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "payment_method_type",
                                                    "gcash",
                                                )
                                            }
                                            className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                                                data.payment_method_type ===
                                                "gcash"
                                                    ? "border-amber-500 bg-amber-500/10"
                                                    : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                                            }`}
                                        >
                                            <span className="text-2xl">💙</span>
                                            <div>
                                                <p className="font-semibold text-white">
                                                    GCash
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    Pay using your GCash wallet
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "payment_method_type",
                                                    "paymaya",
                                                )
                                            }
                                            className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                                                data.payment_method_type ===
                                                "paymaya"
                                                    ? "border-amber-500 bg-amber-500/10"
                                                    : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                                            }`}
                                        >
                                            <span className="text-2xl">💚</span>
                                            <div>
                                                <p className="font-semibold text-white">
                                                    Maya
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    Pay using your Maya wallet
                                                </p>
                                            </div>
                                        </button>
                                    </div>

                                    {errors.payment_method_type && (
                                        <p className="text-red-400 text-xs mb-3">
                                            {errors.payment_method_type}
                                        </p>
                                    )}
                                    {(errors as Record<string, string>)
                                        .payment && (
                                        <p className="text-red-400 text-xs mb-3">
                                            {
                                                (
                                                    errors as Record<
                                                        string,
                                                        string
                                                    >
                                                ).payment
                                            }
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            !data.payment_method_type
                                        }
                                        className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {processing
                                            ? "Redirecting..."
                                            : `Pay ${fmt(pricing.total_amount)} via ${data.payment_method_type === "gcash" ? "GCash" : data.payment_method_type === "paymaya" ? "Maya" : "..."} →`}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Step 4: Done */}
                    <div className="w-full shrink-0 flex flex-col items-center justify-center px-6 pb-20">
                        <div className="w-16 h-16 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center text-3xl mb-4">
                            ✓
                        </div>
                        <p className="text-green-500 text-xs font-semibold tracking-wide uppercase mb-2">
                            Membership activated
                        </p>
                        <h1 className="text-3xl font-bold mb-2">
                            You're all set, {firstName}!
                        </h1>
                        <p className="text-neutral-400 mb-8 text-center">
                            Your {selectedPlan?.name} membership is now active.
                            Let's get moving.
                        </p>

                        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-3 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Plan</span>
                                <span className="text-amber-400 font-medium">
                                    {selectedPlan?.name}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-neutral-800 pt-3">
                                <span className="text-neutral-400">
                                    Valid until
                                </span>
                                <span className="text-amber-400 font-medium">
                                    {nextBillingLabel}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-neutral-800 pt-3">
                                <span className="text-neutral-400">
                                    Next billing date
                                </span>
                                <span className="text-amber-400 font-medium">
                                    {nextBillingLabel}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-neutral-800 pt-3">
                                <span className="text-neutral-400">Status</span>
                                <span className="text-green-400 font-medium">
                                    Active
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/dashboard"
                            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-2"
                        >
                            Go to my dashboard →
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
