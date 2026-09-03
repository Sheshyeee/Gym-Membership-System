import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";

export default function PaymentPending({ invoice_id }: { invoice_id: number }) {
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        // Poll the dashboard route; once the webhook activates the
        // subscription, the `subscribed` middleware will let this through.
        const interval = setInterval(() => {
            setAttempts((a) => a + 1);
            router.reload({
                only: [],
                onSuccess: () => {},
            });
            router.visit("/dashboard", { preserveState: false });
        }, 3000);

        // Give up after ~30s and let the user check manually.
        const timeout = setTimeout(() => clearInterval(interval), 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    return (
        <>
            <Head title="Confirming payment..." />
            <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
                <div className="w-12 h-12 border-4 border-neutral-700 border-t-amber-500 rounded-full animate-spin mb-6" />
                <h1 className="text-2xl font-bold mb-2">
                    Confirming your payment
                </h1>
                <p className="text-neutral-400 text-center max-w-sm">
                    This usually takes a few seconds. Don't close this page.
                </p>
            </div>
        </>
    );
}
