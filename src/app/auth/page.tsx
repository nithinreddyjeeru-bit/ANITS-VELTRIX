import { PageHero } from "@/components/VeltrixUI";
import { AuthWorkflow } from "@/components/AuthWorkflow";

export default function AuthPage() {
  return (
    <>
      <PageHero
        kicker="Login / Sign up"
        title="Step into VELTRIX."
        copy="A clean auth flow for students, club coordinators, and admins with OTP-ready fields and social sign-in space."
        action={{ label: "Preview events", href: "/events" }}
      />
      <AuthWorkflow />
    </>
  );
}
