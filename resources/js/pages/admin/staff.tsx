import { Head } from "@inertiajs/react";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    avatar: string | null;
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

// ---------------------------------------------------------------------------
// Status badge — one shared source of truth so the desktop table row and the
// mobile card render an identical pill instead of two slightly different
// implementations drifting apart over time.
// ---------------------------------------------------------------------------

function StatusBadge({ active }: { active: boolean }) {
    return (
        <Badge
            variant="outline"
            className={
                active
                    ? "border-emerald-500/20 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted text-[11px] text-muted-foreground"
            }
        >
            {active ? "Active" : "Inactive"}
        </Badge>
    );
}

// Shared avatar for staff members. AvatarImage (Radix) already falls back to
// AvatarFallback automatically when the src is missing or fails to load, so
// no manual onError state is needed here. referrerPolicy="no-referrer"
// keeps Google-account photo URLs (lh3.googleusercontent.com) from failing
// to load due to cross-origin Referer headers.
function StaffAvatar({
    member,
    className,
}: {
    member: StaffMember;
    className: string;
}) {
    return (
        <Avatar className={className}>
            {member.avatar && (
                <AvatarImage
                    src={member.avatar}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                />
            )}
            <AvatarFallback className="bg-orange-500/15 text-xs font-semibold text-orange-600 dark:text-orange-300">
                {initials(member.name)}
            </AvatarFallback>
        </Avatar>
    );
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
            {/* Removed the outer overflow-x-auto — it was fighting with the
                table's own horizontal scroll container below and could clip
                content oddly on narrow screens. */}
            <div className="flex h-full flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-600 sm:text-xs dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Live workspace
                        </div>
                        <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                            Staff Management
                        </h1>
                        <p className="text-[13px] text-muted-foreground sm:text-sm">
                            Control access, roles, and day-to-day operations.
                        </p>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="w-full sm:w-auto"
                    >
                        + Add staff
                    </Button>
                </div>

                {/* Single bordered panel: header, content and footer all live
                    inside one flush border/background with no internal
                    margin gaps between sections — each section is separated
                    by a border-t divider instead of whitespace, which is
                    what reads as "template-y" when the spacing is uneven. */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card sm:rounded-xl">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-semibold text-foreground sm:text-sm">
                                    Team members
                                </span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                    {staff.length}
                                </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
                                Manage staff and access levels
                            </p>
                        </div>
                    </div>

                    {/* Desktop / tablet: real table. */}
                    <div className="hidden overflow-x-auto sm:block">
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
                                                <StaffAvatar
                                                    member={member}
                                                    className="h-8 w-8"
                                                />
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
                                            <StatusBadge
                                                active={member.is_active}
                                            />
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
                                {staff.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-10 text-center text-sm text-muted-foreground"
                                        >
                                            No staff members yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile: stacked cards instead of a squeezed,
                        horizontally-scrolled table — this is the single
                        biggest thing that made the old layout feel like a
                        cheap template on a phone. */}
                    <ul className="divide-y divide-border sm:hidden">
                        {staff.length === 0 && (
                            <li className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                                No staff members yet.
                            </li>
                        )}
                        {staff.map((member) => (
                            <li key={member.id} className="px-4 py-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <StaffAvatar
                                            member={member}
                                            className="h-9 w-9 shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-medium text-foreground">
                                                {member.name}
                                            </p>
                                            <p className="truncate text-[11px] text-muted-foreground">
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge active={member.is_active} />
                                </div>

                                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground">
                                        {member.role} · {member.last_active}
                                    </span>
                                    <button
                                        onClick={() => toggleStatus(member)}
                                        className={cn_join(
                                            "font-medium",
                                            member.is_active
                                                ? "text-red-500"
                                                : "text-emerald-500",
                                        )}
                                    >
                                        {member.is_active
                                            ? "Deactivate"
                                            : "Activate"}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-[11px] text-muted-foreground sm:px-5 sm:text-xs">
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

// Tiny local helper so this file doesn't need an extra import just for one
// conditional class join in the mobile card list.
function cn_join(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

Staff.layout = {
    breadcrumbs: [{ title: "Staff", href: dashboard() }],
};
