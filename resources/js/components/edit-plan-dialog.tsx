import { FormEventHandler, useEffect, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Check, Plus, X } from "lucide-react";
import type { Plan } from "@/types/plan";

type PriceView = "monthly" | "annual";

type EditPlanForm = {
    name: string;
    description: string;
    monthly_price: string;
    annual_price: string;
    features: string[];
};

export function EditPlanDialog({
    plan,
    open,
    onOpenChange,
}: {
    plan: Plan | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm<EditPlanForm>({
            name: "",
            description: "",
            monthly_price: "",
            annual_price: "",
            features: [],
        });

    const [priceView, setPriceView] = useState<PriceView>("monthly");

    useEffect(() => {
        if (!plan) return;

        setData({
            name: plan.name,
            description: plan.description ?? "",
            monthly_price: String(plan.monthly_price / 100),
            annual_price:
                plan.annual_price != null
                    ? String(plan.annual_price / 100)
                    : "",
            features: plan.features,
        });
        setPriceView("monthly");
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plan]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!plan) return;

        patch(`/admin/plans/${plan.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    const updateFeature = (index: number, value: string) => {
        const next = [...data.features];
        next[index] = value;
        setData("features", next);
    };

    const removeFeature = (index: number) => {
        setData(
            "features",
            data.features.filter((_, i) => i !== index),
        );
    };

    const priceField =
        priceView === "monthly" ? "monthly_price" : "annual_price";

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) reset();
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                        FitFlow Admin
                    </p>
                    <DialogTitle>Edit membership plan</DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="plan-name">Plan name</Label>
                        <Input
                            id="plan-name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="plan-price">
                                Price (e.g. ₱1,999)
                            </Label>
                            <Select
                                value={priceView}
                                onValueChange={(value) =>
                                    setPriceView(value as PriceView)
                                }
                            >
                                <SelectTrigger className="h-7 w-[130px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">
                                        Monthly price
                                    </SelectItem>
                                    <SelectItem value="annual">
                                        Annual price
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                ₱
                            </span>
                            <Input
                                id="plan-price"
                                className="pl-7"
                                inputMode="numeric"
                                placeholder={
                                    priceView === "annual"
                                        ? "No annual price set"
                                        : undefined
                                }
                                value={data[priceField]}
                                onChange={(e) =>
                                    setData(
                                        priceField,
                                        e.target.value.replace(/[^\d]/g, ""),
                                    )
                                }
                            />
                        </div>
                        {errors.monthly_price && (
                            <p className="text-sm text-destructive">
                                {errors.monthly_price}
                            </p>
                        )}
                        {errors.annual_price && (
                            <p className="text-sm text-destructive">
                                {errors.annual_price}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="plan-description">Description</Label>
                        <Textarea
                            id="plan-description"
                            rows={3}
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Plan benefits</Label>
                            <button
                                type="button"
                                onClick={() =>
                                    setData("features", [...data.features, ""])
                                }
                                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                                <Plus className="size-3.5" />
                                Add benefit
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            {data.features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2"
                                >
                                    <Check className="size-3.5 shrink-0 text-emerald-500" />
                                    <input
                                        value={feature}
                                        onChange={(e) =>
                                            updateFeature(index, e.target.value)
                                        }
                                        placeholder="Describe this benefit"
                                        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(index)}
                                        className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                                        aria-label="Remove benefit"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            ))}
                            {data.features.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No benefits yet — add one above.
                                </p>
                            )}
                        </div>
                        {errors.features && (
                            <p className="text-sm text-destructive">
                                {errors.features}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="gap-1.5"
                        >
                            <Check className="size-4" />
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
