export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type Standup = {
  id: string;
  user_id: string;
  standup_date: string;
  yesterday: string;
  today: string;
  blockers: string | null;
  created_at: string;
  updated_at: string;
};

export type StandupWithProfile = Standup & { profile: Profile | null };

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
