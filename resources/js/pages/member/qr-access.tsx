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

            <div className="p-3 sm:p-6 md:p-10">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-5 flex items-start justify-between gap-3 sm:mb-8">
                        <div>
                            <p className="mb-1.5 text-[10px] font-medium tracking-widest text-primary/80 uppercase sm:mb-2 sm:text-xs">
                                Gym Access
                            </p>
                            <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-3xl">
                                Your access pass
                            </h1>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Show this code at the front desk to check in.
                            </p>
                        </div>

                        <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium sm:px-3 sm:text-xs ${
                                isActive
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-muted text-muted-foreground"
                            }`}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {isActive ? "Ready to scan" : "Inactive"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-[1.3fr_1fr]">
                        {/* Main pass card */}
                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6">
                            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

                            <div className="relative mb-5 flex items-center justify-between sm:mb-6">
                                <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase sm:text-xs">
                                    FitFlow Member Pass
                                </p>
                            </div>

                            <div className="relative mb-5 flex items-center gap-3 sm:mb-6">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary sm:h-11 sm:w-11">
                                    {member.initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-foreground">
                                        {member.name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                        {member.planName
                                            ? `${member.planName} member`
                                            : "No active plan"}
                                    </p>
                                </div>
                                <span
                                    className={`hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${
                                        isActive
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="relative flex justify-center rounded-xl bg-white py-5 sm:py-6">
                                <QRCodeSVG
                                    value={member.qrToken}
                                    size={180}
                                    level="M"
                                    className="h-[180px] w-[180px] sm:h-[220px] sm:w-[220px]"
                                />
                            </div>

                            <QRCodeCanvas
                                ref={downloadCanvasRef}
                                value={member.qrToken}
                                size={1024}
                                level="M"
                                style={{ display: "none" }}
                            />

                            <p className="relative mt-3 mb-5 text-center text-[11px] text-muted-foreground sm:mb-6 sm:text-xs">
                                Fixed access code · does not expire
                            </p>

                            <div className="relative mb-5 flex flex-wrap gap-2.5 sm:mb-6 sm:gap-3">
                                <button
                                    onClick={handleRegenerate}
                                    className="inline-flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary sm:px-4 sm:py-2.5 sm:text-sm"
                                >
                                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Regenerate code
                                </button>

                                <button
                                    onClick={handleDownload}
                                    className="inline-flex min-w-[110px] flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary sm:px-4 sm:py-2.5 sm:text-sm"
                                >
                                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Download QR
                                </button>
                            </div>

                            <div className="relative grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs sm:gap-4 sm:text-sm">
                                <div className="min-w-0">
                                    <p className="mb-1 text-[10px] text-muted-foreground sm:text-xs">
                                        Membership
                                    </p>
                                    <p className="truncate font-medium text-primary">
                                        {member.planName ?? "—"}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-[10px] text-muted-foreground sm:text-xs">
                                        Valid until
                                    </p>
                                    <p className="truncate font-medium text-primary">
                                        {member.validUntil ?? "—"}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-[10px] text-muted-foreground sm:text-xs">
                                        Member ID
                                    </p>
                                    <p className="truncate font-medium text-primary">
                                        {member.memberId}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Side panel */}
                        <div className="flex flex-col gap-4 sm:gap-6">
                            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                                <ShieldCheck className="mb-2.5 h-5 w-5 text-emerald-500 sm:mb-3 sm:h-6 sm:w-6" />
                                <p className="mb-1 text-sm font-semibold text-emerald-400 sm:text-base">
                                    {isActive ? "Good to go" : "Action needed"}
                                </p>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    {isActive
                                        ? "Your membership is active. Show this code to enter the gym."
                                        : "Your membership isn't active. Renew your plan to enable access."}
                                </p>
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
