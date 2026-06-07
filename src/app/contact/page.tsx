export default function ContactPage() {
  return (
    <section className="content-section" style={{ padding: '80px var(--side-padding)', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="font-bangers" style={{ fontSize: '3rem', color: 'var(--pink)', marginBottom: '1rem' }}>Contact Us</h1>
      <p className="font-space" style={{ lineHeight: '1.6', fontSize: '1rem' }}>
        For inquiries, feedback, or support, please reach out to us at:
      </p>
      <ul className="font-space" style={{ marginTop: '1rem', lineHeight: '1.6' }}>
        <li>Email: <a href="mailto:support@veltrix.universe" style={{ color: 'var(--green)' }}>support@veltrix.universe</a></li>
        <li>Phone: <a href="tel:+1234567890" style={{ color: 'var(--green)' }}>+1 (234) 567‑890</a></li>
        <li>Address: ANITS Campus, Veltrix University, Hyderabad, India</li>
      </ul>
    </section>
  );
}
