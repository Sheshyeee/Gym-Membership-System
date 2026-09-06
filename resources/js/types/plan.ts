export type PlanColor = "blue" | "orange" | "green";

export interface Plan {
    id: number;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    /** Both prices are in centavos (₱1 = 100). */
    monthly_price: number;
    annual_price: number | null;
    features: string[];
    highlighted: boolean;
    is_active: boolean;
    color: PlanColor | null;
    active_members_count: number;
}
