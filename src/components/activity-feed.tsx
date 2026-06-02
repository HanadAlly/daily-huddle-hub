import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { initialsOf, type Profile, type Standup, type StandupWithProfile } from "@/lib/standup-types";

export function ActivityFeed({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<StandupWithProfile[] | null>(null);

  const load = async () => {
    const { data: standups } = await supabase
      .from("standups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    const list = (standups ?? []) as Standup[];
    const userIds = Array.from(new Set(list.map((s) => s.user_id)));
    const profiles = userIds.length
      ? (await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)).data ?? []
      : [];
    const byId = new Map<string, Profile>(profiles.map((p) => [p.id, p as Profile]));
    setItems(list.map((s) => ({ ...s, profile: byId.get(s.user_id) ?? null })));
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("standups-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "standups" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (!items) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">No standups yet. Be the first to post today's update.</p>
      </Card>
    );
  }

  // Group by date
  const groups = new Map<string, StandupWithProfile[]>();
  for (const item of items) {
    const k = item.standup_date;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(item);
  }

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([date, group]) => (
        <section key={date}>
          <div className="flex items-center gap-2 mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Calendar className="size-3.5" />
            {formatDateHeader(date)}
            <span className="text-muted-foreground/60">· {group.length} {group.length === 1 ? "update" : "updates"}</span>
          </div>
          <div className="space-y-3">
            {group.map((s) => (
              <StandupCard key={s.id} item={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function formatDateHeader(iso: string) {
  const d = parseISO(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

function StandupCard({ item }: { item: StandupWithProfile }) {
  const name = item.profile?.display_name ?? "Teammate";
  return (
    <Card className="p-5 shadow-[var(--shadow-soft)] hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        <Avatar className="size-10">
          <AvatarFallback style={{ background: "var(--gradient-brand)", color: "var(--primary-foreground)" }}>
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
            {item.blockers && (
              <Badge variant="outline" className="gap-1 text-warning border-warning/40 bg-warning/10">
                <AlertTriangle className="size-3" /> Blocked
              </Badge>
            )}
          </div>
          <div className="mt-3 grid gap-3 text-sm">
            <Row label="Yesterday" text={item.yesterday} />
            <Row label="Today" text={item.today} accent />
            {item.blockers && <Row label="Blockers" text={item.blockers} warn />}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, text, accent, warn }: { label: string; text: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-3 items-start">
      <span
        className={`text-xs font-medium uppercase tracking-wider pt-0.5 ${
          warn ? "text-warning" : accent ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}
