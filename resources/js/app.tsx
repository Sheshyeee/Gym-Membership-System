import { createInertiaApp } from "@inertiajs/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeTheme } from "@/hooks/use-appearance";
import AppLayout from "@/layouts/app-layout";
import AuthLayout from "@/layouts/auth-layout";
import SettingsLayout from "@/layouts/settings/layout";
import "@/echo";
import { OrbitIcon } from "lucide-react";
import { FlashToasts } from "./components/flash-toasts";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === "welcome":
                OrbitIcon;
                return null;
            case name.startsWith("onboarding/"):
                return null;
            case name.startsWith("auth/"):
                return AuthLayout;
            case name.startsWith("settings/"):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <FlashToasts />
                <Toaster
                    position="top-center"
                    toastOptions={{
                        classNames: {
                            toast: "bg-zinc-900 text-white border border-zinc-700 shadow-lg",
                            success:
                                "!bg-green-950 !text-green-200 !border-green-800",
                            error: "!bg-red-950 !text-red-200 !border-red-800",
                            title: "font-semibold",
                            description: "text-zinc-300",
                        },
                    }}
                />
            </TooltipProvider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});

// This will set light / dark mode on load...
initializeTheme();
