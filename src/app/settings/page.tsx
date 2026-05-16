import { PageHero } from "@/components/VeltrixUI";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";

export default function SettingsPage() {
  return (
    <>
      <PageHero
        kicker="Settings"
        title="Tune your VELTRIX experience."
        copy="Update your profile, department, bio, and avatar — saved to Supabase instantly."
      />
      <ProfileSettingsForm />
    </>
  );
}
