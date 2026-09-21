import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Check, CheckCircle2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";

interface AttendanceEntry {
    id: number;
    date_label: string;
    time: string;
    method_label: string;
}

interface CheckinResult {
    result: "success" | "denied" | "duplicate";
    message: string;
}

interface ProfileData {
    id: number;
    code: string;
    name: string;
    email: string;
    phone: string | null;
    joined_at: string;
    plan: string | null;
    status: "active" | "expiring_soon" | "expired";
    valid_until: string | null;
    monthly_visits: number | null;
    last_check_in: string | null;
    avg_visits_per_week: number | null;
    streak_days: number | null;
    attendance_history: AttendanceEntry[];
    plan_history: {
        id: number;
        plan: string | null;
        price: string | null;
        started_at: string | null;
    }[];
    payments: {
        id: number;
        amount: string;
        status: string;
        date: string | null;
    }[];
    checkin?: CheckinResult;
}

const statusStyles: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    expiring_soon: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    expired: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels: Record<string, string> = {
    active: "Active",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
};

const paymentStyles: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    expired: "bg-muted text-muted-foreground border-border",
};

function csrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? ""
    );
}

export function StaffMemberProfileSheet({
    userId,
    open,
    onOpenChange,
}: {
    userId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(
        null,
    );

    useEffect(() => {
        if (!open || !userId) return;

        setLoading(true);
        setData(null);
        setCheckinResult(null);

        fetch(`/staff/members/${userId}`, {
            headers: { Accept: "application/json" },
        })
            .then((res) => res.json())
            .then((json) => setData(json))
            .finally(() => setLoading(false));
    }, [open, userId]);

    async function handleCheckIn() {
        if (!data || checkingIn) return;

        setCheckingIn(true);
        setCheckinResult(null);

        try {
            const res = await fetch(`/staff/members/${data.id}/checkin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken(),
                },
            });
            const json: ProfileData = await res.json();
            setData(json);
            if (json.checkin) {
                setCheckinResult(json.checkin);
                setTimeout(() => setCheckinResult(null), 4000);
            }
        } catch {
            setCheckinResult({
                result: "denied",
                message: "Network error — try again.",
            });
        } finally {
            setCheckingIn(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <p className="text-xs font-semibold tracking-wide text-orange-500">
                        MEMBER PROFILE
                    </p>
                    <SheetTitle>Member details</SheetTitle>
                </SheetHeader>

                {loading && (
                    <div className="space-y-3 px-4">
                        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                        <Skeleton className="mx-auto h-4 w-40" />
                        <Skeleton className="mx-auto h-4 w-56" />
                    </div>
                )}

                {data && !loading && (
                    <div className="space-y-6 px-4 pb-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 text-lg font-semibold text-orange-500">
                                {data.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                            </div>
                            <p className="mt-3 text-lg font-semibold text-foreground">
                                {data.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {data.code} · Joined {data.joined_at}
                            </p>
                            <Badge
                                variant="outline"
                                className={`mt-2 ${statusStyles[data.status]}`}
                            >
                                {statusLabels[data.status]}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCheckIn}
                                    disabled={checkingIn}
                                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {checkingIn ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                            Checking in...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Check in
                                        </>
                                    )}
                                </button>
                                <button
                                    disabled
                                    title="QR check-in coming soon"
                                    className="flex h-11 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground"
                                >
                                    <QrCode className="h-4 w-4" />
                                </button>
                            </div>

                            {checkinResult && (
                                <p
                                    className={`text-center text-xs font-medium ${
                                        checkinResult.result === "success"
                                            ? "text-emerald-500"
                                            : checkinResult.result ===
                                                "duplicate"
                                              ? "text-amber-500"
                                              : "text-red-500"
                                    }`}
                                >
                                    {checkinResult.message}
                                </p>
                            )}
                        </div>

                        <Tabs defaultValue="overview">
                            <TabsList className="w-full justify-start overflow-x-auto">
                                <TabsTrigger value="overview">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="membership">
                                    Membership
                                </TabsTrigger>
                                <TabsTrigger value="attendance">
                                    Attendance
                                </TabsTrigger>
                                <TabsTrigger value="payments">
                                    Payments
                                </TabsTrigger>
                                <TabsTrigger value="sessions">
                                    Sessions
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="overview"
                                className="space-y-4 pt-4"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Membership
                                    </p>
                                    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-xs font-medium text-orange-500">
                                            {data.plan ?? "—"} plan
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            Valid until{" "}
                                            {data.valid_until ?? "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Monthly visits
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {data.monthly_visits ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Last check-in
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {data.last_check_in ?? "—"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-semibold text-foreground">
                                        Contact
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-foreground/80">
                                            <span>📞</span>
                                            <span>{data.phone ?? "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-foreground/80">
                                            <span>✉️</span>
                                            <span>{data.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-foreground/80">
                                            <span>🪪</span>
                                            <span>{data.code}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="membership"
                                className="space-y-4 pt-4"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Membership details
                                    </p>
                                    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-xs font-medium text-orange-500">
                                            {data.plan ?? "—"} plan
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            Valid until{" "}
                                            {data.valid_until ?? "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Plan type
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.plan ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Status
                                        </p>
                                        <p className="font-semibold text-emerald-500">
                                            {statusLabels[data.status]}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Valid until
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.valid_until ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Joined
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.joined_at}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Monthly visits
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.monthly_visits ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Last check-in
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.last_check_in ?? "—"}
                                        </p>
                                    </div>
                                </div>

                                {data.plan_history.length > 0 && (
                                    <div>
                                        <p className="mb-2 text-sm font-semibold text-foreground">
                                            Plan history
                                        </p>
                                        <div className="space-y-3 border-l border-border pl-4">
                                            {data.plan_history.map((h) => (
                                                <div
                                                    key={h.id}
                                                    className="relative"
                                                >
                                                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-orange-500" />
                                                    <p className="text-sm font-medium text-foreground">
                                                        {h.plan}{" "}
                                                        {h.price &&
                                                            `· ₱${h.price}`}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {h.started_at}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent
                                value="attendance"
                                className="space-y-4 pt-4"
                            >
                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Visits this month
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.monthly_visits ?? 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Last check-in
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.last_check_in ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Avg visits/week
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.avg_visits_per_week ?? 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Streak
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {data.streak_days ?? 0} days
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-semibold text-foreground">
                                        Attendance history
                                    </p>
                                    {data.attendance_history.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No attendance data yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {data.attendance_history.map(
                                                (entry) => (
                                                    <div
                                                        key={entry.id}
                                                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground">
                                                                    {
                                                                        entry.date_label
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {entry.time}{" "}
                                                                    ·{" "}
                                                                    {
                                                                        entry.method_label
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="payments" className="pt-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-foreground">
                                        Payment history
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {data.payments.length}{" "}
                                        {data.payments.length === 1
                                            ? "payment"
                                            : "payments"}
                                    </span>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {data.payments.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            No payments yet.
                                        </p>
                                    )}
                                    {data.payments.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 text-emerald-500">
                                                    ▮
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        ₱{p.amount}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.date ?? "—"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    paymentStyles[p.status] ??
                                                    ""
                                                }
                                            >
                                                {p.status[0].toUpperCase() +
                                                    p.status.slice(1)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="sessions" className="pt-4">
                                <p className="text-sm text-muted-foreground">
                                    No sessions data yet.
                                </p>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
