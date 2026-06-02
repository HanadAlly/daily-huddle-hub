import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { todayISO, type Standup } from "@/lib/standup-types";

export function StandupForm({ userId, onSaved }: { userId: string; onSaved?: () => void }) {
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<Standup | null>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from("standups")
      .select("*")
      .eq("user_id", userId)
      .eq("standup_date", todayISO())
      .maybeSingle()
      .then(({ data }) => {
        if (!alive || !data) return;
        setExisting(data as Standup);
        setYesterday(data.yesterday);
        setToday(data.today);
        setBlockers(data.blockers ?? "");
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesterday.trim() || !today.trim()) {
      toast.error("Please fill in yesterday and today.");
      return;
    }
    setLoading(true);
    const payload = {
      user_id: userId,
      standup_date: todayISO(),
      yesterday: yesterday.trim(),
      today: today.trim(),
      blockers: blockers.trim() || null,
    };
    const { error } = await supabase
      .from("standups")
      .upsert(payload, { onConflict: "user_id,standup_date" });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(existing ? "Standup updated" : "Standup posted");
    onSaved?.();
  };

  return (
    <Card className="p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Today's standup</h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {existing && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" /> Posted
          </span>
        )}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="What did you do yesterday?"
          value={yesterday}
          onChange={setYesterday}
          placeholder="Shipped the auth refactor, reviewed 3 PRs…"
        />
        <Field
          label="What are you doing today?"
          value={today}
          onChange={setToday}
          placeholder="Wrap up the dashboard charts, pair with Sam on caching…"
        />
        <Field
          label="Any blockers?"
          value={blockers}
          onChange={setBlockers}
          placeholder="None — or describe what's in your way."
          optional
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {existing ? "Update standup" : "Post standup"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  label, value, onChange, placeholder, optional,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; optional?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} />
    </div>
  );
}
