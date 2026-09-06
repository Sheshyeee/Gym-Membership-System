import { Check, ChevronRight, Pencil, Users } from "lucide-react";
import type { Plan, PlanColor } from "@/types/plan";

const THEME: Record<PlanColor, { tile: string; card: string; accent: string }> =
    {
        blue: {
            tile: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
            card: "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10",
            accent: "text-blue-600 dark:text-blue-400",
        },
        orange: {
            tile: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
            card: "border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/10",
            accent: "text-orange-600 dark:text-orange-400",
        },
        green: {
            tile: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            card: "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10",
            accent: "text-emerald-600 dark:text-emerald-400",
        },
    };

function formatPeso(centavos: number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
    }).format(centavos / 100);
}

export function PlanCard({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
    const theme = THEME[plan.color ?? "blue"];

    return (
        <div
            className={`flex flex-col gap-4 rounded-xl border p-5 ${theme.card}`}
        >
            <div className="flex items-start justify-between">
                <div
                    className={`flex size-9 items-center justify-center rounded-lg ${theme.tile}`}
                >
                    <Users className="size-4" />
                </div>
                <button
                    onClick={onEdit}
                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
                    aria-label={`Edit ${plan.name} plan`}
                >
                    <Pencil className="size-4" />
                </button>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                </h3>
                {plan.tagline && (
                    <p className="text-sm text-muted-foreground">
                        {plan.tagline}
                    </p>
                )}
            </div>

            <div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-foreground">
                        {formatPeso(plan.monthly_price)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        / Month
                    </span>
                </div>
                {plan.annual_price != null && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        or {formatPeso(plan.annual_price)} billed yearly
                    </p>
                )}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-3.5" />
                {plan.active_members_count} active members
            </div>

            <ul className="flex flex-col gap-2">
                {plan.features.map((feature) => (
                    <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-foreground"
                    >
                        <Check
                            className={`size-3.5 shrink-0 ${theme.accent}`}
                        />
                        {feature}
                    </li>
                ))}
            </ul>

            <button
                onClick={onEdit}
                className={`mt-auto flex items-center gap-0.5 self-start text-sm font-medium ${theme.accent} hover:underline`}
            >
                Edit plan
                <ChevronRight className="size-3.5" />
            </button>
        </div>
    );
}
