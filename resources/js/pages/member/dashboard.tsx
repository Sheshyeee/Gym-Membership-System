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
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {!hasSubscription && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-center justify-between">
                        <p className="text-sm text-amber-300">
                            You're browsing with limited access. Pick a plan to
                            unlock full features.
                        </p>
                        <Link
                            href="/onboarding"
                            className="text-sm font-semibold bg-amber-500 text-black px-4 py-1.5 rounded-full whitespace-nowrap"
                        >
                            Choose a plan
                        </Link>
                    </div>
                )}
                {/* rest of your existing dashboard grid unchanged */}
            </div>
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
