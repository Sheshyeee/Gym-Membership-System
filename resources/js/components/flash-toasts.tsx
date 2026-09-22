import { router } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";

type FlashProps = {
    success?: string | null;
    error?: string | null;
};

export function FlashToasts() {
    useEffect(() => {
        return router.on("success", (event) => {
            const flash = (event.detail.page.props as { flash?: FlashProps })
                .flash;
            if (!flash) return;

            if (flash.success)
                toast.success(flash.success, { id: crypto.randomUUID() });
            if (flash.error)
                toast.error(flash.error, { id: crypto.randomUUID() });
        });
    }, []);

    return null;
}
