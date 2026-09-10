import {
  JSX,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactElement,
} from "react";
import { Head } from "@inertiajs/react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import {
    ShieldCheck,
    XCircle,
    AlertTriangle,
    Camera,
    RotateCw,
} from "lucide-react";
import { dashboard } from "@/routes";

type ScanResult = {
    result: "success" | "denied" | "duplicate";
    reason?: string;
    message?: string;
    member?: { name: string; initials: string; plan?: string };
    scannedAt?: string;
};

type CameraOption = { id: string; label: string };

const SCANNER_ID = "qr-reader";
const DECODE_COOLDOWN_MS = 3000;

function csrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? ""
    );
}

// Rough heuristic to start on the rear camera when labels are available.
function pickInitialCameraIndex(cameras: CameraOption[]) {
    const backIndex = cameras.findIndex((c) =>
        /back|rear|environment/i.test(c.label),
    );
    return backIndex >= 0 ? backIndex : 0;
}

export default function QRCheckIn() {
    const [scanning, setScanning] = useState(false);
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

    useEffect(() => {
        mountedRef.current = true;
        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        (async () => {
            try {
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
                    // Fallback if enumeration returns nothing (some browsers
                    // require this facingMode form before permission is granted).
                    await scanner.start(
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

                if (mountedRef.current) setScanning(true);
            } catch {
                if (mountedRef.current) {
                    setError(
                        "Could not access camera. Check browser permissions.",
                    );
                }
            }
        })();

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
            setScanning(true);
        } catch {
            setError("Could not switch camera.");
        } finally {
            setSwitching(false);
        }
    }, [cameras, cameraIndex, switching, safeStop, startWithCamera]);

    const statusStyles: Record<
        ScanResult["result"],
        {
            border: string;
            bg: string;
            text: string;
            icon: JSX.Element;
            label: string;
        }
    > = {
        success: {
            border: "border-emerald-800",
            bg: "bg-emerald-950/40",
            text: "text-emerald-400",
            icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
            label: "Access Granted",
        },
        denied: {
            border: "border-red-900",
            bg: "bg-red-950/40",
            text: "text-red-400",
            icon: <XCircle className="h-5 w-5 text-red-400" />,
            label: "Access Denied",
        },
        duplicate: {
            border: "border-amber-900",
            bg: "bg-amber-950/40",
            text: "text-amber-400",
            icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
            label: "Already Scanned",
        },
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

                                {cameras.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleFlipCamera}
                                        disabled={switching}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/80 px-3 py-1 text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <RotateCw
                                            className={`h-3.5 w-3.5 ${switching ? "animate-spin" : ""}`}
                                        />
                                        {switching
                                            ? "Switching…"
                                            : "Flip camera"}
                                    </button>
                                )}
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
                                    className={`rounded-2xl border p-6 ${statusStyles[lastResult.result].border} ${statusStyles[lastResult.result].bg}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {statusStyles[lastResult.result].icon}
                                        <p
                                            className={`text-sm font-semibold ${statusStyles[lastResult.result].text}`}
                                        >
                                            {lastResult.reason ??
                                                statusStyles[lastResult.result]
                                                    .label}
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
