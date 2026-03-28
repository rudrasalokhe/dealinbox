(function () {
  if (!window.React || !window.ReactDOM) return;
  const h = React.createElement;

  const parseState = (id) => {
    const node = document.getElementById(id);
    if (!node) return null;
    try { return JSON.parse(node.textContent || "{}"); } catch (_) { return null; }
  };
  const inr = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  function LandingApp({ state }) {
    return h("main", { className: "landing-react" }, [
      h("section", { className: "hero-v2", key: "hero" }, [
        h("div", { className: "hero-v2-copy", key: "copy" }, [
          h("span", { className: "hero-chip", key: "chip" }, `${state.total}+ creators · ${state.enq_total}+ brand opportunities managed`),
          h("h1", { key: "title" }, "Creator Deal CRM for influencers, managers, and agencies."),
          h("p", { key: "sub" }, "Turn scattered DMs and emails into a premium collaboration pipeline—from inbound interest to signed campaigns and follow-ups."),
          h("div", { className: "hero-actions", key: "actions" }, [
            h("a", { href: state.urls.signup, className: "btn btn-primary btn-xl", key: "signup" }, "Start my creator workspace"),
            h("a", { href: state.urls.login, className: "btn btn-lg", key: "login" }, "Open my deal HQ"),
          ]),
        ]),
        h("div", { className: "hero-v2-preview", key: "preview" }, [
          h("div", { className: "hp-head", key: "head" }, [h("span", { key: 1 }), h("span", { key: 2 }), h("span", { key: 3 }), h("p", { key: 4 }, "creator-hq/deal-pipeline")]),
          h("div", { className: "hp-body", key: "body" }, [
            h("div", { className: "hp-kpis", key: "kpis" }, [
              h("article", { key: "k1" }, [h("small", null, "Estimated pipeline value"), h("strong", null, "₹2,45,000")]),
              h("article", { key: "k2" }, [h("small", null, "Response rate"), h("strong", null, "94%")]),
              h("article", { key: "k3" }, [h("small", null, "Active negotiations"), h("strong", null, "6")]),
            ]),
            h("div", { className: "hp-list", key: "list" }, [
              h("div", null, [h("b", null, "LuxeSkin x Reels Campaign"), h("span", null, "Negotiating · ₹75k")]),
              h("div", null, [h("b", null, "TravelMate Brand Shoot"), h("span", null, "Reviewing · Deliverables pending")]),
              h("div", null, [h("b", null, "FinEdge Partner Series"), h("span", null, "Accepted · Starts Apr 05")]),
            ]),
          ]),
        ]),
      ]),
      h("section", { className: "features-v2", key: "f" }, [
        h("header", null, [h("p", { className: "l-section-label" }, "Built for the creator economy"), h("h2", null, "Manage every brand collaboration in one premium operating system.")]),
        h("div", { className: "f2-grid" }, [
          h("article", null, [h("h3", null, "Brand Collaboration Inbox"), h("p", null, "Capture inbound requests with campaign brief, budget range, timeline, and deliverables in one structured intake flow.")]),
          h("article", null, [h("h3", null, "Deal Pipeline Control"), h("p", null, "Track every opportunity from new inquiry to negotiation, accepted collab, and post-campaign closure.")]),
          h("article", null, [h("h3", null, "Creator Earnings Visibility"), h("p", null, "Monitor close rate, average deal value, and projected pipeline income so your business scales predictably.")]),
        ]),
      ]),
      h("section", { className: "workflow-v2", key: "problem" }, [
        h("header", null, [h("p", { className: "l-section-label" }, "Why creators switch"), h("h2", null, "From inquiry to invoice, run your creator business like a pro.")]),
        h("div", { className: "wf-grid" }, [
          h("article", null, [h("span", null, "01"), h("h3", null, "Capture inbound interest"), h("p", null, "Replace “DM for collabs” with a polished intake page brands trust.")]),
          h("article", null, [h("span", null, "02"), h("h3", null, "Negotiate with context"), h("p", null, "Keep notes, reminders, status, and quick-reply drafts attached to each deal.")]),
          h("article", null, [h("span", null, "03"), h("h3", null, "Scale your revenue ops"), h("p", null, "See what channels, deal sizes, and response habits drive better monthly earnings.")]),
        ]),
      ]),
      h("section", { className: "pricing-v2", key: "proof" }, [
        h("header", null, [h("p", { className: "l-section-label" }, "Creator-friendly pricing"), h("h2", null, "Start free. Upgrade when your collaboration volume grows.")]),
        h("div", { className: "pv2-cards" }, [
          h("article", { className: "pv2-card" }, [
            h("h3", null, "Starter"),
            h("p", { className: "pv2-price" }, ["₹0", h("span", null, "/month")]),
            h("ul", null, [
              h("li", null, "Professional collab intake page"),
              h("li", null, "Brand opportunity pipeline"),
              h("li", null, "Campaign status sharing link"),
              h("li", null, "Up to 20 opportunities/month"),
            ]),
            h("a", { href: state.urls.signup, className: "btn btn-full" }, "Start free"),
          ]),
          h("article", { className: "pv2-card featured" }, [
            h("span", { className: "tag" }, "Recommended"),
            h("h3", null, "Creator Pro"),
            h("p", { className: "pv2-price" }, ["₹199", h("span", null, "/month")]),
            h("ul", null, [
              h("li", null, "Unlimited brand opportunities"),
              h("li", null, "Advanced creator earnings analytics"),
              h("li", null, "Exports + reminder workflows"),
              h("li", null, "Priority support for teams/agencies"),
            ]),
            h("a", { href: state.urls.signup, className: "btn btn-primary btn-full" }, "Launch Creator Pro"),
          ]),
        ]),
      ]),
      h("section", { className: "l-faq", key: "faq" }, [
        h("div", { className: "l-container" }, [
          h("div", { className: "l-section-label" }, "FAQ"),
          h("h2", { className: "l-section-h2" }, "For creators, managers, and agencies."),
          h("div", { className: "l-faq-list" }, [
            h("details", null, [h("summary", null, "Can brands track negotiation progress?"), h("p", null, "Yes. Each request can include a status portal link so brand teams know where a collaboration stands.")]),
            h("details", null, [h("summary", null, "Can I use this with my existing DMs/email flow?"), h("p", null, "Absolutely. Keep your channels, but route serious opportunities into your structured deal workspace.")]),
            h("details", null, [h("summary", null, "Is this built only for solo creators?"), h("p", null, "No. It works for solo creators, talent managers, and agencies running multiple brand partnerships.")]),
          ]),
        ]),
      ]),
      h("section", { className: "cta-v2", key: "cta" }, [
        h("h2", null, "Stop managing brand deals in chaos."),
        h("p", null, "Run your creator business with clarity, speed, and premium presentation."),
        h("a", { href: state.urls.signup, className: "btn btn-primary btn-xl" }, "Create Creator Deal HQ"),
      ]),
    ]);
  }

  function DashboardApp({ state }) {
    const stats = state.stats || {};
    const greeting = (state.name || "Creator").split(" ")[0];
    const pipelineValue = Number(stats.total_val || 0);
    const avgValue = Number(stats.avg_value || 0);
    const conversion = Number(stats.conversion || 0);
    const responseRate = state.avg_response_hours ? Math.max(40, Math.round(100 - Math.min(60, state.avg_response_hours))) : null;
    const monthlyEarnings = Math.round(pipelineValue * 0.35);

    const card = (label, value, sub, cls) =>
      h("article", { className: `db-stat-card ${cls || ""}`.trim() }, [h("p", { key: "l" }, label), h("h3", { key: "v" }, value), h("span", { key: "s" }, sub)]);

    return h("div", { className: "db-shell" }, [
      h("section", { className: "db-hero", key: "hero" }, [
        h("div", { key: "txt" }, [
          h("p", { className: "db-eyebrow", key: "e" }, "Creator Business HQ"),
          h("h1", { key: "h" }, `Welcome back, ${greeting}. Your deal pipeline is live.`),
          h("p", { className: "db-sub", key: "s" }, "Track brand opportunities, active negotiations, signed collaborations, and follow-ups in one premium creator workspace."),
        ]),
        h("div", { className: "db-hero-actions", key: "a" }, [
          h("a", { href: state.urls.public_page, target: "_blank", className: "btn", key: "p" }, "View collab page ↗"),
          h("a", { href: state.urls.enquiries, className: "btn btn-primary", key: "e" }, "Open deal pipeline →"),
        ]),
      ]),
      h("section", { className: "db-stats-grid", key: "stats" }, [
        card("Estimated pipeline value", inr(pipelineValue), avgValue ? `Average deal ${inr(avgValue)}` : "Close deals to unlock averages", "glow"),
        card("Monthly earnings (est.)", inr(monthlyEarnings), "Based on current pipeline mix"),
        card("Win rate", `${conversion || 0}%`, `${stats.accepted || 0} signed / ${stats.total || 0} opportunities`),
        card("Response rate", responseRate ? `${responseRate}%` : "—", state.avg_response_hours ? `Avg reply ${state.avg_response_hours}h` : "Needs more activity data"),
      ]),
      h("div", { className: "db-main-grid", key: "grid" }, [
        h("div", { className: "db-left-col", key: "left" }, [
          h("section", { className: "db-card", key: "pipeline" }, [
            h("div", { className: "db-card-head", key: "ph" }, [h("h2", null, "Collaboration pipeline by stage")]),
            h("div", { className: "db-stage-grid", key: "ps" }, (state.pipeline || []).map(s =>
              h("div", { className: "db-stage-item", key: s.key }, [h("div", { className: "db-stage-top", key: "t" }, [h("span", { className: "dot", style: { background: s.color }, key: "d" }), s.label]), h("strong", { key: "c" }, String(s.count || 0))])
            )),
          ]),
          h("section", { className: "db-card", key: "recent" }, [
            h("div", { className: "db-card-head", key: "rh" }, [h("h2", null, "Recent brand activity")]),
            (state.recent || []).length
              ? h("div", { className: "db-list", key: "r" }, (state.recent || []).map(r =>
                  h("a", { href: `${state.urls.status_base}${r.id}`, className: "db-list-row", key: r.id }, [
                    h("div", null, [h("h4", null, r.brand_name), h("p", null, `${r.platform} · ${r.budget}`)]),
                    h("div", { className: "db-row-meta" }, [h("span", { className: `pill pill-${r.status}` }, r.status_label), h("small", null, r.created_at_fmt)]),
                  ])
                ))
              : h("div", { className: "premium-empty", key: "empty" }, [h("h3", null, "No brand opportunities yet"), h("p", null, "Share your collab page to start receiving campaign requests.")]),
          ]),
          h("section", { className: "db-card", key: "activity" }, [
            h("div", { className: "db-card-head", key: "ah" }, [h("h2", null, "Deal activity feed")]),
            (state.activity || []).length
              ? h("div", { className: "timeline", key: "al" }, (state.activity || []).map((a, i) =>
                  h("div", { className: "tl-item", key: i }, [h("i"), h("div", null, [h("h5", null, a.action), a.detail ? h("p", null, a.detail) : null, h("small", null, a.created_at_fmt)])])
                ))
              : h("p", { className: "empty-small" }, "No recent activity yet."),
          ]),
          h("section", { className: "db-card", key: "performance" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Creator performance snapshot")]),
            h("div", { className: "db-mini-list" }, [
              h("div", { className: "mini-row" }, [h("strong", null, "Active negotiations"), h("span", null, String((state.pipeline || []).find(p => p.key === "negotiating")?.count || 0))]),
              h("div", { className: "mini-row" }, [h("strong", null, "Signed collaborations"), h("span", null, String(stats.accepted || 0))]),
              h("div", { className: "mini-row" }, [h("strong", null, "Average deal value"), h("span", null, avgValue ? inr(avgValue) : "—")]),
            ]),
          ]),
        ]),
        h("aside", { className: "db-right-col", key: "right" }, [
          h("section", { className: "db-card", key: "check" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Creator onboarding checklist")]),
            h("div", { className: "checklist" }, (state.checklist || []).map((item, i) =>
              h("a", { href: item.link, className: `check-item ${item.done ? "done" : ""}`.trim(), key: i }, [h("span", null, item.done ? "✓" : "○"), h("div", null, item.title)])
            )),
          ]),
          h("section", { className: "db-card", key: "rem" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Pending follow-ups")]),
            (state.pending_tasks || []).length
              ? h("div", { className: "db-mini-list" }, (state.pending_tasks || []).map(r => h("a", { href: `${state.urls.status_base}${r.id}`, className: "mini-row", key: r.id }, [h("strong", null, r.brand_name), h("span", null, `Follow up ${r.reminder_due_fmt}`)])))
              : h("p", { className: "empty-small" }, "No follow-ups due in next 7 days."),
          ]),
          h("section", { className: "db-card", key: "noti" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Notifications center")]),
            (state.notifications || []).length
              ? h("div", { className: "db-mini-list" }, (state.notifications || []).map((n, i) => h("div", { className: "mini-row", key: i }, [h("strong", null, String(n.type || "").toUpperCase()), h("span", null, n.text || "")])))
              : h("p", { className: "empty-small" }, "No urgent notifications right now."),
          ]),
          h("section", { className: "db-card quick-actions", key: "quick" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Quick actions")]),
            h("a", { className: "qa-btn", href: state.urls.enquiries }, "Review brand opportunities"),
            h("a", { className: "qa-btn", href: state.urls.analytics_or_upgrade }, "Open creator earnings"),
            h("a", { className: "qa-btn", href: state.urls.settings }, "Update media profile"),
          ]),
          !state.is_pro_user && h("section", { className: "db-card upsell", key: "upsell" }, [
            h("p", { className: "upsell-tag" }, "Creator Pro"),
            h("h3", null, `Scale beyond ${state.FREE_ENQUIRY_LIMIT} opportunities/month`),
            h("p", null, `You've processed ${state.enq_this_month} this month.`),
            h("a", { href: state.urls.upgrade, className: "btn btn-primary btn-full" }, "Upgrade to Creator Pro"),
          ]),
        ]),
      ]),
    ]);
  }

  function EnquiriesApp({ state }) {
    const [view, setView] = React.useState("table");
    const [query, setQuery] = React.useState("");
    const [saved, setSaved] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState(state.status_f || "");

    const rows = (state.enquiries || []).filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (query && !(r.search_blob || "").includes(query.toLowerCase())) return false;
      if (saved === "high") return Number(r.budget_num || 0) >= 25000;
      if (saved === "new") return r.status === "new" || r.status === "reviewing";
      if (saved === "closing") return r.status === "negotiating" || r.status === "accepted";
      return true;
    });

    async function updateStatus(id, status) {
      const res = await fetch(`${state.urls.api_status_prefix}${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (data.ok && window.showToast) window.showToast(`Updated: ${data.label}`);
    }

    function exportCsv() {
      const out = [["Brand", "Platform", "Budget", "Status", "Received"], ...rows.map(r => [r.brand_name, r.platform, r.budget, r.status_label, r.created_at_fmt])];
      const a = document.createElement("a");
      a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(out.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n"));
      a.download = "brand-opportunities.csv";
      a.click();
    }

    return h("div", { className: "enx-shell" }, [
      h("section", { className: "enx-head", key: "head" }, [
        h("div", null, [h("h1", null, "Brand Opportunity Workspace"), h("p", { className: "page-sub" }, "Track negotiation stages, campaign scope, and value across every collaboration.")]),
        h("div", { className: "enx-actions" }, [
          h("div", { className: "view-toggle" }, [
            h("button", { className: `vt-btn ${view === "table" ? "active" : ""}`, onClick: () => setView("table") }, "Table"),
            h("button", { className: `vt-btn ${view === "kanban" ? "active" : ""}`, onClick: () => setView("kanban") }, "Pipeline"),
          ]),
          h("button", { className: "btn", onClick: exportCsv }, "Export"),
        ]),
      ]),
      h("section", { className: "enx-toolbar db-card", key: "toolbar" }, [
        h("div", { className: "enx-search" }, h("input", { type: "search", placeholder: "Search brand, campaign, contact, or brief…", value: query, onChange: (e) => setQuery(e.target.value) })),
        h("div", { className: "enx-saved" }, [
          h("button", { className: "btn btn-sm", onClick: () => setSaved("high") }, `High value (${state.saved_views?.high || 0})`),
          h("button", { className: "btn btn-sm", onClick: () => setSaved("new") }, `Needs reply (${state.saved_views?.new || 0})`),
          h("button", { className: "btn btn-sm", onClick: () => setSaved("closing") }, `Closing soon (${state.saved_views?.closing || 0})`),
          h("button", { className: "btn btn-sm", onClick: () => setSaved("") }, "Clear"),
        ]),
      ]),
      h("div", { className: "filter-tabs", key: "tabs" }, [
        h("button", { className: `ft-tab ${!statusFilter ? "active" : ""}`, onClick: () => setStatusFilter("") }, ["All opportunities ", h("span", { className: "ft-count" }, String(state.counts?.all || 0))]),
        ...(state.statuses || []).map((s) =>
          h("button", { className: `ft-tab ${statusFilter === s.key ? "active" : ""}`, onClick: () => setStatusFilter(s.key), key: s.key }, [s.label, " ", h("span", { className: "ft-count" }, String(state.counts?.[s.key] || 0))])
        ),
      ]),
      view === "table"
        ? h("div", { className: "enq-table-wrap premium-table-wrap", key: "table" }, h("table", { className: "enq-table" }, [
          h("thead", null, h("tr", null, ["Brand", "Channel", "Deal value", "Stage", "Received", "Quick stage update"].map((x) => h("th", { key: x }, x)))),
          h("tbody", null, rows.map((r) =>
            h("tr", { className: "enx-row", key: r.id, onClick: () => (window.location.href = `${state.urls.detail_prefix}${r.id}`) }, [
              h("td", null, [h("div", { className: "etd-brand" }, r.brand_name), h("div", { className: "etd-contact" }, r.contact_name || r.email)]),
              h("td", { className: "td-muted" }, r.platform),
              h("td", null, r.budget),
              h("td", null, h("span", { className: `status-pill pill-${r.status}` }, r.status_label)),
              h("td", { className: "td-time" }, r.created_at_fmt),
              h("td", { onClick: (e) => e.stopPropagation() }, h("select", { className: "quick-status-select", defaultValue: r.status, onChange: (e) => updateStatus(r.id, e.target.value) }, (state.statuses || []).map((s) => h("option", { key: s.key, value: s.key }, s.label)))),
            ])
          )),
        ]))
        : h("div", { className: "kanban-grid", key: "kanban" }, (state.statuses || []).map((s) =>
          h("div", { className: "kanban-col", key: s.key }, [
            h("div", { className: "kanban-head" }, [h("span", { className: "kanban-label", style: { color: s.color } }, s.label), h("span", { className: "kanban-count" }, String(rows.filter(r => r.status === s.key).length))]),
            h("div", { className: "kanban-body" }, rows.filter((r) => r.status === s.key).map((r) => h("a", { href: `${state.urls.detail_prefix}${r.id}`, className: "kanban-card", key: r.id }, [h("div", { className: "kc-brand" }, r.brand_name), h("div", { className: "kc-meta" }, `${r.platform} · ${r.budget}`)]))),
          ])
        )),
    ]);
  }

  const mounts = [
    ["landingState", "landingReactRoot", LandingApp],
    ["dashboardState", "dashboardReactRoot", DashboardApp],
    ["enquiriesState", "enquiriesReactRoot", EnquiriesApp],
  ];
  mounts.forEach(([stateId, rootId, Comp]) => {
    const state = parseState(stateId);
    const root = document.getElementById(rootId);
    if (state && root) ReactDOM.createRoot(root).render(h(Comp, { state }));
  });
})();
