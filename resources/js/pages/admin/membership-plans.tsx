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

                <RevenueMixChart />

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
