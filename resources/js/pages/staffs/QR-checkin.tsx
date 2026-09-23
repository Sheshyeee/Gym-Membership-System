import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { Head } from "@inertiajs/react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import {
    ShieldCheck,
    XCircle,
    AlertTriangle,
    Camera,
    RotateCw,
    QrCode,
} from "lucide-react";
import { dashboard } from "@/routes";
import { cn } from "@/lib/utils";

type ScanResult = {
    result: "success" | "denied" | "duplicate";
    reason?: string;
    message?: string;
    member?: { name: string; initials: string; plan?: string };
    scannedAt?: string;
};

type CameraOption = { id: string; label: string };
type CameraState = "idle" | "requesting" | "ready" | "error";

const SCANNER_ID = "qr-reader";
const DECODE_COOLDOWN_MS = 3000;

function csrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? ""
    );
}

function pickInitialCameraIndex(cameras: CameraOption[]) {
    const backIndex = cameras.findIndex((c) =>
        /back|rear|environment/i.test(c.label),
    );
    return backIndex >= 0 ? backIndex : 0;
}

function Panel({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-3 sm:p-4",
                className,
            )}
        >
            {children}
        </div>
    );
}

export default function QRCheckIn() {
    const [cameraState, setCameraState] = useState<CameraState>("idle");
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameras, setCameras] = useState<CameraOption[]>([]);
    const [cameraIndex, setCameraIndex] = useState(0);
    const [switching, setSwitching] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const cooldownRef = useRef(false);
    const mountedRef = useRef(true);

    const handleDecoded = useCallback(async (token: string) => {
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
            setTimeout(() => (cooldownRef.current = false), DECODE_COOLDOWN_MS);
        }
    }, []);

    const safeStop = useCallback(async () => {
        const scanner = scannerRef.current;
        if (!scanner) return;
        try {
            const state = scanner.getState();
            if (
                state === Html5QrcodeScannerState.SCANNING ||
                state === Html5QrcodeScannerState.PAUSED
            ) {
                await scanner.stop();
            }
        } catch {
            // Not in a stoppable state — ignore.
        }
    }, []);

    const startWithCamera = useCallback(
        async (cameraId: string) => {
            const scanner = scannerRef.current;
            if (!scanner) return;

            await scanner.start(
                cameraId,
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
            );
        },
        [handleDecoded],
    );

    // Camera no longer auto-starts on mount — some mobile browsers (iOS
    // Safari, in-app webviews) silently block getUserMedia unless it's
    // triggered directly by a user tap. Requesting it from a click handler
    // avoids that and also gives us an intentional "camera is off" state
    // instead of a broken-looking blank box.
    const handleStartCamera = useCallback(async () => {
        setError(null);
        setCameraState("requesting");

        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(SCANNER_ID);
            }

            const devices = await Html5Qrcode.getCameras();
            if (!mountedRef.current) return;

            if (devices && devices.length > 0) {
                const options = devices.map((d) => ({
                    id: d.id,
                    label: d.label || "Camera",
                }));
                const initialIndex = pickInitialCameraIndex(options);
                setCameras(options);
                setCameraIndex(initialIndex);
                await startWithCamera(options[initialIndex].id);
            } else {
                // Fallback if enumeration returns nothing.
                await scannerRef.current.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (w: number, h: number) => {
                            const size = Math.floor(Math.min(w, h) * 0.7);
                            return { width: size, height: size };
                        },
                    },
                    (decodedText) => handleDecoded(decodedText),
                    () => {},
                );
            }

            if (mountedRef.current) setCameraState("ready");
        } catch {
            if (mountedRef.current) {
                setError(
                    "Could not access camera. Check browser permissions and try again.",
                );
                setCameraState("error");
            }
        }
    }, [handleDecoded, startWithCamera]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            safeStop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFlipCamera = useCallback(async () => {
        if (cameras.length < 2 || switching) return;

        setSwitching(true);
        const nextIndex = (cameraIndex + 1) % cameras.length;

        try {
            await safeStop();
            await startWithCamera(cameras[nextIndex].id);
            setCameraIndex(nextIndex);
            setCameraState("ready");
        } catch {
            setError("Could not switch camera.");
        } finally {
            setSwitching(false);
        }
    }, [cameras, cameraIndex, switching, safeStop, startWithCamera]);

    const statusStyles: Record
        ScanResult["result"],
        {
            border: string;
            bg: string;
            text: string;
            icon: ReactElement;
            label: string;
        }
    > = {
        success: {
            border: "border-emerald-500/30",
            bg: "bg-emerald-500/10",
            text: "text-emerald-500",
            icon: <ShieldCheck className="size-4 text-emerald-500 sm:size-5" />,
            label: "Access Granted",
        },
        denied: {
            border: "border-red-500/30",
            bg: "bg-red-500/10",
            text: "text-red-500",
            icon: <XCircle className="size-4 text-red-500 sm:size-5" />,
            label: "Access Denied",
        },
        duplicate: {
            border: "border-amber-500/30",
            bg: "bg-amber-500/10",
            text: "text-amber-500",
            icon: (
                <AlertTriangle className="size-4 text-amber-500 sm:size-5" />
            ),
            label: "Already Scanned",
        },
    };

    return (
        <>
            <Head title="QR Check-in" />
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 p-3 sm:gap-5 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="mb-1 text-[10px] font-semibold tracking-widest text-orange-500 uppercase sm:text-[11px]">
                            Front desk operations
                        </p>
                        <h1 className="text-foreground text-lg font-semibold sm:text-xl">
                            QR check-in
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-[12px]">
                            Scan a member&apos;s code to verify access
                            instantly.
                        </p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-500 md:inline-flex">
                        <ShieldCheck className="size-3.5" />
                        Secure scanner
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
                    <Panel>
                        <div className="mb-3 flex items-center justify-between text-[11px] sm:text-[12px]">
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1.5",
                                    cameraState === "ready"
                                        ? "text-emerald-500"
                                        : "text-muted-foreground",
                                )}
                            >
                                <span
                                    className={cn(
                                        "size-1.5 rounded-full",
                                        cameraState === "ready"
                                            ? "bg-emerald-500"
                                            : "bg-muted-foreground/50",
                                    )}
                                />
                                {cameraState === "ready" && "Scanner ready"}
                                {cameraState === "requesting" &&
                                    "Requesting camera access…"}
                                {cameraState === "idle" && "Camera is off"}
                                {cameraState === "error" && "Camera unavailable"}
                            </span>

                            {cameraState === "ready" && cameras.length > 1 && (
                                <button
                                    type="button"
                                    onClick={handleFlipCamera}
                                    disabled={switching}
                                    className="border-sidebar-border/70 dark:border-sidebar-border bg-background text-foreground/80 hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <RotateCw
                                        className={cn(
                                            "size-3.5",
                                            switching && "animate-spin",
                                        )}
                                    />
                                    {switching ? "Switching…" : "Flip camera"}
                                </button>
                            )}
                        </div>

                        <div className="border-primary/30 relative aspect-square overflow-hidden rounded-xl border bg-black">
                            <div id={SCANNER_ID} className="h-full w-full" />
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

                            {cameraState !== "ready" && (
                                <div className="bg-background/95 absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                                    {cameraState === "requesting" ? (
                                        <>
                                            <div className="border-muted-foreground/30 border-t-primary size-8 animate-spin rounded-full border-2" />
                                            <p className="text-muted-foreground text-[12px] sm:text-[13px]">
                                                Requesting camera access…
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
                                                {cameraState === "error" ? (
                                                    <AlertTriangle className="size-5 text-red-500" />
                                                ) : (
                                                    <QrCode className="text-primary size-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-foreground text-[13px] font-medium sm:text-[14px]">
                                                    {cameraState === "error"
                                                        ? "Camera access failed"
                                                        : "Camera is off"}
                                                </p>
                                                <p className="text-muted-foreground mt-0.5 max-w-[24ch] text-[11px] sm:text-[12px]">
                                                    {cameraState === "error"
                                                        ? error
                                                        : "Tap below to start scanning member codes."}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleStartCamera}
                                                className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-medium transition-opacity hover:opacity-90 sm:text-[13px]"
                                            >
                                                <Camera className="size-3.5" />
                                                {cameraState === "error"
                                                    ? "Try again"
                                                    : "Start camera"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {cameraState === "ready" && (
                            <p className="text-muted-foreground mt-3 text-center text-[10px] sm:text-[11px]">
                                Position the member QR code inside the frame
                            </p>
                        )}
                    </Panel>

                    <div className="flex flex-col gap-4">
                        <Panel>
                            <Camera className="mb-2.5 size-5 text-orange-500 sm:size-6" />
                            <p className="text-foreground text-[13px] font-semibold sm:text-[14px]">
                                Fast entry, zero friction.
                            </p>
                            <p className="text-muted-foreground mt-1 text-[11px] sm:text-[12px]">
                                Verify active memberships in under a second
                                and keep your lobby moving.
                            </p>
                        </Panel>

                        {lastResult && (
                            <Panel
                                className={`${statusStyles[lastResult.result].border} ${statusStyles[lastResult.result].bg}`}
                            >
                                <div className="mb-1.5 flex items-center gap-2">
                                    {statusStyles[lastResult.result].icon}
                                    <p
                                        className={`text-[12px] font-semibold sm:text-[13px] ${statusStyles[lastResult.result].text}`}
                                    >
                                        {lastResult.reason ??
                                            statusStyles[lastResult.result]
                                                .label}
                                    </p>
                                </div>
                                {lastResult.member && (
                                    <p className="text-foreground text-[12px] font-medium sm:text-[13px]">
                                        {lastResult.member.name}
                                        {lastResult.member.plan
                                            ? ` · ${lastResult.member.plan}`
                                            : ""}
                                    </p>
                                )}
                                {lastResult.message && (
                                    <p className="text-muted-foreground mt-1 text-[10px] sm:text-[11px]">
                                        {lastResult.message}
                                    </p>
                                )}
                                {lastResult.scannedAt && (
                                    <p className="text-muted-foreground mt-1.5 text-[10px] sm:text-[11px]">
                                        Scanned at {lastResult.scannedAt}
                                    </p>
                                )}
                            </Panel>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

QRCheckIn.layout = {
    breadcrumbs: [{ title: "QR Check-in", href: dashboard() }],
};