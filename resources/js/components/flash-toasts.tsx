import { usePage } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

type FlashProps = {
    flash?: { success?: string | null; error?: string | null };
};

export function FlashToasts() {
    const { flash } = usePage<FlashProps>().props;
    const lastSeen = useRef<string | null>(null);

    useEffect(() => {
        const key = JSON.stringify(flash);
        if (key === lastSeen.current) return; // avoid double-fire from double mounts/strict mode
        lastSeen.current = key;

        if (flash?.success)
            toast.success(flash.success, { id: crypto.randomUUID() });
        if (flash?.error) toast.error(flash.error, { id: crypto.randomUUID() });
    }, [flash]);

    return null;
}
