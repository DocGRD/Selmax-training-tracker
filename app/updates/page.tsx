"use client";

import { Shell } from "@/components/shell";
import { UpdatesView } from "@/components/inbox-view";

export default function UpdatesPage() {
  return (
    <Shell allow="employee">
      <UpdatesView />
    </Shell>
  );
}
