import { Head, router, useForm } from "@inertiajs/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dashboard } from "@/routes";

interface GymProfileData {
    name: string;
    phone: string | null;
    address: string | null;
    about: string | null;
    cover_url: string | null;
}

interface SettingsProps {
    gymProfile: GymProfileData;
    adminEmail: string;
}

export default function Settings({ gymProfile, adminEmail }: SettingsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(gymProfile.cover_url);

    const { data, setData, post, processing, errors, recentlySuccessful } =
        useForm({
            name: gymProfile.name ?? "",
            email: adminEmail ?? "",
            phone: gymProfile.phone ?? "",
            address: gymProfile.address ?? "",
            about: gymProfile.about ?? "",
            cover: null as File | null,
        });

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setData("cover", file);
        setPreview(URL.createObjectURL(file));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post("/admin/settings", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                router.flushAll();
            },
        });
    }

    return (
        <>
            <Head title="Gym Profile" />
            {/* max-w-3xl: on a wide desktop monitor a form stretched edge to
                edge with 2–3 huge input columns looks unfinished. Bounding
                it and centering (mx-auto) reads as an intentional, focused
                settings form instead. */}
            <form
                onSubmit={handleSubmit}
                className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 p-2.5 sm:gap-6 sm:p-6"
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground sm:text-2xl">
                            Gym Profile
                        </h1>
                        <p className="text-[12px] text-muted-foreground sm:text-sm">
                            Update how your gym appears across FitFlow.
                        </p>
                    </div>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full sm:w-auto"
                    >
                        {processing ? "Saving..." : "Save changes"}
                    </Button>
                </div>

                {recentlySuccessful && (
                    <p className="text-[12px] text-emerald-500 sm:text-sm">
                        Saved.
                    </p>
                )}

                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:p-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-orange-500/15 sm:h-16 sm:w-16">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Gym cover"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-[10px] text-muted-foreground sm:text-xs">
                                No logo
                            </span>
                        )}
                    </div>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverChange}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto"
                        >
                            Change cover
                        </Button>
                        {errors.cover && (
                            <p className="mt-1 text-[10px] text-red-500 sm:text-xs">
                                {errors.cover}
                            </p>
                        )}
                    </div>
                </div>

                {/* Name + email, then phone + address — two even 2-up rows
                    instead of the old 3-item grid, which left phone alone
                    on its own row with an empty cell beside it on desktop. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="name"
                            className="text-[12px] sm:text-sm"
                        >
                            Gym name
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-[10px] text-red-500 sm:text-xs">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="email"
                            className="text-[12px] sm:text-sm"
                        >
                            Contact email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        {errors.email && (
                            <p className="text-[10px] text-red-500 sm:text-xs">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="phone"
                            className="text-[12px] sm:text-sm"
                        >
                            Phone number
                        </Label>
                        <Input
                            id="phone"
                            value={data.phone ?? ""}
                            onChange={(e) => setData("phone", e.target.value)}
                        />
                        {errors.phone && (
                            <p className="text-[10px] text-red-500 sm:text-xs">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <Label
                            htmlFor="address"
                            className="text-[12px] sm:text-sm"
                        >
                            Address
                        </Label>
                        <Input
                            id="address"
                            value={data.address ?? ""}
                            onChange={(e) => setData("address", e.target.value)}
                        />
                        {errors.address && (
                            <p className="text-[10px] text-red-500 sm:text-xs">
                                {errors.address}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="about" className="text-[12px] sm:text-sm">
                        About your gym
                    </Label>
                    <Textarea
                        id="about"
                        rows={4}
                        value={data.about ?? ""}
                        onChange={(e) => setData("about", e.target.value)}
                    />
                    {errors.about && (
                        <p className="text-[10px] text-red-500 sm:text-xs">
                            {errors.about}
                        </p>
                    )}
                </div>
            </form>
        </>
    );
}

Settings.layout = {
    breadcrumbs: [{ title: "Staff", href: dashboard() }],
};
