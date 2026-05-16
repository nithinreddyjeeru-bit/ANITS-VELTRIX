import { PageHero, UtilityCards } from "@/components/VeltrixUI";

export default function ContactPage() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Send a signal to the team."
        copy="Reach the VELTRIX crew for club onboarding, event support, sponsorship, admin access, or student help."
      />
      <UtilityCards
        items={[
          { title: "Club onboarding", copy: "Launch your club space.", color: "#0057ff" },
          { title: "Event support", copy: "Get help with registrations.", color: "#ffd400" },
          { title: "Sponsors", copy: "Partner with campus events.", color: "#ff3131" },
        ]}
      />
    </>
  );
}
