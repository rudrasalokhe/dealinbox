import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Copy, Check, ShieldAlert, TrendingUp, Lightbulb, Zap } from 'lucide-react';

export const CopilotModal = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 **Hi Creator! I'm your AI Deal Copilot.**\n\nI help you negotiate higher rates, spot predatory contract terms (like perpetual ad rights), and draft winning pitch responses. What deal are you working on today?",
      quickTips: true
    }
  ]);

  const quickPrompts = [
    { label: '💰 Counter lowball offer', prompt: 'How do I counter a ₹15,000 lowball offer for a dedicated Reel?' },
    { label: '🚨 Scan contract traps', prompt: 'What are the biggest red flag clauses in brand sponsorship contracts?' },
    { label: '⚡ 50% Advance script', prompt: 'Write me a polite script demanding 50% advance payment before shooting.' },
    { label: '🔒 Exclusivity pricing', prompt: 'Brand wants 3-month category exclusivity. How much extra should I charge?' },
  ];

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: q, history: messages.slice(-4) }),
      });
      const data = await res.json();
      if (data.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: '⚠️ Unable to reach AI copilot engine. Please check your network or try again.' }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '⚡ Network error. Ensure the server is online.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '28px',
          zIndex: 600,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '9999px',
          fontWeight: 600,
          fontSize: '13.5px',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all .2s ease',
        }}
      >
        <Sparkles size={16} /> AI Deal Copilot
      </button>

      {/* Slide-in Assistant Window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '28px',
            zIndex: 650,
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.75), 0 0 35px rgba(99, 102, 241, 0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(30, 41, 59, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>Deal Copilot</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>AI Negotiator Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                color: '#94a3b8',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .15s',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '12px 16px',
                    borderRadius: m.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: m.role === 'user' ? '#6366f1' : 'rgba(30, 41, 59, 0.75)',
                    border: m.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontSize: '13px',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.text}
                </div>

                {m.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(m.text, idx)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: copiedIndex === idx ? '#10b981' : '#64748b',
                      marginTop: '4px',
                      padding: '2px 6px',
                      background: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                    {copiedIndex === idx ? 'Copied' : 'Copy advice'}
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span>AI Copilot formulating deal strategy...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div
            style={{
              padding: '8px 14px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(15, 23, 42, 0.5)',
            }}
          >
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => sendMessage(qp.prompt)}
                style={{
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  padding: '5px 10px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(15, 23, 42, 0.9)',
            }}
          >
            <input
              type="text"
              placeholder="Ask about rates, counter-offers, red flags..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                fontSize: '13px',
                padding: '9px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: input.trim() ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'all .15s',
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
