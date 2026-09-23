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
            <div className="flex min-h-[100dvh] flex-1 items-center justify-center p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:rounded-xl sm:p-10">
                    {status === "pending" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <h1 className="text-lg font-semibold text-foreground sm:text-xl">
                                Confirming your payment…
                            </h1>
                            <p className="text-[13px] text-muted-foreground sm:text-sm">
                                This usually takes a few seconds. Don't close
                                this page.
                            </p>
                        </div>
                    )}
                    {status === "paid" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">
                                ✅
                            </div>
                            <h1 className="text-lg font-semibold text-foreground sm:text-xl">
                                Payment confirmed
                            </h1>
                            <p className="text-[13px] text-muted-foreground sm:text-sm">
                                Taking you back to your membership…
                            </p>
                        </div>
                    )}
                    {status === "failed" && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-2xl">
                                ⚠️
                            </div>
                            <h1 className="text-lg font-semibold text-foreground sm:text-xl">
                                Payment failed
                            </h1>
                            <p className="text-[13px] text-muted-foreground sm:text-sm">
                                No charge went through. You can try again from
                                your membership page.
                            </p>
                            <button
                                onClick={() => router.get("/member/membership")}
                                className="mt-1 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 sm:w-auto"
                            >
                                Back to membership
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
