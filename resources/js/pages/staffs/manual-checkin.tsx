import { Head } from "@inertiajs/react";
import { Check, Search, ShieldCheck, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dashboard } from "@/routes";

type MemberStatus = "active" | "expiring_soon" | "expired";

interface SearchResult {
    id: number;
    code: string;
    name: string;
    email: string;
    plan: string | null;
    status: MemberStatus;
    is_active: boolean;
}

interface RecentCheckIn {
    id: number;
    user_id: number;
    name: string;
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
    active: "text-emerald-400",
    expiring_soon: "text-amber-400",
    expired: "text-red-400",
};

const avatarColors = [
    "bg-orange-500/20 text-orange-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-blue-500/20 text-blue-400",
    "bg-red-500/20 text-red-400",
    "bg-purple-500/20 text-purple-400",
];

function colorFor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
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

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "";
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
    const [outcomes, setOutcomes] = useState<Record<number, CheckinOutcome>>({});
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
            const res = await fetch(`/staff/manual-checkin/${member.id}/checkin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken(),
                },
            });
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
                [member.id]: { result: "denied", message: "Network error — try again." },
            }));
        } finally {
            setCheckingInId(null);
        }
    }

    return (
        <>
            <Head title="Manual check-in" />
            <div className="min-h-screen bg-neutral-950 p-6 text-neutral-100 md:p-10">
                <div className="mx-auto max-w-5xl">
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-amber-500/80">
                        Front desk operations
                    </p>
                    <h1 className="mb-1 text-3xl font-semibold text-white">
                        Manual check-in
                    </h1>
                    <p className="mb-8 text-sm text-neutral-400">
                        Find a member and verify their membership before entry.
                    </p>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.3fr_1fr]">
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                            <div className="relative mb-4">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => handleQueryChange(e.target.value)}
                                    placeholder="Search by name or member ID..."
                                    className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-9 pr-14 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500/50 focus:outline-none"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] text-neutral-500">
                                    ⌘K
                                </span>
                            </div>

                            <div className="min-h-[380px]">
                                {!hasSearched && !searching && (
                                    <div className="flex h-[380px] flex-col items-center justify-center text-center">
                                        <Search className="mb-3 h-8 w-8 text-neutral-700" />
                                        <p className="font-semibold text-neutral-200">
                                            Find a member to check in
                                        </p>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            Search by their name or member ID to get started.
                                        </p>
                                    </div>
                                )}

                                {searching && (
                                    <p className="mt-6 text-center text-sm text-neutral-500">
                                        Searching...
                                    </p>
                                )}

                                {!searching && hasSearched && results.length === 0 && (
                                    <p className="mt-6 text-center text-sm text-neutral-500">
                                        No members found for &quot;{query}&quot;.
                                    </p>
                                )}

                                {!searching && results.length > 0 && (
                                    <div className="space-y-2">
                                        {results.map((member) => {
                                            const outcome = outcomes[member.id];
                                            return (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/60 p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${colorFor(member.name)}`}
                                                        >
                                                            {initials(member.name)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-neutral-100">
                                                                {member.name}
                                                            </p>
                                                            <p className="text-xs text-neutral-500">
                                                                {member.code}
                                                                {member.plan && ` · ${member.plan}`}
                                                                {" · "}
                                                                <span className={statusStyles[member.status]}>
                                                                    {statusLabels[member.status]}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1">
                                                        <button
                                                            onClick={() => handleCheckIn(member)}
                                                            disabled={checkingInId === member.id}
                                                            className="flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {checkingInId === member.id ? (
                                                                "Checking in..."
                                                            ) : (
                                                                <>
                                                                    <Check className="h-3.5 w-3.5" />
                                                                    Check in
                                                                </>
                                                            )}
                                                        </button>
                                                        {outcome && (
                                                            <span
                                                                className={`flex items-center gap-1 text-[11px] ${
                                                                    outcome.result === "success"
                                                                        ? "text-emerald-400"
                                                                        : outcome.result === "duplicate"
                                                                          ? "text-amber-400"
                                                                          : "text-red-400"
                                                                }`}
                                                            >
                                                                {outcome.result === "success" && (
                                                                    <ShieldCheck className="h-3 w-3" />
                                                                )}
                                                                {outcome.result === "duplicate" && (
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                )}
                                                                {outcome.result === "denied" && (
                                                                    <XCircle className="h-3 w-3" />
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
                        </div>

                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
                            <p className="mb-1 text-sm font-semibold text-white">
                                Recent check-ins
                            </p>
                            <p className="mb-4 text-xs text-neutral-500">Today</p>

                            {recentCheckIns.length === 0 ? (
                                <p className="text-sm text-neutral-500">
                                    No check-ins yet today.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {recentCheckIns.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center justify-between rounded-lg px-1 py-2"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${colorFor(c.name)}`}
                                                >
                                                    {initials(c.name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-100">
                                                        {c.name}
                                                    </p>
                                                    <p className="text-xs text-neutral-500">{c.time}</p>
                                                </div>
                                            </div>
                                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ManualCheckIn.layout = {
    breadcrumbs: [{ title: "Manual check-in", href: dashboard() }],
};