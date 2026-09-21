import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type RevenueMixEntry = {
    name: string;
    value: number; // net revenue, minor-unit integer
    color: string;
};

function formatCurrency(minorUnits: number) {
    const value = minorUnits / 100;
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}k`;
    return `₱${value.toFixed(0)}`;
}

export function RevenueMixChart({ data }: { data: RevenueMixEntry[] }) {
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const hasRevenue = total > 0;

    return (
        <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">
                    Membership revenue mix
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                    Build loyalty that{" "}
                    <span className="text-orange-500">keeps growing.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {hasRevenue
                        ? "Net revenue collected this month, by plan."
                        : "No revenue recorded yet this month."}
                </p>
            </div>

            {hasRevenue ? (
                <div className="flex items-center gap-6">
                    <div className="relative size-40 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    paddingAngle={3}
                                    stroke="none"
                                >
                                    {data.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-semibold text-foreground">
                                {formatCurrency(total)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                                this month
                            </span>
                        </div>
                    </div>

                    <ul className="flex flex-col gap-2">
                        {data.map((entry) => (
                            <li
                                key={entry.name}
                                className="flex items-center gap-2 text-sm"
                            >
                                <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-foreground">
                                    {entry.name}
                                </span>
                                <span className="text-muted-foreground">
                                    {((entry.value / total) * 100).toFixed(0)}%
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Revenue will appear here once invoices are paid this month.
                </p>
            )}
        </div>
    );
}
