import { EventCreationForm, PageHero } from "@/components/VeltrixUI";

export default function CreateEventPage() {
  return (
    <>
      <PageHero
        kicker="Club Portal"
        title="Host your next big thing."
        copy="Create, customize, and launch campus-wide events with reward loops, QR check-ins, and automated certification."
        secondaryAction={{ label: "Back to Dashboard", href: "/dashboard" }}
      />
      <EventCreationForm />
    </>
  );
}
