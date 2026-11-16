"use client";

import { Shell } from "@/components/shell";
import { TrainingPlan } from "@/components/training-plan";
import { useStore } from "@/lib/store";

export default function TrainPage() {
  return (
    <Shell allow="employee">
      <TrainBody />
    </Shell>
  );
}

function TrainBody() {
  const { user } = useStore();
  if (!user) return null;
  return <TrainingPlan employeeId={user.id} mode="self" />;
}
