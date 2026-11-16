import { EMPLOYEES } from "@/lib/catalog";
import { PersonView } from "./person-view";

export function generateStaticParams() {
  return EMPLOYEES.map((person) => ({ id: person.id }));
}

export const dynamicParams = false;

export default function PersonPage() {
  return <PersonView />;
}
