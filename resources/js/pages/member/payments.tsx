import { Head, Link } from "@inertiajs/react";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import { dashboard } from "@/routes";

export default function Payments({
    hasSubscription,
}: {
    hasSubscription: boolean;
}) {
    return (
        <>
            <Head title="Payments" />
        </>
    );
}

Payments.layout = {
    breadcrumbs: [
        {
            title: "Payments",
            href: dashboard(),
        },
    ],
};
