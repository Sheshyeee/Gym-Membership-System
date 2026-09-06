import { Head, Link } from "@inertiajs/react";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import { dashboard } from "@/routes";

export default function Dashboard({
    hasSubscription,
}: {
    hasSubscription: boolean;
}) {
    return (
        <>
            <Head title="Dashboard" />
            </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
    ],
};
