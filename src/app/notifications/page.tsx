import { NotificationsList, PageHero } from "@/components/VeltrixUI";

export default function NotificationsPage() {
  return (
    <>
      <PageHero
        kicker="Notifications"
        title="Campus updates without chaos."
        copy="Event reminders, registration alerts, club posts, certificate drops, and admin notices in a readable comic-tech feed."
        action={{ label: "Open dashboard", href: "/dashboard/student" }}
      />
      <NotificationsList />
    </>
  );
}
