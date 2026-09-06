import { Head } from "@inertiajs/react";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AddStaffDialog } from "@/components/add-staff-dialog";
import { dashboard } from "@/routes";

interface StaffMember {
    id: number;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    is_active: boolean;
    last_active: string;
}

function initials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export default function Staff({ staff }: { staff: StaffMember[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);

    const activeCount = staff.filter((s) => s.is_active).length;
    const inactiveCount = staff.length - activeCount;

    function toggleStatus(member: StaffMember) {
        const url = member.is_active
            ? `/staffs/${member.id}/deactivate`
            : `/staffs/${member.id}/activate`;

        router.patch(url, {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Staff Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Live workspace
                        </div>
                        <h1 className="mt-1 text-2xl font-semibold text-foreground">
                            Staff Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Control access, roles, and day-to-day operations.
                        </p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)}>
                        + Add staff
                    </Button>
                </div>

                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between px-4 pt-4">
                        <div>
                            <span className="text-sm font-semibold text-foreground">
                                Team members
                            </span>
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {staff.length}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                Manage staff and access levels
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last active</TableHead>
                                    <TableHead className="text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staff.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-orange-500/15 text-xs font-semibold text-orange-600 dark:text-orange-300">
                                                        {initials(member.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-foreground/80">
                                            {member.role}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    member.is_active
                                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        : "border-border bg-muted text-muted-foreground"
                                                }
                                            >
                                                {member.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-foreground/80">
                                            {member.last_active}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                onClick={() =>
                                                    toggleStatus(member)
                                                }
                                                className={
                                                    member.is_active
                                                        ? "text-sm text-red-500 hover:underline"
                                                        : "text-sm text-emerald-500 hover:underline"
                                                }
                                            >
                                                {member.is_active
                                                    ? "Deactivate"
                                                    : "Activate"}
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
                        <span>
                            {activeCount} active · {inactiveCount} inactive
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDialogOpen(true)}
                        >
                            + Add staff
                        </Button>
                    </div>
                </div>
            </div>

            <AddStaffDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
    );
}

Staff.layout = {
    breadcrumbs: [{ title: "Staff", href: dashboard() }],
};
