"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Shell } from "@/components/shell";
import { TrainingPlan } from "@/components/training-plan";
import { getPerson } from "@/lib/catalog";

export function PersonView() {
  return (
    <Shell allow="supervisor">
      <PersonBody />
    </Shell>
  );
}

function PersonBody() {
  const params = useParams<{ id: string }>();
  const person = getPerson(params.id);
  if (!person || person.role !== "employee") {
    return <p className="text-sm">That person is not on the sample crew.</p>;
  }
  return (
    <div>
      <Link href="/team" className="text-sm text-[#5e584f] underline underline-offset-4">
        Back to the crew
      </Link>
      <div className="mt-3">
        <TrainingPlan employeeId={person.id} mode="supervisor" />
      </div>
    </div>
  );
}
