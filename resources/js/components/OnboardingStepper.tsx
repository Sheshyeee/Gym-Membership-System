type Step = { label: string; status: "done" | "current" | "upcoming" };

export function OnboardingStepper({ current }: { current: number }) {
    const steps = ["Welcome", "Plan", "Payment", "Done"];

    return (
        <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((label, i) => {
                const stepNum = i + 1;
                const status: Step["status"] =
                    stepNum < current ? "done" : stepNum === current ? "current" : "upcoming";

                return (
                    <div key={label} className="flex items-center">
                        <div className="flex items-center gap-2">
                            <div
                                className={[
                                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                                    status === "done" && "bg-green-600 text-white",
                                    status === "current" && "bg-amber-500 text-black",
                                    status === "upcoming" && "border border-neutral-700 text-neutral-500",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                {status === "done" ? "✓" : stepNum}
                            </div>
                            <span
                                className={
                                    status === "upcoming" ? "text-neutral-500" : "text-neutral-200"
                                }
                            >
                                {label}
                            </span>
                        </div>
                        {stepNum < steps.length && (
                            <div className="w-16 h-px bg-neutral-700 mx-3" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}