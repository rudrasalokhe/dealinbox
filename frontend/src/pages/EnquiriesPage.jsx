import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Star, Search, Download, Trash2, Tag, ChevronRight } from 'lucide-react';

export const EnquiriesPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async (status = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/enquiries-data?status=${status}`, { credentials: 'include' });
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error('Enquiries fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(statusFilter);
  }, [statusFilter]);

  if (loading && !data) return <div style={{ padding: '40px', color: 'var(--t3)' }}>Loading brand opportunities...</div>;

  const filteredEnquiries = (data?.enquiries || []).filter((e) =>
    search ? (e.brand_name + ' ' + e.contact_name + ' ' + e.email + ' ' + e.brief).toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--acid)', lineHeight: 1 }}>Brand Opportunities</h1>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)', fontSize: '11px', textTransform: 'uppercase' }}>Track, negotiate, and organize incoming sponsorship inquiries.</p>
        </div>
        <a href="/enquiries/export" className="btn btn-secondary btn-sm">
          <Download size={14} /> Export CSV
        </a>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          <button onClick={() => setStatusFilter('')} className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}>
            All ({data?.counts?.all || 0})
          </button>
          {data?.statuses?.map((st) => (
            <button key={st.key} onClick={() => setStatusFilter(st.key)} className={`btn btn-sm ${statusFilter === st.key ? 'btn-primary' : 'btn-secondary'}`}>
              {st.label} ({data?.counts?.[st.key] || 0})
            </button>
          ))}
        </div>

        <div style={{ width: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Filter brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px', fontSize: '12.5px' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
        </div>
      </div>

      {/* Opportunities List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredEnquiries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--t3)' }}>
            <p style={{ fontSize: '15px' }}>No brand opportunities found in this view.</p>
          </div>
        ) : (
          filteredEnquiries.map((enq) => (
            <div key={enq.id} className="card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '0', background: 'var(--accent-soft)', border: '2px solid var(--border-strong)', color: 'var(--accent-hover)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  {enq.brand_name ? enq.brand_name[0].toUpperCase() : 'B'}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {enq.brand_name} {enq.starred && <Star size={14} color="var(--gold)" fill="var(--gold)" />}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--t3)', marginTop: '2px' }}>
                    {enq.contact_name} ({enq.email}) · {enq.platform} · <strong style={{ color: 'var(--green)' }}>{enq.budget}</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className={`badge badge-${enq.status}`}>{enq.status_label}</span>
                <span style={{ fontSize: '12px', color: 'var(--t4)' }}>{enq.created_at_fmt}</span>
                <Link to={`/enquiries/${enq.id}`} className="btn btn-secondary btn-sm">
                  View <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
