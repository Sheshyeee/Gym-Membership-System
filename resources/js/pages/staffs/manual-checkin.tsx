import { Head } from "@inertiajs/react";
import {
    Check,
    Search,
    ShieldCheck,
    XCircle,
    AlertTriangle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dashboard } from "@/routes";
import { cn } from "@/lib/utils";

type MemberStatus = "active" | "expiring_soon" | "expired";

interface SearchResult {
    id: number;
    code: string;
    name: string;
    email: string;
    avatar: string | null;
    plan: string | null;
    status: MemberStatus;
    is_active: boolean;
}

interface RecentCheckIn {
    id: number;
    user_id: number;
    name: string;
    avatar: string | null;
    time: string;
}

interface CheckinOutcome {
    result: "success" | "denied" | "duplicate";
    message: string;
}

const statusLabels: Record<MemberStatus, string> = {
    active: "Active",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
};

const statusStyles: Record<MemberStatus, string> = {
    active: "text-emerald-500",
    expiring_soon: "text-amber-500",
    expired: "text-red-500",
};

const avatarColors = [
    "bg-orange-500/15 text-orange-500",
    "bg-emerald-500/15 text-emerald-500",
    "bg-blue-500/15 text-blue-500",
    "bg-red-500/15 text-red-500",
    "bg-purple-500/15 text-purple-500",
];

function colorFor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

function initials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

// Renders a real avatar photo when one is available (e.g. a Google account
// picture), falling back to the colored-initials circle used everywhere else
// in this file. referrerPolicy="no-referrer" keeps Google's avatar URLs
// (lh3.googleusercontent.com) from failing to load due to cross-origin
// Referer headers. Each call site keeps its own `broken` state since the
// same component is reused across a list.
function PersonAvatar({
    name,
    avatar,
    className,
}: {
    name: string;
    avatar: string | null;
    className: string;
}) {
    const [broken, setBroken] = useState(false);

    if (avatar && !broken) {
        return (
            <img
                src={avatar}
                alt={name}
                referrerPolicy="no-referrer"
                onError={() => setBroken(true)}
                className={cn("shrink-0 rounded-full object-cover", className)}
            />
        );
    }

    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full font-semibold",
                colorFor(name),
                className,
            )}
        >
            {initials(name)}
        </div>
    );
}

function csrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? ""
    );
}

function Panel({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-3 sm:p-4",
                className,
            )}
        >
            {children}
        </div>
    );
}

