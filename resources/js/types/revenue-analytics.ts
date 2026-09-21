export type RevenuePeriod = "week" | "month" | "quarter" | "year";

export type RevenueTrendPoint = {
    label: string;
    current: number;
    previous: number;
};

export type RevenueByPlanEntry = {
    id: number;
    name: string;
    color: string | null;
    revenue: number;
};

export type RevenueAnalyticsStats = {
    totalRevenue: { value: number; changePct: number };
    averageOrderValue: { value: number; changePct: number };
    newMembers: { value: number; changePct: number };
};

export type RevenueAnalyticsProps = {
    period: RevenuePeriod;
    stats: RevenueAnalyticsStats;
    trend: RevenueTrendPoint[];
    revenueByPlan: RevenueByPlanEntry[];
};
