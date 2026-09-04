import { Head, router } from "@inertiajs/react";
import { useEffect, useState, useCallback } from "react";

export default function PaymentPending({ invoice_id }: { invoice_id: number }) {
    const [checking, setChecking] = useState(false);

    const checkStatus = useCallback(async () => {
        setChecking(true);
        try {
            const res = await fetch(
                `/onboarding/invoices/${invoice_id}/status`,
            );

            if (!res.ok) {
                throw new Error(`Status check failed: ${res.status}`);
            }

            const json = await res.json();

            if (json.status === "paid") {
                router.visit("/dashboard");
            } else if (json.status === "failed") {
                router.visit("/onboarding", { data: { failed: 1 } });
            }
        } catch (err) {
            console.error("Payment status check failed", err);
            // swallow — next interval tick or manual "Check status now" retries
        } finally {
            setChecking(false);
        }
    }, [invoice_id]);

    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        const interval = setInterval(checkStatus, 3000);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            setTimedOut(true);
        }, 60000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [checkStatus]);

    return (
        <>
            <Head title="Confirming payment..." />
            <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
                <div className="w-12 h-12 border-4 border-neutral-700 border-t-amber-500 rounded-full animate-spin mb-6" />
                <h1 className="text-2xl font-bold mb-2">
                    Confirming your payment
                </h1>
                <p className="text-neutral-400 text-center max-w-sm mb-6">
                    {timedOut
                        ? "This is taking longer than expected. You can check again, or come back later — your membership will activate automatically once payment is confirmed."
                        : "If you cancelled or your GCash/Maya session expired, you can safely close that tab and check your status here."}
                </p>
                <button
                    onClick={checkStatus}
                    disabled={checking}
                    className="text-amber-400 text-sm underline underline-offset-2 disabled:opacity-50"
                >
                    {checking ? "Checking..." : "Check status now"}
                </button>
            </div>
        </>
    );
}
