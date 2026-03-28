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
          h("h1", { key: "title" }, "The premium Creator Deal CRM for serious creator businesses."),
          h("p", { key: "sub" }, "From inbound brand interest to negotiation, follow-up, and signed campaigns—run your creator revenue operations in one polished workspace."),
          h("div", { className: "hero-actions", key: "actions" }, [
            h("a", { href: state.urls.signup, className: "btn btn-primary btn-xl", key: "signup" }, "Start free creator workspace"),
            h("a", { href: state.urls.login, className: "btn btn-lg", key: "login" }, "See my deal HQ"),
          ]),
          h("div", { className: "hero-proof-row", key: "proof" }, [
            h("div", null, [h("strong", null, "Faster replies"), h("span", null, "Turn response speed into higher close rates")]),
            h("div", null, [h("strong", null, "Pipeline clarity"), h("span", null, "Never lose high-value collab opportunities")]),
            h("div", null, [h("strong", null, "Revenue visibility"), h("span", null, "Track projected earnings by stage")]),
          ]),
        ]),
        h("div", { className: "hero-v2-preview", key: "preview" }, [
          h("div", { className: "hp-head", key: "head" }, [h("span", { key: 1 }), h("span", { key: 2 }), h("span", { key: 3 }), h("p", { key: 4 }, "creator-hq/deal-pipeline")]),
          h("div", { className: "hp-body", key: "body" }, [
            h("div", { className: "hp-kpis", key: "kpis" }, [
              h("article", { key: "k1" }, [h("small", null, "Pipeline value"), h("strong", null, "₹4,80,000")]),
              h("article", { key: "k2" }, [h("small", null, "Response rate"), h("strong", null, "93%")]),
              h("article", { key: "k3" }, [h("small", null, "Active deals"), h("strong", null, "12")]),
            ]),
            h("div", { className: "hp-list", key: "list" }, [
              h("div", null, [h("b", null, "Skincare launch campaign"), h("span", null, "Negotiating · ₹90k")]),
              h("div", null, [h("b", null, "Travel mini-series"), h("span", null, "Reviewing · Brief received")]),
              h("div", null, [h("b", null, "Fintech awareness collab"), h("span", null, "Accepted · Starts next week")]),
            ]),
          ]),
        ]),
      ]),
      h("section", { className: "logo-strip", key: "trust" }, [
        h("p", null, "Built for creators, managers, and agencies"),
        h("div", null, [
          h("span", null, "Creator Deal CRM"),
          h("span", null, "Brand Collaboration Inbox"),
          h("span", null, "Negotiation Workflow"),
          h("span", null, "Creator Earnings Analytics"),
        ]),
      ]),
      h("section", { className: "features-v2", key: "f" }, [
        h("header", null, [h("p", { className: "l-section-label" }, "Value proposition"), h("h2", null, "Run your creator business like a high-performing sales pipeline.")]),
        h("div", { className: "f2-grid" }, [
          h("article", null, [h("h3", null, "Brand opportunity capture"), h("p", null, "Collect campaign details, budget, platform, and deliverables in a structured intake instead of fragmented DMs.")]),
          h("article", null, [h("h3", null, "Deal stage execution"), h("p", null, "Move opportunities from new → reviewing → negotiating → signed with clear ownership and timeline context.")]),
          h("article", null, [h("h3", null, "Retention + growth loops"), h("p", null, "Follow-ups, reminders, and insights keep creators returning daily to close more and miss less.")]),
        ]),
      ]),
      h("section", { className: "workflow-v2", key: "problem" }, [
        h("header", null, [h("p", { className: "l-section-label" }, "How it works"), h("h2", null, "A complete creator collaboration operating workflow.")]),
        h("div", { className: "wf-grid" }, [
          h("article", null, [h("span", null, "01"), h("h3", null, "Capture"), h("p", null, "Share your collab page and capture serious inbound brand requests.")]),
          h("article", null, [h("span", null, "02"), h("h3", null, "Convert"), h("p", null, "Prioritize urgent/high-value deals and reply faster with better context.")]),
          h("article", null, [h("span", null, "03"), h("h3", null, "Compound"), h("p", null, "Track earnings and close-rate trends to improve month-over-month." )]),
        ]),
      ]),
      h("section", { className: "pricing-v2", key: "proof" }, [
        h("header", null, [h("p", { className: "l-section-label" }, "Monetization-ready"), h("h2", null, "Pricing tiers designed for creators at every growth stage.")]),
        h("div", { className: "pv2-cards" }, [
          h("article", { className: "pv2-card" }, [
            h("h3", null, "Starter"),
            h("p", { className: "pv2-price" }, ["₹0", h("span", null, "/month")]),
            h("ul", null, [
              h("li", null, "Professional collaboration page"),
              h("li", null, "Deal pipeline workspace"),
              h("li", null, "Brand status sharing"),
              h("li", null, "20 opportunities/month"),
            ]),
            h("a", { href: state.urls.signup, className: "btn btn-full" }, "Start free"),
          ]),
          h("article", { className: "pv2-card featured" }, [
            h("span", { className: "tag" }, "Best value"),
            h("h3", null, "Creator Pro"),
            h("p", { className: "pv2-price" }, ["₹199", h("span", null, "/month")]),
            h("ul", null, [
              h("li", null, "Unlimited opportunities + exports"),
              h("li", null, "Advanced earnings analytics"),
              h("li", null, "Reminder + follow-up workflows"),
              h("li", null, "Priority support"),
            ]),
            h("a", { href: state.urls.signup, className: "btn btn-primary btn-full" }, "Upgrade to Creator Pro"),
          ]),
        ]),
      ]),
      h("section", { className: "cta-v2", key: "cta" }, [
        h("h2", null, "Creators who operate like businesses close better deals."),
        h("p", null, "Build your daily collaboration workflow and make every brand inquiry count."),
        h("a", { href: state.urls.signup, className: "btn btn-primary btn-xl" }, "Create creator business HQ"),
      ]),
    ]);
  }

  function DashboardApp({ state }) {
    const stats = state.stats || {};
    const greeting = (state.name || "Creator").split(" ")[0];
    const pipelineValue = Number(stats.total_val || 0);
    const avgValue = Number(stats.avg_value || 0);
    const conversion = Number(stats.conversion || 0);
    const responseRate = state.avg_response_hours ? Math.max(35, Math.round(100 - Math.min(65, state.avg_response_hours))) : null;
    const monthlyEarnings = Math.round(pipelineValue * 0.35);
    const doneChecklist = (state.checklist || []).filter((i) => i.done).length;
    const checklistPct = (state.checklist || []).length ? Math.round((doneChecklist / state.checklist.length) * 100) : 0;
    const activeNegotiations = Number((state.pipeline || []).find((s) => s.key === "negotiating")?.count || 0);
    const signedDeals = Number(stats.accepted || 0);
    const newOpps = Number(stats.new_count || 0);

    const metricCard = (label, value, sub, cls) => h("article", { className: `db-stat-card ${cls || ""}`.trim() }, [h("p", null, label), h("h3", null, value), h("span", null, sub)]);

    return h("div", { className: "db-shell" }, [
      h("section", { className: "db-hero db-hero-premium", key: "hero" }, [
        h("div", { className: "db-hero-left" }, [
          h("p", { className: "db-eyebrow" }, "Creator Business Control Center"),
          h("h1", null, `Welcome back, ${greeting}.`),
          h("p", { className: "db-sub" }, "Your pipeline, negotiations, follow-ups, and earnings visibility are centralized here so you can run your creator business with confidence."),
          h("div", { className: "db-hero-actions" }, [
            h("a", { href: state.urls.enquiries, className: "btn btn-primary" }, "Open deal pipeline →"),
            h("a", { href: state.urls.public_page, target: "_blank", className: "btn" }, "Open collab intake page ↗"),
          ]),
        ]),
        h("div", { className: "db-hero-pulse" }, [
          h("h4", null, "Today’s pipeline pulse"),
          h("div", { className: "pulse-row" }, [h("span", null, "New opportunities"), h("strong", null, String(newOpps))]),
          h("div", { className: "pulse-row" }, [h("span", null, "Active negotiations"), h("strong", null, String(activeNegotiations))]),
          h("div", { className: "pulse-row" }, [h("span", null, "Signed collaborations"), h("strong", null, String(signedDeals))]),
          h("div", { className: "pulse-row" }, [h("span", null, "Pipeline value"), h("strong", null, inr(pipelineValue))]),
        ]),
      ]),

      h("section", { className: "db-stats-grid db-stats-grid-premium", key: "stats" }, [
        metricCard("Estimated pipeline value", inr(pipelineValue), avgValue ? `Average deal ${inr(avgValue)}` : "Close more deals to unlock trend", "glow"),
        metricCard("Monthly earnings (est.)", inr(monthlyEarnings), "Projected from active pipeline"),
        metricCard("Win rate", `${conversion}%`, `${signedDeals} signed / ${stats.total || 0} total`),
        metricCard("Response rate", responseRate ? `${responseRate}%` : "—", state.avg_response_hours ? `${state.avg_response_hours}h avg response` : "Need more response data"),
      ]),

      h("div", { className: "db-main-grid", key: "grid" }, [
        h("div", { className: "db-left-col" }, [
          h("section", { className: "db-card" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Deal pipeline by stage")]),
            h("div", { className: "db-stage-grid" }, (state.pipeline || []).map((s) =>
              h("div", { className: "db-stage-item", key: s.key }, [
                h("div", { className: "db-stage-top" }, [h("span", { className: "dot", style: { background: s.color } }), s.label]),
                h("strong", null, String(s.count || 0)),
              ])
            )),
          ]),

          h("section", { className: "db-card" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Recent brand activity")]),
            (state.recent || []).length
              ? h("div", { className: "db-list" }, (state.recent || []).map((r) =>
                  h("a", { href: `${state.urls.status_base}${r.id}`, className: "db-list-row", key: r.id }, [
                    h("div", null, [h("h4", null, r.brand_name), h("p", null, `${r.platform} · ${r.budget}`)]),
                    h("div", { className: "db-row-meta" }, [h("span", { className: `pill pill-${r.status}` }, r.status_label), h("small", null, r.created_at_fmt)]),
                  ])
                ))
              : h("div", { className: "premium-empty" }, [h("h3", null, "No brand opportunities yet"), h("p", null, "Share your collaboration link and capture your first inbound campaign.")]),
          ]),

          h("section", { className: "db-card" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Activity feed")]),
            (state.activity || []).length
              ? h("div", { className: "timeline" }, (state.activity || []).map((a, i) => h("div", { className: "tl-item", key: i }, [h("i"), h("div", null, [h("h5", null, a.action), a.detail ? h("p", null, a.detail) : null, h("small", null, a.created_at_fmt)])])))
              : h("p", { className: "empty-small" }, "No recent activity yet."),
          ]),
        ]),

        h("aside", { className: "db-right-col" }, [
          h("section", { className: "db-card" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Onboarding progress")]),
            h("div", { className: "onboarding-progress" }, [
              h("div", { className: "onboarding-top" }, [h("strong", null, `${checklistPct}% complete`), h("span", null, `${doneChecklist}/${(state.checklist || []).length} steps done`)]),
              h("div", { className: "mini-progress" }, h("i", { style: { width: `${checklistPct}%` } })),
            ]),
            h("div", { className: "checklist" }, (state.checklist || []).map((item, i) => h("a", { href: item.link, className: `check-item ${item.done ? "done" : ""}`.trim(), key: i }, [h("span", null, item.done ? "✓" : "○"), h("div", null, item.title)]))),
          ]),

          h("section", { className: "db-card" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Pending follow-ups")]),
            (state.pending_tasks || []).length
              ? h("div", { className: "db-mini-list" }, (state.pending_tasks || []).map((r) => h("a", { href: `${state.urls.status_base}${r.id}`, className: "mini-row", key: r.id }, [h("strong", null, r.brand_name), h("span", null, `Due ${r.reminder_due_fmt}`)])))
              : h("p", { className: "empty-small" }, "No follow-ups due this week."),
          ]),

          h("section", { className: "db-card" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Notifications center")]),
            (state.notifications || []).length
              ? h("div", { className: "db-mini-list" }, (state.notifications || []).map((n, i) => h("div", { className: "mini-row", key: i }, [h("strong", null, String(n.type || "").toUpperCase()), h("span", null, n.text || "")])))
              : h("p", { className: "empty-small" }, "No urgent notifications."),
          ]),

          h("section", { className: "db-card quick-actions" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Daily quick actions")]),
            h("a", { className: "qa-btn", href: state.urls.enquiries }, "Review unresponsive opportunities"),
            h("a", { className: "qa-btn", href: state.urls.settings }, "Update rates and profile positioning"),
            h("a", { className: "qa-btn", href: state.urls.analytics_or_upgrade }, "Check earnings performance"),
          ]),

          !state.is_pro_user && h("section", { className: "db-card upsell" }, [
            h("p", { className: "upsell-tag" }, "Growth unlock"),
            h("h3", null, "Upgrade before you hit your monthly limit"),
            h("p", null, `You've used ${state.enq_this_month}/${state.FREE_ENQUIRY_LIMIT} opportunities this month.`),
            h("a", { href: state.urls.upgrade, className: "btn btn-primary btn-full" }, "Unlock Creator Pro"),
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
      h("section", { className: "enx-head" }, [
        h("div", null, [h("h1", null, "Brand Opportunity Workspace"), h("p", { className: "page-sub" }, "Search, qualify, negotiate, and close every collaboration opportunity from one place.")]),
        h("div", { className: "enx-actions" }, [
          h("div", { className: "view-toggle" }, [
            h("button", { className: `vt-btn ${view === "table" ? "active" : ""}`, onClick: () => setView("table") }, "Table"),
            h("button", { className: `vt-btn ${view === "kanban" ? "active" : ""}`, onClick: () => setView("kanban") }, "Pipeline"),
          ]),
          h("button", { className: "btn", onClick: exportCsv }, "Export"),
        ]),
      ]),

      h("section", { className: "db-card enx-highlight" }, [
        h("strong", null, "Power workflow"),
        h("p", null, "Use saved views daily: high-value, needs reply, and closing soon to prioritize revenue-first actions."),
      ]),

      h("section", { className: "enx-toolbar db-card" }, [
        h("div", { className: "enx-search" }, h("input", { type: "search", placeholder: "Search brand, campaign, contact, or brief…", value: query, onChange: (e) => setQuery(e.target.value) })),
        h("div", { className: "enx-saved" }, [
          h("button", { className: `btn btn-sm ${saved === "high" ? "btn-primary" : ""}`, onClick: () => setSaved("high") }, `High value (${state.saved_views?.high || 0})`),
          h("button", { className: `btn btn-sm ${saved === "new" ? "btn-primary" : ""}`, onClick: () => setSaved("new") }, `Needs reply (${state.saved_views?.new || 0})`),
          h("button", { className: `btn btn-sm ${saved === "closing" ? "btn-primary" : ""}`, onClick: () => setSaved("closing") }, `Closing soon (${state.saved_views?.closing || 0})`),
          h("button", { className: "btn btn-sm", onClick: () => setSaved("") }, "Clear"),
        ]),
      ]),

      h("div", { className: "filter-tabs" }, [
        h("button", { className: `ft-tab ${!statusFilter ? "active" : ""}`, onClick: () => setStatusFilter("") }, ["All opportunities ", h("span", { className: "ft-count" }, String(state.counts?.all || 0))]),
        ...(state.statuses || []).map((s) => h("button", { className: `ft-tab ${statusFilter === s.key ? "active" : ""}`, onClick: () => setStatusFilter(s.key), key: s.key }, [s.label, " ", h("span", { className: "ft-count" }, String(state.counts?.[s.key] || 0))])),
      ]),

      rows.length === 0
        ? h("div", { className: "premium-empty" }, [h("h3", null, "No opportunities match this view"), h("p", null, "Try clearing filters or share your collab page to attract new brand requests.")])
        : view === "table"
          ? h("div", { className: "enq-table-wrap premium-table-wrap" }, h("table", { className: "enq-table" }, [
              h("thead", null, h("tr", null, ["Brand", "Channel", "Deal value", "Stage", "Received", "Quick stage update"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, rows.map((r) => h("tr", { className: "enx-row", key: r.id, onClick: () => (window.location.href = `${state.urls.detail_prefix}${r.id}`) }, [
                h("td", null, [h("div", { className: "etd-brand" }, r.brand_name), h("div", { className: "etd-contact" }, r.contact_name || r.email)]),
                h("td", { className: "td-muted" }, r.platform),
                h("td", null, r.budget),
                h("td", null, h("span", { className: `status-pill pill-${r.status}` }, r.status_label)),
                h("td", { className: "td-time" }, r.created_at_fmt),
                h("td", { onClick: (e) => e.stopPropagation() }, h("select", { className: "quick-status-select", defaultValue: r.status, onChange: (e) => updateStatus(r.id, e.target.value) }, (state.statuses || []).map((s) => h("option", { key: s.key, value: s.key }, s.label)))),
              ]))),
            ]))
          : h("div", { className: "kanban-grid" }, (state.statuses || []).map((s) => h("div", { className: "kanban-col", key: s.key }, [
              h("div", { className: "kanban-head" }, [h("span", { className: "kanban-label", style: { color: s.color } }, s.label), h("span", { className: "kanban-count" }, String(rows.filter(r => r.status === s.key).length))]),
              h("div", { className: "kanban-body" }, rows.filter((r) => r.status === s.key).map((r) => h("a", { href: `${state.urls.detail_prefix}${r.id}`, className: "kanban-card", key: r.id }, [h("div", { className: "kc-brand" }, r.brand_name), h("div", { className: "kc-meta" }, `${r.platform} · ${r.budget}`)]))),
            ]))),
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
