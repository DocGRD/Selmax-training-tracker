"use client";

import { MatrixView } from "@/components/matrix-view";
import { Shell } from "@/components/shell";

export default function MatrixPage() {
  return (
    <Shell allow="supervisor">
      <MatrixView />
    </Shell>
  );
}
