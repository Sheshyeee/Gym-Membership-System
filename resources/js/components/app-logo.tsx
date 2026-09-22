import { usePage } from "@inertiajs/react";

import AppLogoIcon from "@/components/app-logo-icon";

interface GymProfileProp {
    name?: string;
    cover_url?: string | null;
}

export default function AppLogo() {
    const { name, gymProfile } = usePage().props as {
        name: string;
        gymProfile?: GymProfileProp;
    };

    const coverUrl = gymProfile?.cover_url;

    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={gymProfile?.name ?? name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {gymProfile?.name || name}
                </span>
            </div>
        </>
    );
}
