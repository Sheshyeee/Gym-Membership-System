import { router } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

type FlashProps = {
    success?: string | null;
    error?: string | null;
};

export function FlashToasts() {
    const lastSeen = useRef<string | null>(null);

    useEffect(() => {
        return router.on("success", (event) => {
            const flash = (event.detail.page.props as { flash?: FlashProps })
                .flash;
            if (!flash) return;

            const key = JSON.stringify(flash);
            if (key === lastSeen.current) return;
            lastSeen.current = key;

            if (flash.success)
                toast.success(flash.success, { id: crypto.randomUUID() });
            if (flash.error)
                toast.error(flash.error, { id: crypto.randomUUID() });
        });
    }, []);

    return null;
}
