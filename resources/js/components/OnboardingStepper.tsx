type StepStatus = "done" | "current" | "upcoming";
type Step = { label: string; status: StepStatus };

export function OnboardingStepper({ current }: { current: number }) {
    // "Welcome" step removed — the flow now starts at plan selection.
    const steps = ["Plan", "Payment", "Done"];

    return (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-10">
            {steps.map((label, i) => {
                const stepNum = i + 1;
                const status: Step["status"] =
                    stepNum < current
                        ? "done"
                        : stepNum === current
                          ? "current"
                          : "upcoming";

                return (
                    <div key={label} className="flex items-center">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div
                                className={[
                                    "flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-sm font-semibold transition-colors",
                                    status === "done" &&
                                        "bg-emerald-500 text-white",
                                    status === "current" &&
                                        "bg-primary text-primary-foreground",
                                    status === "upcoming" &&
                                        "border border-border text-muted-foreground",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                            >
                                {status === "done" ? "✓" : stepNum}
                            </div>
                            <span
                                className={[
                                    "text-[11px] sm:text-sm font-medium",
                                    status === "upcoming"
                                        ? "text-muted-foreground"
                                        : "text-foreground",
                                    // Keep phones compact: only the active label shows text,
                                    // the rest are just numbered dots.
                                    status === "current"
                                        ? "inline"
                                        : "hidden sm:inline",
                                ].join(" ")}
                            >
                                {label}
                            </span>
                        </div>
                        {stepNum < steps.length && (
                            <div className="w-6 sm:w-16 h-px bg-border mx-2 sm:mx-3" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
