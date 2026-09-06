import { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ROLES = ["Manager", "Gym Staff", "Receptionist"];

export function AddStaffDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        role: "",
        phone: "",
    });

    function handleSubmit() {
        post("/staffs", {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    function handleOpenChange(next: boolean) {
        if (!next) reset();
        onOpenChange(next);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">
                        FITFLOW ADMIN
                    </p>
                    <DialogTitle>Add staff member</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            placeholder="Enter full name"
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
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
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
                        <Label>Role</Label>
                        <Select
                            value={data.role}
                            onValueChange={(value) => setData("role", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-xs text-red-500">
                                {errors.role}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone number</Label>
                        <Input
                            id="phone"
                            placeholder="Enter phone number"
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-500">
                                {errors.phone}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={processing}>
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}