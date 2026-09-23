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

            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-3 sm:gap-5 sm:p-4 lg:p-6">
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-orange-500 uppercase sm:text-[11px]">
                        Profile &amp; settings
                    </p>
                    <h1 className="text-foreground mt-1 text-lg font-semibold sm:text-xl">
                        Make it yours
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-[12px]">
                        Your details, preferences, and account security.
                    </p>
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-[13px] font-bold text-white sm:size-14 sm:text-base">
                                {initials(user.name)}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-foreground truncate text-[15px] font-semibold sm:text-lg">
                                    {user.name}
                                </h2>
                                <p className="text-muted-foreground truncate text-[11px] sm:text-[12px]">
                                    {user.email}
                                </p>
                                {hasSubscription && (
                                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-500 sm:text-[11px]">
                                        <span className="size-1.5 rounded-full bg-current" />
                                        {planName} member
                                    </span>
                                )}
                            </div>
                        </div>

                        <button className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-md p-1.5">
                            <MoreHorizontal className="size-4 sm:size-5" />
                        </button>
                    </div>

                    <div className="border-sidebar-border/70 dark:border-sidebar-border my-4 border-t sm:my-5" />

                    <div className="grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-3 sm:gap-4 sm:text-[13px]">
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                Full name
                            </p>
                            <p className="text-foreground truncate font-medium">
                                {user.name}
                            </p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                Email address
                            </p>
                            <p className="text-foreground truncate font-medium">
                                {user.email}
                            </p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                Phone number
                            </p>
                            <p className="text-foreground truncate font-medium">
                                {user.phone ?? "—"}
                            </p>
                        </div>
                    </div>

                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <Button
                            variant="secondary"
                            className="mt-5 w-full text-[13px] sm:mt-6"
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

                <DeleteUser />
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
