import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroEditorialStagger } from '../components/HeroEditorialStagger';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const CheckIcon = ({ color = 'var(--green)' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" />
  </svg>
);

export const LandingPage = () => {
  const tickerItems = [
    { dot: '', text: <><strong>@priyasharma</strong> signed a ₹45,000 campaign with Mamaearth</> },
    { dot: 'gold', text: <><strong>boAt</strong> sent a ₹75,000 brief to @techrohan</> },
    { dot: 'green', text: <><strong>₹1.48 Cr+</strong> total deal volume processed on DealInbox this month</> },
    { dot: '', text: <><strong>@nehamukherjee</strong> closed a 3-month retainer with Nykaa</> },
    { dot: 'gold', text: <><strong>Myntra</strong> requested 4 Reels from @lifestyle_arav</> },
  ];

  const features = [
    { icon: '🔗', title: 'One link, zero chaos', desc: 'Share your DealInbox link. Brands fill a proper brief — budget, timeline, deliverables — instead of a DM thread.' },
    { icon: '📊', title: "Track every deal's journey", desc: 'A pipeline from first contact to paid. See exactly where every collaboration stands.' },
    { icon: '💰', title: "Know exactly what you've earned", desc: 'Monthly breakdown, pending payments, lifetime value — numbers you can actually show anyone.' },
    { icon: '🔔', title: 'Never miss a deadline', desc: 'A priority board flags urgent replies and payment follow-ups before anything falls through.' },
    { icon: '✨', title: 'Look premium to every brand', desc: "A structured submission form signals you're serious. Better briefs mean better deals." },
    { icon: '📱', title: 'Manage from anywhere', desc: 'Fully responsive. Review briefs, update statuses, and check earnings from your phone.' },
  ];

  const testimonials = [
    { name: 'Priya S.', tag: '890K · Beauty', color: '#c2410c', initials: 'PS', text: "Before DealInbox I had a Notion doc, a spreadsheet, and forty unread DMs all tracking the same deals. First month in, I found a ₹18K deal I'd completely forgotten about." },
    { name: 'Rohan K.', tag: '1.2M · Tech', color: '#2b52e0', initials: 'RK', text: "Brands fill in their budget upfront now, so I've stopped having the awkward money conversation. My average deal value went up 30% in three months." },
    { name: 'Neha M.', tag: '450K · Lifestyle', color: '#178a4c', initials: 'NM', text: "I sent my DealInbox link to a top FMCG brand's marketing team. They called it the most professional outreach they'd seen from an indie creator — closed the deal that week." },
  ];

  return (
    <div style={{ background: 'var(--canvas)', color: 'var(--t1)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── NAV ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-logo">
          DealInbox
        </Link>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#testimonials">Creators</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="lp-nav-right">
          <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Sign up free</Link>
        </div>
      </nav>

      {/* ── LIVE TICKER ── */}
      <div className="live-ticker-wrap">
        <div className="live-ticker-track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <div className="ticker-item" key={i}>
              <span className={`ticker-dot ${t.dot}`} /> {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── HERO EDITORIAL STAGGER COMPONENT ── */}
      <HeroEditorialStagger />

      {/* ── PLATFORMS STRIP ── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="lp-social"
      >
        <p>Creators on these platforms manage brand deals with DealInbox</p>
        <div className="lp-platforms">
          {['YouTube', 'Instagram', 'Moj', 'Josh', 'LinkedIn'].map((p) => <span key={p}>{p}</span>)}
        </div>
      </motion.section>

      {/* ── FEATURES GRID ── */}
      <section className="lp-section" id="features">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="lp-section-head"
        >
          <span className="lp-section-eyebrow">FEATURES</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>
            Built for how creators <span style={{ fontFamily: 'var(--font-ui)', fontStyle: 'normal', fontWeight: 800 }}>actually work</span>
          </h2>
          <p>No spreadsheets. No forgotten follow-ups. Just a clean, high-clarity deal pipeline.</p>
        </motion.div>

        <div className="lp-feature-grid">
          {features.map((f, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, borderColor: 'var(--accent)' }}
              className="lp-feature"
            >
              <div className="lp-feature-icon" style={{ fontSize: 22 }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section" id="testimonials">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="lp-section-head"
        >
          <span className="lp-section-eyebrow">CREATORS LOVE IT</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>
            Real creators, <span style={{ fontFamily: 'var(--font-ui)', fontStyle: 'normal', fontWeight: 800 }}>real pipeline results</span>
          </h2>
          <p>Built from actual creator workflows, not generic productivity theory.</p>
        </motion.div>

        <div className="lp-test-grid">
          {testimonials.map((t, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="lp-test-card"
            >
              <div className="lp-stars">★★★★★</div>
              <p className="lp-test-text">"{t.text}"</p>
              <div className="lp-test-user">
                <div className="lp-test-av" style={{ background: t.color }}>{t.initials}</div>
                <div><strong>{t.name}</strong><span>{t.tag}</span></div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-section" id="pricing">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="lp-section-head"
        >
          <span className="lp-section-eyebrow">PRICING</span>
          <h2>Simple, transparent pricing</h2>
          <p>Start for free, upgrade when your deal volume scales.</p>
        </motion.div>

        <div className="lp-pricing-grid">
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lp-price-card"
          >
            <span className="badge badge-accepted">Free</span>
            <div className="lp-price">₹0 <small>/forever</small></div>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--t3)' }}>Everything to get started</p>
            <hr className="divider" />
            <ul className="lp-price-list">
              <li><CheckIcon /> 1 public DealInbox link</li>
              <li><CheckIcon /> Up to 20 active deals</li>
              <li><CheckIcon /> Basic earnings tracker</li>
              <li><CheckIcon /> Brand submission form</li>
            </ul>
            <Link to="/signup" className="btn btn-secondary btn-full" style={{ marginTop: 20 }}>Start for free</Link>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="lp-price-card pro"
          >
            <span className="badge" style={{ background: 'var(--gold-soft)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>Most popular</span>
            <div className="lp-price">₹199 <small>/month</small></div>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--t3)' }}>Everything in Free, plus</p>
            <hr className="divider" />
            <ul className="lp-price-list">
              <li><CheckIcon color="var(--gold)" /> Unlimited active deals</li>
              <li><CheckIcon color="var(--gold)" /> Advanced earnings analytics</li>
              <li><CheckIcon color="var(--gold)" /> Priority board &amp; positioning tools</li>
              <li><CheckIcon color="var(--gold)" /> Priority support</li>
            </ul>
            <Link to="/signup" className="btn btn-gold btn-full" style={{ marginTop: 20 }}>Start with Pro →</Link>
            <p style={{ textAlign: 'center', marginTop: 10, fontSize: 11.5, color: 'var(--t4)' }}>No credit card required to sign up</p>
          </motion.article>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="lp-final"
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: '42px' }}>
            Your next brand deal is <span style={{ fontFamily: 'var(--font-ui)', fontStyle: 'normal', fontWeight: 800 }}>waiting.</span>
          </h2>
          <p style={{ marginTop: 12 }}>Join 2,400+ Indian creators who actually know what's in their inbox.</p>
          <Link to="/signup" className="btn btn-primary btn-xl" style={{ marginTop: 28, padding: '16px 36px' }}>
            Create your free page <ArrowRight size={18} />
          </Link>
          <small style={{ display: 'block', marginTop: 16, color: 'var(--t4)' }}>No credit card required · Free forever plan · 2 min setup</small>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-left">
            <span className="lp-logo"><img src="/static/logo.jpeg" alt="" style={{ width: 20, height: 20, borderRadius: 4 }} /> DealInbox</span>
            <span>© 2026 DealInbox. Made for Indian creators.</span>
          </div>
          <div className="lp-footer-right">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <Link to="/login">For Brands</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
