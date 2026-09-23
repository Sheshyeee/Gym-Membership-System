import { Head, router, useForm } from "@inertiajs/react";
import { dashboard } from "@/routes";

type PaymentMethod = "gcash" | "paymaya";

function formatPeso(centavos: number) {
    return `₱${(centavos / 100).toLocaleString("en-PH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}

export default function MembershipCheckout({
    action,
    plan,
    amount,
    billingName,
    billingEmail,
}: {
    action: "renew" | "switch";
    plan: { id: number; name: string; billing_cycle: "monthly" | "annual" };
    amount: number; // centavos
    billingName: string;
    billingEmail: string;
}) {
    const { data, setData, post, processing, errors } = useForm<{
        plan_id: number;
        billing_cycle: "monthly" | "annual";
        payment_method_type: PaymentMethod;
    }>({
        plan_id: plan.id,
        billing_cycle: plan.billing_cycle,
        payment_method_type: "gcash",
    });

    function submit() {
        post("/member/membership/checkout");
    }

    return (
        <>
            <Head title="Checkout" />

            <div className="mx-auto max-w-5xl space-y-1 p-3 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
                            Checkout
                        </p>
                        <h1 className="text-xl font-bold text-foreground sm:text-3xl">
                            {action === "renew"
                                ? "Complete your renewal"
                                : "Complete your plan switch"}
                        </h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            {action === "renew"
                                ? "You're one step away from keeping your momentum going."
                                : `You're one step away from switching to ${plan.name}.`}
                        </p>
                    </div>
                    <button
                        onClick={() => router.get("/member/membership")}
                        className="self-start text-xs text-muted-foreground transition hover:text-foreground sm:text-sm"
                    >
                        ← Back
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[1.3fr_1fr]">
                    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                        <p className="mb-1 text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
                            01
                        </p>
                        <h2 className="mb-1 text-base font-semibold text-foreground sm:text-lg">
                            Payment method
                        </h2>
                        <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
                            Choose how you'd like to pay.
                        </p>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                            <button
                                onClick={() =>
                                    setData("payment_method_type", "gcash")
                                }
                                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium sm:p-3 sm:text-sm ${
                                    data.payment_method_type === "gcash"
                                        ? "border-primary bg-primary/10 text-foreground"
                                        : "border-border text-muted-foreground"
                                }`}
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                    G
                                </span>
                                GCash
                                {data.payment_method_type === "gcash" && (
                                    <span className="ml-auto text-primary">
                                        ✓
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() =>
                                    setData("payment_method_type", "paymaya")
                                }
                                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium sm:p-3 sm:text-sm ${
                                    data.payment_method_type === "paymaya"
                                        ? "border-primary bg-primary/10 text-foreground"
                                        : "border-border text-muted-foreground"
                                }`}
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                                    M
                                </span>
                                Maya
                                {data.payment_method_type === "paymaya" && (
                                    <span className="ml-auto text-primary">
                                        ✓
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="my-5 border-t border-border sm:my-6" />

                        <p className="mb-1 text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
                            02
                        </p>
                        <h2 className="mb-1 text-base font-semibold text-foreground sm:text-lg">
                            Billing details
                        </h2>
                        <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
                            A receipt will be sent to {billingEmail}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-xs sm:gap-4 sm:text-sm">
                            <div>
                                <p className="text-muted-foreground">Name</p>
                                <p className="truncate text-foreground">
                                    {billingName}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Email</p>
                                <p className="truncate text-foreground">
                                    {billingEmail}
                                </p>
                            </div>
                        </div>

                        {(errors as Record<string, string>).payment && (
                            <p className="mt-4 text-xs text-red-400 sm:text-sm">
                                {(errors as Record<string, string>).payment}
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                        <p className="mb-4 text-[11px] font-medium tracking-wide text-primary uppercase sm:text-xs">
                            Order summary
                        </p>

                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                                    {plan.name} membership
                                </p>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    {plan.billing_cycle === "annual"
                                        ? "12 Months"
                                        : "1 Month"}
                                </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-primary sm:text-base">
                                {formatPeso(amount)}
                            </p>
                        </div>

                        <div className="space-y-2 border-t border-border pt-4 text-xs sm:text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatPeso(amount)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Processing fee</span>
                                <span>₱0</span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                            <span className="text-sm font-medium text-primary">
                                Total due
                            </span>
                            <span className="text-lg font-bold text-primary sm:text-xl">
                                {formatPeso(amount)}
                            </span>
                        </div>

                        <button
                            onClick={submit}
                            disabled={processing}
                            className="mt-6 w-full rounded-lg bg-gradient-to-r from-primary to-primary/80 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:py-3"
                        >
                            {processing
                                ? "Redirecting…"
                                : `Pay ${formatPeso(amount)}`}
                        </button>

                        <p className="mt-2 text-center text-[11px] text-muted-foreground sm:text-xs">
                            🔒 Secure payment · You can cancel anytime
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

MembershipCheckout.layout = {
    breadcrumbs: [
        { title: "Membership", href: "/member/membership" },
        { title: "Checkout", href: dashboard() },
    ],
};
