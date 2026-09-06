import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

// Static placeholder until there's a revenue endpoint to back this.
const REVENUE_MIX = [
    { name: 'Premium', value: 54, color: '#f97316' },
    { name: 'Annual', value: 31, color: '#10b981' },
    { name: 'Basic', value: 15, color: '#3b82f6' },
];

const TOTAL_LABEL = '₱486k';

export function RevenueMixChart() {
    return (
        <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">
                    Membership revenue mix
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                    Build loyalty that <span className="text-orange-500">keeps growing.</span>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Your plans are converting well. Premium accounts for the largest share of
                    recurring revenue this cycle.
                </p>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative size-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={REVENUE_MIX}
                                dataKey="value"
                                nameKey="name"
                                innerRadius="70%"
                                outerRadius="100%"
                                paddingAngle={3}
                                stroke="none"
                            >
                                {REVENUE_MIX.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-semibold text-foreground">{TOTAL_LABEL}</span>
                        <span className="text-[11px] text-muted-foreground">monthly revenue</span>
                    </div>
                </div>

                <ul className="flex flex-col gap-2">
                    {REVENUE_MIX.map((entry) => (
                        <li key={entry.name} className="flex items-center gap-2 text-sm">
                            <span
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-foreground">{entry.name}</span>
                            <span className="text-muted-foreground">{entry.value}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}