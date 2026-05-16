import { CertificateWallet, PageHero } from "@/components/VeltrixUI";

export default function CertificatesPage() {
  return (
    <>
      <PageHero
        kicker="Certificates"
        title="Proof that looks as good as it feels."
        copy="Collect verified certificates from events, workshops, competitions, and club missions."
        action={{ label: "Earn another", href: "/events" }}
      />
      <CertificateWallet />
    </>
  );
}
