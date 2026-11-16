"use client";

import { InboxView } from "@/components/inbox-view";
import { Shell } from "@/components/shell";

export default function InboxPage() {
  return (
    <Shell allow="supervisor">
      <InboxView />
    </Shell>
  );
}
