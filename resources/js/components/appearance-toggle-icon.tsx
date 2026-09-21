// resources/js/components/appearance-toggle-icon.tsx
import { Monitor, Moon, Sun } from "lucide-react";
import { useAppearance } from "@/hooks/use-appearance";

const cycle = {
    light: "dark",
    dark: "system",
    system: "light",
} as const;

const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
};

export default function AppearanceToggleIcon() {
    const { appearance, updateAppearance } = useAppearance();
    const Icon = icons[appearance];

    return (
        <button
            type="button"
            onClick={() => updateAppearance(cycle[appearance])}
            aria-label={`Switch appearance (currently ${appearance})`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}
