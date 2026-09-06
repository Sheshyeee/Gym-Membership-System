import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

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
    plan_history: {
        id: number;
        plan: string | null;
        price: string | null;
        started_at: string | null;
    }[];
    payments: {
        id: number;
        txn_id: string;
        amount: string;
        status: string;
        date: string | null;
    }[];
}

const statusStyles: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    expiring_soon:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    expired: "bg-muted text-muted-foreground border-border",
};

const paymentStyles: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    pending:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    failed: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    expired: "bg-muted text-muted-foreground border-border",
};

export function MemberProfileSheet({
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

    useEffect(() => {
        if (!open || !userId) return;

        setLoading(true);
        setData(null);

        fetch(`/members/${userId}`, {
            headers: { Accept: "application/json" },
        })
            .then((res) => res.json())
            .then((json) => setData(json))
            .finally(() => setLoading(false));
    }, [open, userId]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                        FITFLOW ADMIN
                    </p>
                    <SheetTitle>Member profile</SheetTitle>
                </SheetHeader>

                {loading && (
                    <div className="space-y-3 px-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                )}

                {data && !loading && (
                    <div className="space-y-6 px-4 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                                {data.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground">
                                    {data.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {data.email}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={statusStyles[data.status]}
                                    >
                                        {data.status === "active"
                                            ? "Active"
                                            : data.status === "expiring_soon"
                                              ? "Expiring soon"
                                              : "Expired"}
                                    </Badge>
                                    {data.plan && (
                                        <span className="text-xs text-muted-foreground">
                                            {data.plan} member
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <Tabs defaultValue="overview">
                            <TabsList className="w-full justify-start overflow-x-auto">
                                <TabsTrigger value="overview">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="membership">
                                    Membership
                                </TabsTrigger>
                                <TabsTrigger value="payments">
                                    Payments
                                </TabsTrigger>
                                <TabsTrigger value="attendance">
                                    Attendance
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="overview"
                                className="space-y-4 pt-4"
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">
                                            Valid until
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {data.valid_until ?? "—"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">
                                            Gym visits
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            —
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">
                                            Payment
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {data.payments[0]?.status
                                                ? data.payments[0].status[0].toUpperCase() +
                                                  data.payments[0].status.slice(
                                                      1,
                                                  )
                                                : "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-border/60 py-2">
                                        <span className="text-muted-foreground">
                                            Member ID
                                        </span>
                                        <span className="text-foreground">
                                            {data.code}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/60 py-2">
                                        <span className="text-muted-foreground">
                                            Phone
                                        </span>
                                        <span className="text-foreground">
                                            {data.phone ?? "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/60 py-2">
                                        <span className="text-muted-foreground">
                                            Joined
                                        </span>
                                        <span className="text-foreground">
                                            {data.joined_at}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">
                                            Plan
                                        </span>
                                        <span className="text-foreground">
                                            {data.plan ?? "—"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-semibold text-foreground">
                                        Recent activity
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        No recent activity yet.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="membership"
                                className="space-y-4 pt-4"
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">
                                            Current plan
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {data.plan ?? "—"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">
                                            Valid until
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {data.valid_until ?? "—"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">
                                            Status
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                            {data.status === "active"
                                                ? "Active"
                                                : data.status ===
                                                    "expiring_soon"
                                                  ? "Expiring soon"
                                                  : "Expired"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-semibold text-foreground">
                                        Plan history
                                    </p>
                                    <div className="space-y-3 border-l border-border pl-4">
                                        {data.plan_history.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No plan history yet.
                                            </p>
                                        )}
                                        {data.plan_history.map((h) => (
                                            <div
                                                key={h.id}
                                                className="relative"
                                            >
                                                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-orange-500" />
                                                <p className="text-sm font-medium text-foreground">
                                                    {h.plan}{" "}
                                                    {h.price && `· ₱${h.price}`}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {h.started_at}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="payments" className="pt-4">
                                <div className="overflow-x-auto rounded-lg border border-border">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                                                <th className="px-3 py-2 font-medium">
                                                    Txn ID
                                                </th>
                                                <th className="px-3 py-2 font-medium">
                                                    Amount
                                                </th>
                                                <th className="px-3 py-2 font-medium">
                                                    Status
                                                </th>
                                                <th className="px-3 py-2 font-medium">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.payments.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-3 py-4 text-center text-muted-foreground"
                                                    >
                                                        No payments yet.
                                                    </td>
                                                </tr>
                                            )}
                                            {data.payments.map((p) => (
                                                <tr
                                                    key={p.id}
                                                    className="border-b border-border/60 last:border-0"
                                                >
                                                    <td className="px-3 py-2 font-medium text-foreground">
                                                        {p.txn_id}
                                                    </td>
                                                    <td className="px-3 py-2 text-foreground/80">
                                                        ₱{p.amount}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                paymentStyles[
                                                                    p.status
                                                                ] ?? ""
                                                            }
                                                        >
                                                            {p.status[0].toUpperCase() +
                                                                p.status.slice(
                                                                    1,
                                                                )}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-3 py-2 text-foreground/80">
                                                        {p.date ?? "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>

                            <TabsContent value="attendance" className="pt-4">
                                <p className="text-sm text-muted-foreground">
                                    No attendance data yet.
                                </p>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
