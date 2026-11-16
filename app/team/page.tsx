"use client";

import { Shell } from "@/components/shell";
import { TeamView } from "@/components/team-view";

export default function TeamPage() {
  return (
    <Shell allow="supervisor">
      <TeamView />
    </Shell>
  );
}