export default function ManualCheckIn({
    recentCheckIns: initialRecent,
}: {
    recentCheckIns: RecentCheckIn[];
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [checkingInId, setCheckingInId] = useState<number | null>(null);
    const [outcomes, setOutcomes] = useState<Record<number, CheckinOutcome>>(
        {},
    );
    const [recentCheckIns, setRecentCheckIns] = useState(initialRecent);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    function handleQueryChange(value: string) {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.trim() === "") {
            setResults([]);
            setHasSearched(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `/staff/manual-checkin/search?q=${encodeURIComponent(value)}`,
                    { headers: { Accept: "application/json" } },
                );
                const json = await res.json();
                setResults(json.results ?? []);
            } finally {
                setSearching(false);
                setHasSearched(true);
            }
        }, 300);
    }

    async function handleCheckIn(member: SearchResult) {
        if (checkingInId) return;
        setCheckingInId(member.id);

        try {
            const res = await fetch(
                `/staff/manual-checkin/${member.id}/checkin`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRF-TOKEN": csrfToken(),
                    },
                },
            );
            const json = await res.json();

            setOutcomes((prev) => ({ ...prev, [member.id]: json.checkin }));
            if (json.recentCheckIns) setRecentCheckIns(json.recentCheckIns);

            setTimeout(() => {
                setOutcomes((prev) => {
                    const next = { ...prev };
                    delete next[member.id];
                    return next;
                });
            }, 4000);
        } catch {
            setOutcomes((prev) => ({
                ...prev,
                [member.id]: {
                    result: "denied",
                    message: "Network error — try again.",
                },
            }));
        } finally {
            setCheckingInId(null);
        }
    }

    return (
        <>
            <Head title="Manual check-in" />
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 p-3 sm:gap-5 sm:p-4 lg:p-6">
                <div>
                    <p className="mb-1 text-[10px] font-semibold tracking-widest text-orange-500 uppercase sm:text-[11px]">
                        Front desk operations
                    </p>
                    <h1 className="text-foreground text-lg font-semibold sm:text-xl">
                        Manual check-in
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-[11px] sm:text-[12px]">
                        Find a member and verify their membership before entry.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
                    <Panel>
                        <div className="relative mb-3">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) =>
                                    handleQueryChange(e.target.value)
                                }
                                placeholder="Search by name or member ID..."
                                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary/50 h-9 w-full rounded-lg border pr-14 pl-9 text-[12px] focus:outline-none sm:h-10 sm:text-[13px]"
                            />
                            <span className="text-muted-foreground border-sidebar-border/70 dark:border-sidebar-border bg-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[9px]">
                                ⌘K
                            </span>
                        </div>

                        <div className="min-h-[320px] sm:min-h-[380px]">
                            {!hasSearched && !searching && (
                                <div className="flex h-[320px] flex-col items-center justify-center text-center sm:h-[380px]">
                                    <Search className="text-muted-foreground/40 mb-3 size-7 sm:size-8" />
                                    <p className="text-foreground text-[13px] font-semibold sm:text-[14px]">
                                        Find a member to check in
                                    </p>
                                    <p className="text-muted-foreground mt-1 text-[11px] sm:text-[12px]">
                                        Search by their name or member ID to get
                                        started.
                                    </p>
                                </div>
                            )}

                            {searching && (
                                <p className="text-muted-foreground mt-6 text-center text-[12px]">
                                    Searching...
                                </p>
                            )}

                            {!searching &&
                                hasSearched &&
                                results.length === 0 && (
                                    <p className="text-muted-foreground mt-6 text-center text-[12px]">
                                        No members found for &quot;{query}
                                        &quot;.
                                    </p>
                                )}

                            {!searching && results.length > 0 && (
                                <div className="space-y-2">
                                    {results.map((member) => {
                                        const outcome = outcomes[member.id];
                                        return (
                                            <div
                                                key={member.id}
                                                className="border-sidebar-border/70 dark:border-sidebar-border bg-background flex flex-col gap-2.5 rounded-lg border p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                                            >
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <PersonAvatar
                                                        name={member.name}
                                                        avatar={member.avatar}
                                                        className="size-8 text-[11px] sm:size-9 sm:text-[12px]"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-foreground truncate text-[12px] font-medium sm:text-[13px]">
                                                            {member.name}
                                                        </p>
                                                        <p className="text-muted-foreground truncate text-[10px] sm:text-[11px]">
                                                            {member.code}
                                                            {member.plan &&
                                                                ` · ${member.plan}`}
                                                            {" · "}
                                                            <span
                                                                className={
                                                                    statusStyles[
                                                                        member
                                                                            .status
                                                                    ]
                                                                }
                                                            >
                                                                {
                                                                    statusLabels[
                                                                        member
                                                                            .status
                                                                    ]
                                                                }
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end">
                                                    <button
                                                        onClick={() =>
                                                            handleCheckIn(
                                                                member,
                                                            )
                                                        }
                                                        disabled={
                                                            checkingInId ===
                                                            member.id
                                                        }
                                                        className="bg-primary text-primary-foreground flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {checkingInId ===
                                                        member.id ? (
                                                            "Checking in..."
                                                        ) : (
                                                            <>
                                                                <Check className="size-3.5" />
                                                                Check in
                                                            </>
                                                        )}
                                                    </button>
                                                    {outcome && (
                                                        <span
                                                            className={cn(
                                                                "flex items-center gap-1 text-[10px] sm:text-[11px]",
                                                                outcome.result ===
                                                                    "success"
                                                                    ? "text-emerald-500"
                                                                    : outcome.result ===
                                                                        "duplicate"
                                                                      ? "text-amber-500"
                                                                      : "text-red-500",
                                                            )}
                                                        >
                                                            {outcome.result ===
                                                                "success" && (
                                                                <ShieldCheck className="size-3" />
                                                            )}
                                                            {outcome.result ===
                                                                "duplicate" && (
                                                                <AlertTriangle className="size-3" />
                                                            )}
                                                            {outcome.result ===
                                                                "denied" && (
                                                                <XCircle className="size-3" />
                                                            )}
                                                            {outcome.message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Panel>

                    <Panel>
                        <p className="text-foreground text-[13px] font-semibold sm:text-[14px]">
                            Recent check-ins
                        </p>
                        <p className="text-muted-foreground mb-3 text-[10px] sm:text-[11px]">
                            Today
                        </p>

                        {recentCheckIns.length === 0 ? (
                            <p className="text-muted-foreground text-[12px]">
                                No check-ins yet today.
                            </p>
                        ) : (
                            <div className="space-y-0.5">
                                {recentCheckIns.map((c) => (
                                    <div
                                        key={c.id}
                                        className="hover:bg-accent flex items-center justify-between rounded-md px-1 py-1.5 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <PersonAvatar
                                                name={c.name}
                                                avatar={c.avatar}
                                                className="size-7 text-[10px] sm:size-8"
                                            />
                                            <div>
                                                <p className="text-foreground text-[12px] font-medium sm:text-[13px]">
                                                    {c.name}
                                                </p>
                                                <p className="text-muted-foreground text-[10px] sm:text-[11px]">
                                                    {c.time}
                                                </p>
                                            </div>
                                        </div>
                                        <ShieldCheck className="size-4 text-emerald-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </>
    );
}

ManualCheckIn.layout = {
    breadcrumbs: [{ title: "Manual check-in", href: dashboard() }],
};
