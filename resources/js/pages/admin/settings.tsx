import { Head, useForm } from "@inertiajs/react";
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
        });
    }

    return (
        <>
            <Head title="Gym Profile" />
            <form
                onSubmit={handleSubmit}
                className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Gym Profile
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Update how your gym appears across FitFlow.
                        </p>
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing ? "Saving..." : "Save changes"}
                    </Button>
                </div>

                {recentlySuccessful && (
                    <p className="text-sm text-emerald-500">Saved.</p>
                )}

                <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-card p-6">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-orange-500/15">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Gym cover"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xs text-muted-foreground">
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
                        >
                            Change cover
                        </Button>
                        {errors.cover && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.cover}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Gym name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Contact email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone number</Label>
                        <Input
                            id="phone"
                            value={data.phone ?? ""}
                            onChange={(e) => setData("phone", e.target.value)}
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-500">
                                {errors.phone}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                        id="address"
                        value={data.address ?? ""}
                        onChange={(e) => setData("address", e.target.value)}
                    />
                    {errors.address && (
                        <p className="text-xs text-red-500">{errors.address}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="about">About your gym</Label>
                    <Textarea
                        id="about"
                        rows={4}
                        value={data.about ?? ""}
                        onChange={(e) => setData("about", e.target.value)}
                    />
                    {errors.about && (
                        <p className="text-xs text-red-500">{errors.about}</p>
                    )}
                </div>
            </form>
        </>
    );
}

Settings.layout = {
    breadcrumbs: [{ title: "Staff", href: dashboard() }],
};
