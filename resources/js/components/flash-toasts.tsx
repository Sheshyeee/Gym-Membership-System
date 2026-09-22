import { usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";

type FlashProps = {
    flash?: { success?: string | null; error?: string | null };
};

export function FlashToasts() {
    const { flash } = usePage<FlashProps>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash]);

    return null;
}
