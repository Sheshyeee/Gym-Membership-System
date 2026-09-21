import { useState } from "react";
import { Head } from "@inertiajs/react";
import { FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

import { dashboard } from "@/routes";
import type { Plan } from "@/types/plan";
import { RevenueMixChart } from "@/components/revenue-mix-chart";
import { EditPlanDialog } from "@/components/edit-plan-dialog";
import { PlanCard } from "@/components/plan-card";

export default function MembershipPlans({ plans }: { plans: Plan[] }) {
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // A fixed, high-contrast palette so plans are always visually distinct,
    // regardless of how many there are or what plan.color contains.
    const PALETTE = [
        "#f97316", // orange
        "#10b981", // emerald
        "#3b82f6", // blue
        "#a855f7", // violet
        "#ef4444", // red
        "#eab308", // yellow
        "#06b6d4", // cyan
        "#ec4899", // pink
    ];

    // If PlanColor is a semantic token (e.g. 'orange', 'emerald'), map it to a
    // real hex value here. Extend this to match whatever values PlanColor allows.
    const PLAN_COLOR_MAP: Record<string, string> = {
        orange: "#f97316",
        emerald: "#10b981",
        blue: "#3b82f6",
        violet: "#a855f7",
        red: "#ef4444",
        yellow: "#eab308",
        cyan: "#06b6d4",
        pink: "#ec4899",
    };

    function resolveColor(color: string | null, index: number): string {
        if (color) {
            // Already a hex/rgb value? Use it directly.
            if (color.startsWith("#") || color.startsWith("rgb")) return color;
            // Semantic token? Look it up, falling back to the rotating palette.
            if (PLAN_COLOR_MAP[color]) return PLAN_COLOR_MAP[color];
        }
        return PALETTE[index % PALETTE.length];
    }

    const revenueMix = plans
        .filter((plan) => plan.net_revenue > 0)
        .map((plan, index) => ({
            name: plan.name,
            value: plan.net_revenue,
            color: resolveColor(plan.color, index),
        }));

    return (
        <>
            <Head title="Membership Plans" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <span className="mt-1.5 size-2 rounded-full bg-emerald-500" />
                        <div>
                            <p className="text-xs font-medium text-emerald-500">
                                Live workspace
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-foreground">
                                Membership Plans
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage your pricing, benefits, and member
                                distribution.
                            </p>
                        </div>
                    </div>
                    <Button className="gap-2">
                        <FileBarChart className="size-4" />
                        Create report
                    </Button>
                </div>

                <RevenueMixChart data={revenueMix} />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={() => setEditingPlan(plan)}
                        />
                    ))}
                </div>
            </div>

            <EditPlanDialog
                plan={editingPlan}
                open={editingPlan !== null}
                onOpenChange={(open) => !open && setEditingPlan(null)}
            />
        </>
    );
}

MembershipPlans.layout = {
    breadcrumbs: [{ title: "Membership Plans", href: dashboard() }],
};
