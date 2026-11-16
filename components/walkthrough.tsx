"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

const STEPS = [
  {
    n: "1",
    title: "Start on the floor",
    body: "Sign in as Riley Chen, a new operator. Open Part Inspection and tap I know this. That is the employee saying the skill is ready.",
    personId: "riley",
    href: "/train",
    cta: "Open Riley’s plan",
  },
  {
    n: "2",
    title: "It lands like an email",
    body: "Sign in as Dana Okonkwo, Riley’s Employee Supervisor. The inbox is the message Dana would get. A few requests are already waiting.",
    personId: "dana",
    href: "/inbox",
    cta: "Open Dana’s inbox",
  },
  {
    n: "3",
    title: "Sign off, or send it back",
    body: "Sign off records today’s date and Dana’s name. Send back needs a comment. The employee sees that comment on the skill, and the history keeps both.",
    personId: "dana",
    href: "/inbox",
    cta: "Decide one request",
  },
  {
    n: "4",
    title: "The paper plan, live",
    body: "Open the matrix. Rows are Revision 12. Columns are the crew. A machine skill shows how many presses are signed off. Tap a cell for the history.",
    personId: "dana",
    href: "/matrix",
    cta: "Open the matrix",
  },
];

export function Walkthrough({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { signIn } = useStore();
  const router = useRouter();

  async function go(personId: string, href: string) {
    await signIn(personId);
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide uppercase">Show it in a few minutes</DialogTitle>
          <DialogDescription>
            Sample crew only. The Employee Supervisor still decides when the skill is met.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {STEPS.map((step) => (
            <li key={step.n} className="rounded-xl border bg-[#faf8f5] p-3">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-lg text-selmax">{step.n}</span>
                <h3 className="font-medium">{step.title}</h3>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[#5e584f]">{step.body}</p>
              <Button className="mt-2 h-9" variant="outline" onClick={() => go(step.personId, step.href)}>
                {step.cta}
              </Button>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
