import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — VELTRIX",
  description: "VELTRIX refund and cancellation policy for event registrations.",
};

const sections = [
  {
    title: "1. Scope",
    body: `This Refund Policy applies to all paid event registrations processed through the VELTRIX platform. Free event registrations are not subject to refunds but may be cancelled as described in Section 4.`,
  },
  {
    title: "2. Refund Eligibility",
    body: `A full refund will be issued if:\n• The event is cancelled by the organiser.\n• A technical error caused a duplicate registration charge.\n\nPartial refunds (50%) will be issued if:\n• You cancel your registration more than 5 days before the event date.\n\nNo refunds will be issued if:\n• You cancel fewer than 5 days before the event.\n• You do not attend the event without prior notice.\n• You were disqualified due to a Code of Conduct violation.`,
  },
  {
    title: "3. How to Request a Refund",
    body: `To request a refund, email refunds@veltrix.universe with your:\n• Full name and roll number\n• Registration ID (found in your dashboard)\n• Reason for cancellation\n\nRequests must be submitted within 7 days of the event date. We will review and respond within 5 business days.`,
  },
  {
    title: "4. Free Event Cancellation",
    body: `If you have registered for a free event and are unable to attend, please cancel your registration from your student dashboard at least 24 hours before the event so your slot can be released to other students. Repeated no-shows may result in a temporary registration ban.`,
  },
  {
    title: "5. Refund Processing Time",
    body: `Approved refunds are processed within 7–10 business days. The refund will be returned via the original payment method. VELTRIX is not responsible for delays caused by your bank or payment provider.`,
  },
  {
    title: "6. Event Postponement",
    body: `If an event is postponed rather than cancelled, your registration will be automatically carried forward to the new date. If you cannot attend the new date, you may request a full refund within 48 hours of the postponement announcement.`,
  },
  {
    title: "7. Contact",
    body: `For refund-related queries: refunds@veltrix.universe\nANITS Campus, Visakhapatnam, Andhra Pradesh, India — 531 163`,
  },
];

export default function RefundPolicy() {
  return (
    <>
      {/* Hero */}
      <div
        style={{
          background: "var(--black)",
          color: "white",
          padding: "80px var(--side-padding) 60px",
          borderBottom: "var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "radial-gradient(ellipse at 60% 40%, rgba(0,170,255,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <p className="font-space" style={{ color: "var(--green)", letterSpacing: "3px", fontSize: "0.85rem", marginBottom: "12px" }}>
          ⚖ LEGAL DOCS
        </p>
        <h1 className="font-bangers" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "white", lineHeight: 1, marginBottom: "20px" }}>
          Refund <span style={{ color: "var(--blue, #00aaff)" }}>Policy</span>
        </h1>
        <p className="font-space" style={{ opacity: 0.6, fontSize: "0.95rem", maxWidth: "600px" }}>
          Last updated: June 2026 · For paid event registrations on VELTRIX
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "60px var(--side-padding) 100px" }}>
        <p className="font-space" style={{ lineHeight: "1.8", fontSize: "1rem", marginBottom: "48px", opacity: 0.75 }}>
          We want every student's experience on VELTRIX to be fair and transparent. Please read our refund and
          cancellation policy below before registering for any paid events.
        </p>

        {sections.map((sec) => (
          <div key={sec.title} style={{ marginBottom: "40px" }}>
            <h2 className="font-bebas" style={{ fontSize: "1.4rem", color: "var(--green)", letterSpacing: "2px", marginBottom: "12px" }}>
              {sec.title}
            </h2>
            <p className="font-space" style={{ lineHeight: "1.8", opacity: 0.75, whiteSpace: "pre-line" }}>
              {sec.body}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
