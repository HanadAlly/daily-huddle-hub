import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { Activity, AlertTriangle, Loader2, TrendingUp, Users } from "lucide-react";
import { initialsOf, type Profile, type Standup } from "@/lib/standup-types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Standup" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [standups, setStandups] = useState<Standup[] | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const since = format(subDays(new Date(), 13), "yyyy-MM-dd");
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from("standups").select("*").gte("standup_date", since).order("standup_date"),
        supabase.from("profiles").select("id, display_name, avatar_url"),
      ]);
      setStandups((s ?? []) as Standup[]);
      setProfiles((p ?? []) as Profile[]);
    })();
  }, []);

  const profileById = useMemo(
    () => new Map<string, Profile>(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const chartData = useMemo(() => {
    if (!standups) return [];
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const day = format(subDays(new Date(), i), "yyyy-MM-dd");
      buckets.set(day, 0);
    }
    for (const s of standups) {
      if (buckets.has(s.standup_date)) {
        buckets.set(s.standup_date, (buckets.get(s.standup_date) ?? 0) + 1);
      }
    }
    return Array.from(buckets.entries()).map(([date, count]) => ({
      date,
      label: format(parseISO(date), "EEE d"),
      count,
    }));
  }, [standups]);

  const stats = useMemo(() => {
    if (!standups) return null;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const postedToday = standups.filter((s) => s.standup_date === todayStr).length;
    const blockedToday = standups.filter((s) => s.standup_date === todayStr && s.blockers).length;
    const activeUsers = new Set(standups.map((s) => s.user_id)).size;
    const total14d = standups.length;
    return { postedToday, blockedToday, activeUsers, total14d };
  }, [standups]);

  const leaderboard = useMemo(() => {
    if (!standups) return [];
    const counts = new Map<string, number>();
    for (const s of standups) counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([id, count]) => ({ id, count, profile: profileById.get(id) ?? null }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [standups, profileById]);

  const activeBlockers = useMemo(() => {
    if (!standups) return [];
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return standups
      .filter((s) => s.standup_date === todayStr && s.blockers)
      .map((s) => ({ ...s, profile: profileById.get(s.user_id) ?? null }));
  }, [standups, profileById]);

  if (!standups || !stats) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Productivity dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Team activity over the last 14 days.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Activity className="size-4" />} label="Posted today" value={stats.postedToday} />
        <Stat icon={<AlertTriangle className="size-4" />} label="Blockers today" value={stats.blockedToday} tone={stats.blockedToday ? "warn" : undefined} />
        <Stat icon={<Users className="size-4" />} label="Active people" value={stats.activeUsers} />
        <Stat icon={<TrendingUp className="size-4" />} label="Updates / 14d" value={stats.total14d} />
      </div>

      <Card className="p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-base font-semibold tracking-tight mb-1">Updates per day</h2>
        <p className="text-xs text-muted-foreground mb-4">Standup volume across the team.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-semibold tracking-tight mb-4">Top contributors</h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            <ul className="space-y-3">
              {leaderboard.map((row, i) => {
                const name = row.profile?.display_name ?? "Teammate";
                const max = leaderboard[0].count;
                return (
                  <li key={row.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                    <Avatar className="size-8">
                      <AvatarFallback style={{ background: "var(--gradient-brand)", color: "var(--primary-foreground)" }}>
                        {initialsOf(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium truncate">{name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{row.count}</span>
                      </div>
                      <div className="h-1.5 mt-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(row.count / max) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-semibold tracking-tight mb-1">Active blockers</h2>
          <p className="text-xs text-muted-foreground mb-4">Reported today.</p>
          {activeBlockers.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No blockers reported today. 🎉</div>
          ) : (
            <ul className="space-y-3">
              {activeBlockers.map((b) => {
                const name = b.profile?.display_name ?? "Teammate";
                return (
                  <li key={b.id} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <Avatar className="size-8">
                      <AvatarFallback style={{ background: "var(--gradient-brand)", color: "var(--primary-foreground)" }}>
                        {initialsOf(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{name}</div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-0.5">{b.blockers}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: "warn" }) {
  return (
    <Card className="p-5 shadow-[var(--shadow-soft)]">
      <div className={`inline-flex size-8 items-center justify-center rounded-lg mb-3 ${
        tone === "warn" ? "bg-warning/15 text-warning" : "bg-accent text-accent-foreground"
      }`}>
        {icon}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}
