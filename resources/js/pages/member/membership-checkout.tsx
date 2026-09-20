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

            <div className="mx-auto max-w-5xl space-y-1 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium tracking-wide text-orange-400 uppercase">
                            Checkout
                        </p>
                        <h1 className="text-3xl font-bold text-white">
                            {action === "renew"
                                ? "Complete your renewal"
                                : "Complete your plan switch"}
                        </h1>
                        <p className="text-sm text-neutral-400">
                            {action === "renew"
                                ? "You're one step away from keeping your momentum going."
                                : `You're one step away from switching to ${plan.name}.`}
                        </p>
                    </div>
                    <button
                        onClick={() => router.get("/member/membership")}
                        className="text-sm text-neutral-400 hover:text-white"
                    >
                        ← Back
                    </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
                    <div className="rounded-2xl border border-orange-900/40 bg-neutral-900 p-6">
                        <p className="mb-1 text-xs font-medium tracking-wide text-orange-400 uppercase">
                            01
                        </p>
                        <h2 className="mb-1 text-lg font-semibold text-white">
                            Payment method
                        </h2>
                        <p className="mb-4 text-sm text-neutral-400">
                            Choose how you'd like to pay.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() =>
                                    setData("payment_method_type", "gcash")
                                }
                                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${
                                    data.payment_method_type === "gcash"
                                        ? "border-orange-500 bg-orange-950/30 text-white"
                                        : "border-neutral-700 text-neutral-300"
                                }`}
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                    G
                                </span>
                                GCash
                                {data.payment_method_type === "gcash" && (
                                    <span className="ml-auto text-orange-400">
                                        ✓
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() =>
                                    setData("payment_method_type", "paymaya")
                                }
                                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${
                                    data.payment_method_type === "paymaya"
                                        ? "border-orange-500 bg-orange-950/30 text-white"
                                        : "border-neutral-700 text-neutral-300"
                                }`}
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                                    M
                                </span>
                                Maya
                                {data.payment_method_type === "paymaya" && (
                                    <span className="ml-auto text-orange-400">
                                        ✓
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="my-6 border-t border-neutral-800" />

                        <p className="mb-1 text-xs font-medium tracking-wide text-orange-400 uppercase">
                            02
                        </p>
                        <h2 className="mb-1 text-lg font-semibold text-white">
                            Billing details
                        </h2>
                        <p className="mb-4 text-sm text-neutral-400">
                            A receipt will be sent to {billingEmail}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-neutral-500">Name</p>
                                <p className="text-white">{billingName}</p>
                            </div>
                            <div>
                                <p className="text-neutral-500">Email</p>
                                <p className="text-white">{billingEmail}</p>
                            </div>
                        </div>

                        {(errors as Record<string, string>).payment && (
                            <p className="mt-4 text-sm text-red-400">
                                {(errors as Record<string, string>).payment}
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-orange-900/40 bg-neutral-900 p-6">
                        <p className="mb-4 text-xs font-medium tracking-wide text-orange-400 uppercase">
                            Order summary
                        </p>

                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-white">
                                    {plan.name} membership
                                </p>
                                <p className="text-sm text-neutral-500">
                                    {plan.billing_cycle === "annual"
                                        ? "12 Months"
                                        : "1 Month"}
                                </p>
                            </div>
                            <p className="font-semibold text-orange-300">
                                {formatPeso(amount)}
                            </p>
                        </div>

                        <div className="space-y-2 border-t border-neutral-800 pt-4 text-sm">
                            <div className="flex justify-between text-neutral-400">
                                <span>Subtotal</span>
                                <span>{formatPeso(amount)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                                <span>Processing fee</span>
                                <span>₱0</span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-4">
                            <span className="font-medium text-orange-300">
                                Total due
                            </span>
                            <span className="text-xl font-bold text-orange-300">
                                {formatPeso(amount)}
                            </span>
                        </div>

                        <button
                            onClick={submit}
                            disabled={processing}
                            className="mt-6 w-full rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
                        >
                            {processing
                                ? "Redirecting…"
                                : `Pay ${formatPeso(amount)}`}
                        </button>

                        <p className="mt-2 text-center text-xs text-neutral-500">
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
