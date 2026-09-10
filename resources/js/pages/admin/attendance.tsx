import { Head, Link } from "@inertiajs/react";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import { dashboard } from "@/routes";

export default function Attendance({
    hasSubscription,
}: {
    hasSubscription: boolean;
}) {
    return (
        <>
            <Head title="Attendance" />
        </>
    );
}

Attendance.layout = {
    breadcrumbs: [
        {
            title: "Attendance",
            href: dashboard(),
        },
    ],
};
