import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Zap, CheckCircle, ExternalLink } from 'lucide-react';

export const HeroEditorialStagger = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  };

  const tourDeals = [
    { date: '12 JUN 2026', brand: 'MAMAEARTH', venue: 'INSTAGRAM REELS · 1M REACH', badge: 'CLOSED', badgeClass: 'badge-new' },
    { date: '19 JUN 2026', brand: 'BOAT AUDIO', venue: 'YOUTUBE INTEGRATION', badge: 'IN REVIEW', badgeClass: 'badge-reviewing' },
    { date: '27 JUN 2026', brand: 'NYKAA BEAUTY', venue: '3-MONTH RETAINER', badge: 'NEGOTIATING', badgeClass: 'badge-negotiating' },
    { date: '04 JUL 2026', brand: 'MYNTRA FASHION', venue: 'DEDICATED LOOKBOOK', badge: 'ACCEPTED', badgeClass: 'badge-accepted' },
    { date: '11 JUL 2026', brand: 'SPOTIFY INDIA', venue: 'PODCAST SPONSORSHIP', badge: 'HIGH PRIORITY', badgeClass: 'badge-declined' },
  ];

  return (
    <div style={{ background: 'var(--canvas)', color: '#fff', position: 'relative' }}>
      {/* ── TOP HYPR CONTROL BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--acid)', fontWeight: 700 }}>DEALINBOX ✦</span>
          <span style={{ color: 'var(--t4)' }}>ELECTRONIC PRESS KIT // 2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'var(--t3)' }}>01 / 09</span>
          <span className="tilted-badge acid">NOW LIVE</span>
          <span className="tilted-badge">CREATOR OS</span>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ padding: '60px 24px 40px', maxWidth: '1140px', margin: '0 auto' }}
      >
        {/* ── 01 / HERO HEAVY HEADLINE ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <motion.div variants={itemVariants} className="mono-label">
              01 // MAXIMUM SPONSORSHIP PIPELINE
            </motion.div>

            <motion.h1
              variants={itemVariants}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(56px, 10vw, 110px)',
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: '0.01em',
                color: 'var(--acid)',
                textTransform: 'uppercase',
                marginBottom: '20px',
                textShadow: '0 0 40px rgba(204,255,0,0.2)'
              }}
            >
              HYPER<span style={{ color: 'var(--hyper)' }}>DEALS</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              style={{
                fontSize: '17px',
                color: 'var(--t2)',
                maxWidth: '640px',
                lineHeight: 1.5,
                marginBottom: '32px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Maximum volume brand pipeline. Glossy chaos for creators who treat their deal volume like a headline stadium tour.
            </motion.p>

            {/* ── CTA BUTTONS ── */}
            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '60px' }}>
              <Link to="/signup" className="btn btn-primary btn-xl" style={{ fontSize: '13px', background: 'var(--acid)', color: '#000', border: '2px solid #000' }}>
                LAUNCH WORKSPACE →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-xl">
                LOG IN TO EPK
              </Link>
            </motion.div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: '300px', height: '400px', position: 'relative' }}>
            <motion.img 
              initial={{ opacity: 0, y: 50, rotate: -4 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              src="/editorial/creator1.png" alt="Creator 1" style={{ width: '200px', height: '280px', objectFit: 'cover', border: '4px solid #000', boxShadow: '6px 6px 0 var(--hyper)', position: 'absolute', top: 0, left: 0, zIndex: 3 }} 
            />
            <motion.img 
              initial={{ opacity: 0, y: 80, rotate: 2 }}
              animate={{ opacity: 1, y: 0, rotate: 2 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              src="/editorial/creator2.png" alt="Creator 2" style={{ width: '180px', height: '240px', objectFit: 'cover', border: '4px solid #000', boxShadow: '6px 6px 0 var(--acid)', position: 'absolute', top: '100px', left: '160px', zIndex: 2 }} 
            />
            <motion.img 
              initial={{ opacity: 0, y: 110, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              src="/editorial/creator3.png" alt="Creator 3" style={{ width: '220px', height: '300px', objectFit: 'cover', border: '4px solid #000', boxShadow: '6px 6px 0 var(--t4)', position: 'absolute', top: '40px', left: '300px', zIndex: 1 }} 
            />
          </div>
        </div>
      </motion.div>

      {/* ── RUNNING MARQUEE BANNER ── */}
      <div className="running-marquee-banner">
        <div className="marquee-content">
          {[...Array(4)].map((_, i) => (
            <span key={i}>
              DEALINBOX CREATOR OS ✦ ₹1.48CR TRACKED DEALS ✦ 2.4M MONTHLY LISTENERS ✦ ZERO DM CHAOS ✦
            </span>
          ))}
        </div>
      </div>

      {/* ── 04 / BY THE NUMBERS (ACID LIME BLOCK SECTION) ── */}
      <div style={{ background: 'var(--acid)', color: '#000', padding: '60px 24px', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#000', opacity: 0.8, marginBottom: '8px' }}>
            04 / BY THE NUMBERS
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, textTransform: 'uppercase', lineHeight: 0.95, color: '#000', marginBottom: '28px' }}>
            BY THE NUMBERS
          </h2>

          <div className="acid-grid-3">
            <div className="acid-cell">
              <div className="acid-cell-label">MONTHLY AUDIENCE REACH</div>
              <div className="acid-cell-val">2.4M</div>
            </div>
            <div className="acid-cell">
              <div className="acid-cell-label">TOTAL SPONSORSHIP STREAMS</div>
              <div className="acid-cell-val">180M</div>
            </div>
            <div className="acid-cell">
              <div className="acid-cell-label">CREATOR FOLLOWERS</div>
              <div className="acid-cell-val">920K</div>
            </div>
            <div className="acid-cell">
              <div className="acid-cell-label">CAMPAIGN VIDEO VIEWS</div>
              <div className="acid-cell-val">50M</div>
            </div>
            <div className="acid-cell">
              <div className="acid-cell-label">GOLD HIT COLLABS</div>
              <div className="acid-cell-val">64</div>
            </div>
            <div className="acid-cell">
              <div className="acid-cell-label">BRAND REGIONS TRACKED</div>
              <div className="acid-cell-val">18</div>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#000', opacity: 0.8, marginTop: '16px' }}>
            Numbers refreshed quarterly. Yes, they are still going up.
          </div>
        </div>
      </div>

      {/* ── 06 / LIVE TOUR DEALS TABLE ── */}
      <div style={{ padding: '60px 24px', maxWidth: '1140px', margin: '0 auto' }}>
        <div className="mono-label hyper">06 / LIVE BRAND TOUR</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: '24px' }}>
          ON TOUR
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tourDeals.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--acid)', fontWeight: 700, minWidth: '100px' }}>{d.date}</span>
                <div>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: '#fff', letterSpacing: '0.04em' }}>{d.brand}</strong>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--t3)', display: 'block' }}>{d.venue}</span>
                </div>
              </div>
              <span className={`badge ${d.badgeClass}`}>{d.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
