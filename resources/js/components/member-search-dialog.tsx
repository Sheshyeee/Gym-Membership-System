import { useEffect, useRef, useState } from "react";
import { Search, User as UserIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type MemberResult = {
    id: number;
    code: string;
    name: string;
    email: string;
    plan: string | null;
};

export function MemberSearchDialog({
    open,
    onOpenChange,
    onSelectMember,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectMember: (id: number) => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<MemberResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim() === "") {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/search/members?q=${encodeURIComponent(query)}`,
                    { headers: { Accept: "application/json" } },
                );
                const data = await res.json();
                setResults(data.results ?? []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    function selectMember(member: MemberResult) {
        onOpenChange(false);
        onSelectMember(member.id);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md gap-0 p-0">
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle className="text-sm font-semibold">
                        Search members
                    </DialogTitle>
                </DialogHeader>

                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, email, or member ID..."
                            className="pl-8"
                        />
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto border-t border-border">
                    {loading && (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                            Searching...
                        </p>
                    )}

                    {!loading &&
                        query.trim() !== "" &&
                        results.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                                No members found.
                            </p>
                        )}

                    {!loading &&
                        results.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => selectMember(m)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {m.name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {m.code} · {m.email}
                                    </p>
                                </div>
                                {m.plan && (
                                    <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                        {m.plan}
                                    </span>
                                )}
                            </button>
                        ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
