import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
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

// Sent by OnboardingController::renderMayaAttach whenever the user picks
// Maya. Unlike GCash (which gets a checkout_url straight from the backend),
// Maya requires attaching a PaymentMethod to this PaymentIntent from the
// browser using the *public* key before we get a URL to redirect to.
type MayaPayment = {
    invoice_id: number;
    payment_intent_id: string;
    client_key: string;
    public_key: string;
    return_url: string;
};

// Welcome step removed — the flow now opens directly on plan selection.
type Step = 1 | 2 | 3;

export default function OnboardingIndex({ plans }: { plans: Plan[] }) {
    const { auth, mayaPayment } = usePage().props as any as {
        auth: any;
        mayaPayment: MayaPayment | null;
    };
    const firstName = auth?.user?.name?.split(" ")[0] ?? "there";

    const [step, setStep] = useState<Step>(1);
    const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const [mayaBusy, setMayaBusy] = useState(false);
    const [mayaError, setMayaError] = useState<string | null>(null);
    const [mayaAttempt, setMayaAttempt] = useState(0);

    const { data, setData, post, processing, errors } = useForm({
        plan_id: null as number | null,
        billing_cycle: "monthly",
        payment_method_type: "" as "" | "gcash" | "paymaya",
    });

    function choosePlan(plan: Plan) {
        setSelectedPlan(plan);
        setData((d) => ({ ...d, plan_id: plan.id, billing_cycle: cycle }));
        setStep(2);
    }

    function submitPayment(e: React.FormEvent) {
        e.preventDefault();
        if (!data.payment_method_type) return;
        setMayaError(null);

        // GCash: the backend responds with Inertia::location(...), a real
        // browser redirect to GCash's site — the page navigates away, so
        // there's no onSuccess step here.
        //
        // Maya: the backend responds with Inertia::render(...) carrying a
        // fresh `mayaPayment` prop. preserveState keeps step/selectedPlan
        // intact while the attach effect below picks up that prop and does
        // the actual redirect once it has a real auth URL.
        post("/onboarding/complete", {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setMayaAttempt((n) => n + 1),
        });
    }

    // Runs whenever the backend hands us a new PaymentIntent to attach to
    // (initial submit, or a retry after a failed/expired attempt).
    useEffect(() => {
        if (!mayaPayment) return;

        let cancelled = false;
        setMayaBusy(true);
        setMayaError(null);

        async function authorizeMaya() {
            const authHeader = `Basic ${btoa(`${mayaPayment!.public_key}:`)}`;

            try {
                // 1. Create the PaymentMethod. No card data needed for an
                //    e-wallet, so this is safe to do with the public key.
                const pmRes = await fetch(
                    "https://api.paymongo.com/v1/payment_methods",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: authHeader,
                        },
                        body: JSON.stringify({
                            data: { attributes: { type: "paymaya" } },
                        }),
                    },
                );
                const pmJson = await pmRes.json();
                if (!pmRes.ok) {
                    throw new Error(
                        pmJson?.errors?.[0]?.detail ??
                            "Could not start Maya checkout.",
                    );
                }

                // 2. Attach it to the PaymentIntent our backend already
                //    created. This is what actually produces the
                //    authorization redirect URL.
                const attachRes = await fetch(
                    `https://api.paymongo.com/v1/payment_intents/${mayaPayment!.payment_intent_id}/attach`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: authHeader,
                        },
                        body: JSON.stringify({
                            data: {
                                attributes: {
                                    client_key: mayaPayment!.client_key,
                                    payment_method: pmJson.data.id,
                                    return_url: mayaPayment!.return_url,
                                },
                            },
                        }),
                    },
                );
                const attachJson = await attachRes.json();
                if (!attachRes.ok) {
                    throw new Error(
                        attachJson?.errors?.[0]?.detail ??
                            "Maya declined this payment.",
                    );
                }

                if (cancelled) return;

                const redirectUrl =
                    attachJson.data.attributes.next_action?.redirect?.url;
                const status = attachJson.data.attributes.status;

                if (redirectUrl) {
                    // Cross-domain hand-off to Maya's own auth page.
                    window.location.href = redirectUrl;
                } else if (status === "succeeded") {
                    // Rare, but possible: no auth step needed at all.
                    router.visit(mayaPayment!.return_url);
                } else {
                    throw new Error(
                        "Maya didn't return an authorization link. Please try again.",
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setMayaError(
                        err instanceof Error
                            ? err.message
                            : "Something went wrong starting Maya checkout.",
                    );
                }
            } finally {
                if (!cancelled) setMayaBusy(false);
            }
        }

        authorizeMaya();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mayaPayment?.payment_intent_id, mayaAttempt]);

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
            <div className="min-h-screen bg-background text-foreground overflow-hidden">
                <div className="px-4 sm:px-6 py-8 sm:py-12">
                    <OnboardingStepper current={step} />
                </div>

                {/* Slider track — 3 panels now that Welcome is gone */}
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
                >
                    {/* Step 1: Plan */}
                    <div className="w-full shrink-0 px-4 sm:px-6 pb-16 sm:pb-20">
                        <div className="text-center mb-6 sm:mb-10">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                                Choose your plan
                            </h1>
                            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                                Hi {firstName} — pick the plan that fits your
                                goals. You can upgrade anytime.
                            </p>
                        </div>

                        <div className="flex justify-center mb-8 sm:mb-10">
                            <div className="inline-flex rounded-full bg-card border border-border p-1">
                                <button
                                    onClick={() => setCycle("monthly")}
                                    className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                                        cycle === "monthly"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setCycle("annual")}
                                    className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition flex items-center gap-1.5 sm:gap-2 ${
                                        cycle === "annual"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    Annual
                                    <span className="text-[9px] sm:text-[10px] bg-emerald-950/60 text-emerald-400 px-1.5 py-0.5 rounded-full">
                                        Save 20%
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-6 sm:mb-8">
                            <button
                                onClick={() => router.post("/onboarding/skip")}
                                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                            >
                                Skip for now — explore without a membership
                            </button>
                        </div>

                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                            {plans.map((plan) => {
                                const p =
                                    plan.pricing[cycle].per_month_equivalent;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-xl sm:rounded-2xl border p-5 sm:p-6 flex flex-col bg-card ${
                                            plan.highlighted
                                                ? "border-primary ring-1 ring-primary/20"
                                                : "border-border"
                                        }`}
                                    >
                                        {plan.highlighted && (
                                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full">
                                                Most popular
                                            </span>
                                        )}
                                        <div
                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 ${
                                                plan.highlighted
                                                    ? "bg-primary/15"
                                                    : "bg-secondary"
                                            }`}
                                        >
                                            ⚡
                                        </div>
                                        <h3
                                            className={`text-lg sm:text-xl font-bold ${
                                                plan.highlighted
                                                    ? "text-primary"
                                                    : "text-foreground"
                                            }`}
                                        >
                                            {plan.name}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                                            {plan.tagline}
                                        </p>
                                        <div className="mb-5 sm:mb-6">
                                            <span className="text-2xl sm:text-3xl font-bold">
                                                ₱{(p / 100).toLocaleString()}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                /month
                                            </span>
                                        </div>
                                        <ul className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6 flex-1">
                                            {(plan.features ?? []).map((f) => (
                                                <li
                                                    key={f}
                                                    className="flex items-center gap-2 text-xs sm:text-sm text-foreground/80"
                                                >
                                                    <span className="text-emerald-500">
                                                        ✓
                                                    </span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => choosePlan(plan)}
                                            className={`w-full py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-colors ${
                                                plan.highlighted
                                                    ? "bg-primary text-primary-foreground hover:opacity-90"
                                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                                            }`}
                                        >
                                            Select {plan.name} →
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Payment */}
                    <div className="w-full shrink-0 px-4 sm:px-6 pb-16 sm:pb-20">
                        <div className="text-center mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                                Complete your membership
                            </h1>
                            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                                You're one step away from full access to
                                FitFlow.
                            </p>
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6"
                        >
                            ← Back
                        </button>

                        {selectedPlan && pricing && (
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto">
                                <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6">
                                    <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground mb-3">
                                        Order summary
                                    </p>
                                    <p className="font-semibold text-primary text-sm sm:text-base">
                                        {selectedPlan.name} membership
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 capitalize">
                                        {cycle} billing
                                    </p>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-[11px] sm:text-xs text-muted-foreground hover:text-foreground mb-4"
                                    >
                                        ← Change plan
                                    </button>

                                    <div className="border-t border-border pt-4 space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between text-foreground/80">
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
                                        <div className="flex justify-between text-foreground/80">
                                            <span>Tax (12% VAT)</span>
                                            <span>
                                                {fmt(pricing.tax_amount)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-border mt-4 pt-4">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-primary font-semibold text-sm sm:text-base">
                                                Total due today
                                            </span>
                                            <span className="text-xl sm:text-2xl font-bold text-primary">
                                                {fmt(pricing.total_amount)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                                            {cycle === "annual"
                                                ? `Renews annually at ${fmt(pricing.total_amount)} (≈ ${fmt(pricing.per_month_equivalent)}/mo)`
                                                : `Renews monthly at ${fmt(pricing.total_amount)}`}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">
                                        You'll be redirected to{" "}
                                        {data.payment_method_type === "gcash"
                                            ? "GCash"
                                            : "Maya"}{" "}
                                        to approve the payment. If anything goes
                                        wrong there, just return to this tab —
                                        we'll pick up where you left off.
                                    </p>

                                    <form
                                        onSubmit={submitPayment}
                                        className="rounded-xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6"
                                    >
                                        <p className="text-primary font-semibold mb-4 text-sm sm:text-base">
                                            Choose payment method
                                        </p>

                                        <div className="space-y-3 mb-5 sm:mb-6">
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
                                                        ? "border-primary bg-primary/10"
                                                        : "border-border bg-secondary hover:border-muted-foreground/40"
                                                }`}
                                            >
                                                <span className="text-xl sm:text-2xl">
                                                    💙
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm sm:text-base">
                                                        GCash
                                                    </p>
                                                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                                                        Pay using your GCash
                                                        wallet
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
                                                        ? "border-primary bg-primary/10"
                                                        : "border-border bg-secondary hover:border-muted-foreground/40"
                                                }`}
                                            >
                                                <span className="text-xl sm:text-2xl">
                                                    💚
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm sm:text-base">
                                                        Maya
                                                    </p>
                                                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                                                        Pay using your Maya
                                                        wallet
                                                    </p>
                                                </div>
                                            </button>
                                        </div>

                                        {errors.payment_method_type && (
                                            <p className="text-destructive text-xs mb-3">
                                                {errors.payment_method_type}
                                            </p>
                                        )}
                                        {(errors as Record<string, string>)
                                            .payment && (
                                            <p className="text-destructive text-xs mb-3">
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
                                        {mayaError && (
                                            <p className="text-destructive text-xs mb-3">
                                                {mayaError}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={
                                                processing ||
                                                mayaBusy ||
                                                !data.payment_method_type
                                            }
                                            className="w-full mt-2 bg-primary text-primary-foreground hover:opacity-90 font-semibold py-2.5 sm:py-3 rounded-lg text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                                        >
                                            {processing || mayaBusy
                                                ? "Redirecting..."
                                                : `Pay ${fmt(pricing.total_amount)} via ${data.payment_method_type === "gcash" ? "GCash" : data.payment_method_type === "paymaya" ? "Maya" : "..."} →`}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Done */}
                    <div className="w-full shrink-0 flex flex-col items-center justify-center px-4 sm:px-6 pb-16 sm:pb-20">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-2xl sm:text-3xl mb-4">
                            ✓
                        </div>
                        <p className="text-emerald-500 text-[11px] sm:text-xs font-semibold tracking-wide uppercase mb-2">
                            Membership activated
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
                            You're all set, {firstName}!
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 text-center">
                            Your {selectedPlan?.name} membership is now active.
                            Let's get moving.
                        </p>

                        <div className="w-full max-w-md rounded-xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3 mb-6 sm:mb-8">
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">
                                    Plan
                                </span>
                                <span className="text-primary font-medium">
                                    {selectedPlan?.name}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm border-t border-border pt-3">
                                <span className="text-muted-foreground">
                                    Valid until
                                </span>
                                <span className="text-primary font-medium">
                                    {nextBillingLabel}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm border-t border-border pt-3">
                                <span className="text-muted-foreground">
                                    Next billing date
                                </span>
                                <span className="text-primary font-medium">
                                    {nextBillingLabel}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm border-t border-border pt-3">
                                <span className="text-muted-foreground">
                                    Status
                                </span>
                                <span className="text-emerald-400 font-medium">
                                    Active
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/dashboard"
                            className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base flex items-center gap-2 transition-opacity"
                        >
                            Go to my dashboard →
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
