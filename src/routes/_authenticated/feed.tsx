import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StandupForm } from "@/components/standup-form";
import { ActivityFeed } from "@/components/activity-feed";
import { WeatherWidget } from "@/components/weather-widget";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({ meta: [{ title: "Feed — Standup" }] }),
  component: FeedPage,
});

function FeedPage() {
  const { user } = Route.useRouteContext();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
      <div>
        <StandupForm userId={user.id} onSaved={() => setRefreshKey((k) => k + 1)} />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Team activity</h2>
        <ActivityFeed refreshKey={refreshKey} />
      </div>
    </div>
  );
}
