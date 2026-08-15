import React, { useState } from 'react';
import { Sparkles, X, Lightbulb, TrendingUp } from 'lucide-react';

export const CopilotModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 500,
          background: 'linear-gradient(135deg, var(--accent), #7c5ef7)', color: '#fff',
          padding: '10px 18px', borderRadius: '99px', fontWeight: 600, fontSize: '13px',
          boxShadow: '0 8px 24px rgba(79,110,247,.4)', display: 'flex', alignItems: 'center', gap: '8px'
        }}
      >
        <Sparkles size={16} /> AI Deal Copilot
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '24px', zIndex: 600,
          width: '320px', background: 'var(--paper)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-lg)', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,.7)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', color: '#fff' }}>
              <Sparkles size={16} color="var(--accent)" /> Deal Copilot
            </h4>
            <button onClick={() => setOpen(false)} style={{ color: 'var(--t3)' }}><X size={18} /></button>
          </div>

          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px', marginBottom: '12px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gold)', marginBottom: '4px' }}>
              <Lightbulb size={14} /> Pitch Pro Tip
            </strong>
            <p style={{ fontSize: '12px', color: 'var(--t2)' }}>Always clarify deliverable timelines & usage rights before confirming rates.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px', marginBottom: '16px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)', marginBottom: '4px' }}>
              <TrendingUp size={14} /> Rate Baseline
            </strong>
            <p style={{ fontSize: '12px', color: 'var(--t2)' }}>Baseline: ~₹1,000 per 10,000 follower impressions for dedicated Reels.</p>
          </div>
        </div>
      )}
    </>
  );
};
