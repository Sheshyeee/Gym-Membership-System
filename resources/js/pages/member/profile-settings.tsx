import { Form, Head } from "@inertiajs/react";
import { useState } from "react";
import ProfileController from "@/actions/App/Http/Controllers/Settings/ProfileController";
import DeleteUser from "@/components/delete-user";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";
import { dashboard } from "@/routes";

type User = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
};

function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export default function ProfileSettings({
    user,
    hasSubscription,
    planName,
}: {
    user: User;
    hasSubscription: boolean;
    planName: string | null;
}) {
    const [editOpen, setEditOpen] = useState(false);

    return (
        <>
            <Head title="Profile settings" />

            <div className="mx-auto max-w-3xl space-y-1 p-6">
                <p className="text-xs font-medium tracking-wide text-orange-400 uppercase">
                    Profile &amp; Settings
                </p>
                <h1 className="text-3xl font-bold text-white">Make it yours</h1>
                <p className="text-sm text-neutral-400">
                    Your details, preferences, and account security.
                </p>

                <div className="mt-6 rounded-2xl border border-orange-900/40 bg-gradient-to-br from-orange-950/40 to-neutral-900 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-700 text-lg font-bold text-white">
                                {initials(user.name)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-orange-400">
                                    {user.name}
                                </h2>
                                <p className="text-sm text-neutral-400">
                                    {user.email}
                                </p>
                                {hasSubscription && (
                                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        {planName} member
                                    </span>
                                )}
                            </div>
                        </div>

                        <button className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="my-6 border-t border-neutral-800" />

                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="text-neutral-500">Full name</p>
                            <p className="font-medium text-orange-300">
                                {user.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-neutral-500">Email address</p>
                            <p className="font-medium text-orange-300">
                                {user.email}
                            </p>
                        </div>
                        <div>
                            <p className="text-neutral-500">Phone number</p>
                            <p className="font-medium text-orange-300">
                                {user.phone ?? "—"}
                            </p>
                        </div>
                    </div>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <Button
                            className="mt-6 w-full bg-neutral-800 py-6 text-white hover:bg-neutral-700"
                            onClick={() => setEditOpen(true)}
                        >
                            Edit personal information
                        </Button>

                        <DialogContent>
                            <DialogTitle>Edit personal information</DialogTitle>

                            <Form
                                {...ProfileController.update.form()}
                                options={{ preserveScroll: true }}
                                onSuccess={() => setEditOpen(false)}
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">
                                                Full name
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                defaultValue={user.name}
                                                autoComplete="name"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">
                                                Email address
                                            </Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                defaultValue={user.email}
                                                autoComplete="email"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">
                                                Phone number
                                            </Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                defaultValue={user.phone ?? ""}
                                                autoComplete="tel"
                                            />
                                            <InputError
                                                message={errors.phone}
                                            />
                                        </div>

                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button variant="secondary">
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Save changes
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="mt-8">
                    <DeleteUser />
                </div>
            </div>
        </>
    );
}

ProfileSettings.layout = {
    breadcrumbs: [
        {
            title: "Profile settings",
            href: dashboard(),
        },
    ],
};
