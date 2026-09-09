import { useEffect, useRef, useState } from "react";
import { Head } from "@inertiajs/react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { ShieldCheck, XCircle, Camera } from "lucide-react";
import { dashboard } from "@/routes";

type ScanResult = {
    result: "success" | "denied";
    reason?: string;
    message?: string;
    member?: { name: string; initials: string; plan?: string };
    scannedAt?: string;
};

const SCANNER_ID = "qr-reader";

function csrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? ""
    );
}

export default function QRCheckIn() {
    const [scanning, setScanning] = useState(false);
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const cooldownRef = useRef(false);

    useEffect(() => {
        const scanner = new Html5Qrcode(SCANNER_ID);
        let cancelled = false;

        const safeStop = () => {
            try {
                if (
                    scanner.getState() === Html5QrcodeScannerState.SCANNING ||
                    scanner.getState() === Html5QrcodeScannerState.PAUSED
                ) {
                    scanner.stop().catch(() => {});
                }
            } catch {
                // Not in a stoppable state — ignore.
            }
        };

        scanner
            .start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: (
                        viewfinderWidth: number,
                        viewfinderHeight: number,
                    ) => {
                        const minEdge = Math.min(
                            viewfinderWidth,
                            viewfinderHeight,
                        );
                        const size = Math.floor(minEdge * 0.7);
                        return { width: size, height: size };
                    },
                },
                (decodedText) => handleDecoded(decodedText),
                () => {},
            )
            .then(() => {
                if (cancelled) {
                    safeStop();
                    return;
                }
                setScanning(true);
            })
            .catch(() => {
                if (!cancelled) {
                    setError(
                        "Could not access camera. Check browser permissions.",
                    );
                }
            });

        return () => {
            cancelled = true;
            safeStop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDecoded = async (token: string) => {
        if (cooldownRef.current) return;
        cooldownRef.current = true;

        try {
            const res = await fetch("/staff/checkin/scan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken(),
                },
                body: JSON.stringify({ token }),
            });
            const data: ScanResult = await res.json();
            setLastResult(data);
        } catch {
            setLastResult({
                result: "denied",
                message: "Network error — try again.",
            });
        } finally {
            setTimeout(() => (cooldownRef.current = false), 3000);
        }
    };

    return (
        <>
            <Head title="QR Check-in" />
            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <p className="text-xs font-medium tracking-widest text-amber-500/80 uppercase mb-2">
                                Front Desk Operations
                            </p>
                            <h1 className="text-3xl font-semibold text-white mb-1">
                                QR check-in
                            </h1>
                            <p className="text-sm text-neutral-400">
                                Scan a member's code to verify access instantly.
                            </p>
                        </div>
                        <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Secure scanner
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                            <div className="flex items-center justify-between mb-4 text-xs">
                                <span
                                    className={`inline-flex items-center gap-1.5 ${scanning ? "text-emerald-400" : "text-neutral-500"}`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${scanning ? "bg-emerald-400" : "bg-neutral-600"}`}
                                    />
                                    {scanning
                                        ? "Scanner ready"
                                        : "Starting camera…"}
                                </span>
                                <span className="text-neutral-500">
                                    Camera 01
                                </span>
                            </div>

                            <div className="relative aspect-square rounded-xl border border-amber-600/30 bg-black overflow-hidden">
                                <div
                                    id={SCANNER_ID}
                                    className="w-full h-full"
                                />
                                <style>{`
        #${SCANNER_ID} {
            width: 100% !important;
            height: 100% !important;
        }
        #${SCANNER_ID} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
        }
    `}</style>
                            </div>

                            {error ? (
                                <p className="text-center text-sm text-red-400 mt-4">
                                    {error}
                                </p>
                            ) : (
                                <p className="text-center text-xs text-neutral-500 mt-4">
                                    Position the member QR code inside the frame
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                                <Camera className="h-6 w-6 text-amber-500 mb-3" />
                                <p className="font-semibold text-white mb-1">
                                    Fast entry, zero friction.
                                </p>
                                <p className="text-sm text-neutral-400">
                                    Verify active memberships in under a second
                                    and keep your lobby moving.
                                </p>
                            </div>

                            {lastResult && (
                                <div
                                    className={`rounded-2xl border p-6 ${
                                        lastResult.result === "success"
                                            ? "border-emerald-800 bg-emerald-950/40"
                                            : "border-red-900 bg-red-950/40"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {lastResult.result === "success" ? (
                                            <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-400" />
                                        )}
                                        <p
                                            className={`text-sm font-semibold ${lastResult.result === "success" ? "text-emerald-400" : "text-red-400"}`}
                                        >
                                            {lastResult.result === "success"
                                                ? "Access Granted"
                                                : "Access Denied"}
                                        </p>
                                    </div>
                                    {lastResult.member && (
                                        <p className="font-medium text-white">
                                            {lastResult.member.name}
                                            {lastResult.member.plan
                                                ? ` · ${lastResult.member.plan}`
                                                : ""}
                                        </p>
                                    )}
                                    {lastResult.reason && (
                                        <p className="text-sm text-neutral-300 mt-1">
                                            {lastResult.reason}
                                        </p>
                                    )}
                                    {lastResult.message && (
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {lastResult.message}
                                        </p>
                                    )}
                                    {lastResult.scannedAt && (
                                        <p className="text-xs text-neutral-500 mt-2">
                                            Scanned at {lastResult.scannedAt}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

QRCheckIn.layout = {
    breadcrumbs: [{ title: "QR Check-in", href: dashboard() }],
};
