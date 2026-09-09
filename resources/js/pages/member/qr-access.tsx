import { Head, router } from "@inertiajs/react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
    ShieldCheck,
    Clock,
    RefreshCw,
    Share2,
    ChevronRight,
    Download,
} from "lucide-react";
import { dashboard } from "@/routes";
import { useRef } from "react";

type Member = {
    name: string;
    initials: string;
    memberId: string;
    qrToken: string;
    planName: string | null;
    status: string;
    validUntil: string | null;
};

export default function QrAccess({ member }: { member: Member }) {
    const isActive = member.status === "active";

    const handleRegenerate = () => {
        router.post("/qraccess/regenerate", {}, { preserveScroll: true });
    };

    const handleShare = async () => {
        const shareData = {
            title: "My Gym Access Pass",
            text: `${member.name} — Member ID ${member.memberId}`,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
                // user cancelled, ignore
            }
        } else {
            await navigator.clipboard.writeText(member.qrToken);
        }
    };

    const downloadCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleDownload = () => {
        const canvas = downloadCanvasRef.current;
        if (!canvas) return;

        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `fitflow-access-${member.memberId}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <>
            <Head title="QR Access" />

            <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <p className="text-xs font-medium tracking-widest text-amber-500/80 uppercase mb-2">
                                Gym Access
                            </p>
                            <h1 className="text-3xl font-semibold text-white mb-1">
                                Your access pass
                            </h1>
                            <p className="text-sm text-neutral-400">
                                Show this code at the front desk to check in.
                            </p>
                        </div>

                        <span
                            className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                isActive
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-neutral-500/10 text-neutral-400"
                            }`}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {isActive ? "Ready to scan" : "Inactive"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
                        {/* Main pass card */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-xs font-medium tracking-widest text-neutral-500 uppercase">
                                    FitFlow Member Pass
                                </p>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-600/20 text-amber-400 font-semibold">
                                    {member.initials}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-white">
                                        {member.name}
                                    </p>
                                    <p className="text-sm text-neutral-400">
                                        {member.planName
                                            ? `${member.planName} member`
                                            : "No active plan"}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                        isActive
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-neutral-500/10 text-neutral-400"
                                    }`}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="flex justify-center py-6 bg-white rounded-xl">
                                <QRCodeSVG
                                    value={member.qrToken}
                                    size={220}
                                    level="M"
                                />
                            </div>

                            <QRCodeCanvas
                                ref={downloadCanvasRef}
                                value={member.qrToken}
                                size={1024}
                                level="M"
                                style={{ display: "none" }}
                            />

                            <p className="text-center text-xs text-neutral-500 mt-3 mb-6">
                                Fixed access code · does not expire
                            </p>

                            <div className="flex flex-wrap gap-3 mb-6">
                                <button
                                    onClick={handleRegenerate}
                                    className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/60 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Regenerate code
                                </button>
                               
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/60 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Download QR
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 border-t border-neutral-800 pt-4 text-sm">
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">
                                        Membership
                                    </p>
                                    <p className="font-medium text-amber-400">
                                        {member.planName ?? "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">
                                        Valid until
                                    </p>
                                    <p className="font-medium text-amber-400">
                                        {member.validUntil ?? "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500 mb-1">
                                        Member ID
                                    </p>
                                    <p className="font-medium text-amber-400">
                                        {member.memberId}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Side panel */}
                        <div className="flex flex-col gap-6">
                            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                                <ShieldCheck className="h-6 w-6 text-emerald-500 mb-3" />
                                <p className="font-semibold text-emerald-400 mb-1">
                                    {isActive ? "Good to go" : "Action needed"}
                                </p>
                                <p className="text-sm text-neutral-400">
                                    {isActive
                                        ? "Your membership is active. Show this code to enter the gym."
                                        : "Your membership isn't active. Renew your plan to enable access."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                                <Clock className="h-6 w-6 text-amber-500 mb-3" />
                                <p className="font-semibold text-amber-400 mb-1">
                                    Last check-in
                                </p>
                                {/* Static placeholder — wire up once attendance records exist */}
                                <p className="text-sm text-neutral-400 mb-3">
                                    Today, 5:42 PM
                                </p>
                                <button className="inline-flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300">
                                    View activity
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

QrAccess.layout = {
    breadcrumbs: [
        {
            title: "QR Access",
            href: dashboard(),
        },
    ],
};
