import { Head, router } from "@inertiajs/react";
import { useEffect, useState, useCallback, useRef } from "react";

const FAST_INTERVAL_MS = 3000;
const SLOW_INTERVAL_MS = 10000;
const BACKOFF_AFTER_MS = 60000; // switch to slow polling after this long
const GIVE_UP_AFTER_MS = 5 * 60000; // stop polling entirely after this long

export default function PaymentPending({ invoice_id }: { invoice_id: number }) {
    const [slowMode, setSlowMode] = useState(false);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(
                `/onboarding/invoices/${invoice_id}/status`,
                {
                    headers: { Accept: "application/json" },
                },
            );

            if (!res.ok) return;

            const json = await res.json();

            if (json.status === "paid") {
                router.visit("/dashboard");
            } else if (json.status === "failed") {
                router.visit("/onboarding", { data: { failed: 1 } });
            }
        } catch (err) {
            console.error("Payment status check failed", err);
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
            <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-foreground">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary sm:h-12 sm:w-12" />
                <h1 className="mt-6 text-xl font-bold sm:text-2xl">
                    Confirming your payment
                </h1>
                <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground sm:text-base">
                    This usually takes a few seconds.
                </p>
            </div>
        </>
    );
}
