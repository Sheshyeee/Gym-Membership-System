import { Head, router } from "@inertiajs/react";
import { useEffect, useState, useCallback, useRef } from "react";

const FAST_INTERVAL_MS = 3000;
const SLOW_INTERVAL_MS = 10000;
const BACKOFF_AFTER_MS = 60000; // switch to slow polling after this long
const GIVE_UP_AFTER_MS = 5 * 60000; // stop polling entirely after this long

export default function PaymentPending({ invoice_id }: { invoice_id: number }) {
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [slowMode, setSlowMode] = useState(false);
    const [gaveUp, setGaveUp] = useState(false);

    const checkStatus = useCallback(async () => {
        setChecking(true);
        try {
            const res = await fetch(
                `/onboarding/invoices/${invoice_id}/status`,
                {
                    headers: { Accept: "application/json" },
                },
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
            // still pending — clear any stale error and keep polling
            setError(null);
        } catch (err) {
            console.error("Payment status check failed", err);
            setError(
                "Having trouble checking your payment status. You can try again below.",
            );
        } finally {
            setChecking(false);
        }
    }, [invoice_id]);

    // Ref so the interval callback always sees the latest checkStatus
    // without having to recreate the interval on every render.
    const checkStatusRef = useRef(checkStatus);
    checkStatusRef.current = checkStatus;

    useEffect(() => {
        let elapsed = 0;
        let currentIntervalMs = FAST_INTERVAL_MS;

        const tick = () => {
            elapsed += currentIntervalMs;
            checkStatusRef.current();

            if (elapsed >= GIVE_UP_AFTER_MS) {
                setGaveUp(true);
                clearInterval(intervalId);
                return;
            }

            if (!slowMode && elapsed >= BACKOFF_AFTER_MS) {
                setSlowMode(true);
            }
        };

        let intervalId = setInterval(tick, currentIntervalMs);

        // When we cross into slow mode, tear down and restart the
        // interval at the slower cadence.
        if (slowMode) {
            clearInterval(intervalId);
            currentIntervalMs = SLOW_INTERVAL_MS;
            intervalId = setInterval(tick, currentIntervalMs);
        }

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slowMode]);

    return (
        <>
            <Head title="Confirming payment..." />
            <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
                <div className="w-12 h-12 border-4 border-neutral-700 border-t-amber-500 rounded-full animate-spin mb-6" />
                <h1 className="text-2xl font-bold mb-2">
                    Confirming your payment
                </h1>
                <p className="text-neutral-400 text-center max-w-sm mb-2">
                    {gaveUp
                        ? "This is taking much longer than usual. Your membership will still activate automatically once payment is confirmed — check back later, or check now."
                        : slowMode
                          ? "Still waiting on confirmation — this can take a little longer under load."
                          : "If you cancelled or your GCash/Maya session expired, you can safely close that tab and check your status here."}
                </p>
                {error && (
                    <p className="text-red-400 text-sm text-center max-w-sm mb-4">
                        {error}
                    </p>
                )}
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
