import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function MembershipPaymentPending({
    invoice_id,
}: {
    invoice_id: number;
}) {
    const [status, setStatus] = useState<"pending" | "paid" | "failed">(
        "pending",
    );

    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await fetch(
                `/member/membership/invoices/${invoice_id}/status`,
            );
            const body = await res.json();

            if (body.status === "paid") {
                clearInterval(interval);
                setStatus("paid");
                setTimeout(() => router.get("/member/membership"), 1200);
            } else if (body.status === "failed") {
                clearInterval(interval);
                setStatus("failed");
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [invoice_id]);

    return (
        <>
            <Head title="Processing payment" />
            <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-16 text-center">
                {status === "pending" && (
                    <>
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                        <h1 className="text-xl font-semibold text-white">
                            Confirming your payment…
                        </h1>
                        <p className="text-sm text-neutral-400">
                            This usually takes a few seconds. Don't close this
                            page.
                        </p>
                    </>
                )}
                {status === "paid" && (
                    <>
                        <div className="text-3xl">✅</div>
                        <h1 className="text-xl font-semibold text-white">
                            Payment confirmed
                        </h1>
                        <p className="text-sm text-neutral-400">
                            Taking you back to your membership…
                        </p>
                    </>
                )}
                {status === "failed" && (
                    <>
                        <div className="text-3xl">⚠️</div>
                        <h1 className="text-xl font-semibold text-white">
                            Payment failed
                        </h1>
                        <p className="text-sm text-neutral-400">
                            No charge went through. You can try again from your
                            membership page.
                        </p>
                        <button
                            onClick={() => router.get("/member/membership")}
                            className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-black"
                        >
                            Back to membership
                        </button>
                    </>
                )}
            </div>
        </>
    );
}
