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
    return h("main", { className: "landing-v4" }, [
      h("section", { className: "lv4-hero", key: "hero" }, [
        h("div", { className: "lv4-copy" }, [
          h("span", { className: "lv4-chip" }, `${state.total}+ creators · ${state.enq_total}+ opportunities`),
          h("h1", null, "Run your creator business from inbound request to signed deal."),
          h("p", null, "DealInbox is a Creator Deal CRM built for influencers, managers, and agencies who want a professional collaboration pipeline—not chaos in DMs."),
          h("div", { className: "lv4-actions" }, [
            h("a", { href: state.urls.signup, className: "btn btn-primary btn-xl" }, "Start free"),
            h("a", { href: state.urls.login, className: "btn btn-lg" }, "See live workspace"),
          ]),
          h("div", { className: "lv4-proof" }, [
            h("article", null, [h("strong", null, "Pipeline visibility"), h("span", null, "Track every brand opportunity by stage")]),
            h("article", null, [h("strong", null, "Negotiation speed"), h("span", null, "Reply faster with context-rich deal records")]),
            h("article", null, [h("strong", null, "Earnings clarity"), h("span", null, "Monitor pipeline value and close momentum")]),
          ]),
        ]),
        h("div", { className: "lv4-preview" }, [
          h("header", null, [h("span"), h("span"), h("span"), h("p", null, "creator-hq")]),
          h("div", { className: "lv4-preview-body" }, [
            h("div", { className: "lv4-mini-kpis" }, [
              h("article", null, [h("small", null, "Pipeline Value"), h("strong", null, "₹5.2L")]),
              h("article", null, [h("small", null, "Active Negotiations"), h("strong", null, "8")]),
              h("article", null, [h("small", null, "Response Rate"), h("strong", null, "92%")]),
            ]),
            h("div", { className: "lv4-mini-list" }, [
              h("div", null, [h("b", null, "Beauty campaign"), h("span", null, "Negotiating")]),
              h("div", null, [h("b", null, "Travel reel package"), h("span", null, "Reviewing")]),
              h("div", null, [h("b", null, "Fintech collab"), h("span", null, "Accepted")]),
            ])
          ])
        ])
      ]),

      h("section", { className: "lv4-grid", key: "grid1" }, [
        h("article", { className: "lv4-card" }, [h("h3", null, "Capture"), h("p", null, "Create a polished public collab page and capture structured brand inquiries with budget, timeline, and deliverables.")]),
        h("article", { className: "lv4-card" }, [h("h3", null, "Convert"), h("p", null, "Move opportunities through clear deal stages with notes, reminders, and status visibility.")]),
        h("article", { className: "lv4-card" }, [h("h3", null, "Compound"), h("p", null, "Use creator earnings analytics to improve close rate and increase average deal value over time.")]),
      ]),

      h("section", { className: "lv4-compare", key: "compare" }, [
        h("div", null, [h("p", { className: "l-section-label" }, "Why it wins"), h("h2", null, "Built for creator deal operations, not generic forms.")]),
        h("div", { className: "lv4-compare-grid" }, [
          h("article", null, [h("h4", null, "Without DealInbox"), h("ul", null, [h("li", null, "Scattered DMs and inboxes"), h("li", null, "No deal stage clarity"), h("li", null, "Hard to track revenue pipeline")])]),
          h("article", null, [h("h4", null, "With DealInbox CreatorOS"), h("ul", null, [h("li", null, "Centralized collaboration workspace"), h("li", null, "Stage-based deal execution"), h("li", null, "Creator earnings and conversion visibility")])]),
        ])
      ]),

      h("section", { className: "lv4-pricing", key: "pricing" }, [
        h("h2", null, "Pricing built for creator growth"),
        h("div", { className: "lv4-pricing-grid" }, [
          h("article", null, [h("h3", null, "Starter"), h("p", { className: "price" }, ["₹0", h("span", null, "/month")]), h("ul", null, [h("li", null, "20 opportunities/mo"), h("li", null, "Deal pipeline"), h("li", null, "Public collab page")]), h("a", { href: state.urls.signup, className: "btn btn-full" }, "Create free workspace")]),
          h("article", { className: "featured" }, [h("em", null, "Creator Pro"), h("p", { className: "price" }, ["₹199", h("span", null, "/month")]), h("ul", null, [h("li", null, "Unlimited opportunities"), h("li", null, "Advanced analytics"), h("li", null, "Exports and premium workflows")]), h("a", { href: state.urls.signup, className: "btn btn-primary btn-full" }, "Upgrade to Pro")])
        ])
      ]),

      h("section", { className: "lv4-cta", key: "cta" }, [
        h("h2", null, "Creators who run systems close better deals."),
        h("p", null, "Start your Creator Deal CRM and make every brand inquiry count."),
        h("a", { href: state.urls.signup, className: "btn btn-primary btn-xl" }, "Start free now")
      ])
    ]);
  }

  function DashboardApp({ state }) {
    const stats = state.stats || {};
    const pipelineValue = Number(stats.total_val || 0);
    const avgValue = Number(stats.avg_value || 0);
    const activeNegotiations = Number((state.pipeline || []).find((p) => p.key === "negotiating")?.count || 0);
    const closed = Number(stats.accepted || 0);
    const due = (state.pending_tasks || []).length;
    const fresh = Number(stats.new_count || 0);

    const miniStat = (label, value) => h("article", { className: "hq-mini" }, [h("p", null, label), h("strong", null, value)]);

    return h("div", { className: "hq-layout" }, [
      h("section", { className: "hq-hero" }, [
        h("div", { className: "hq-hero-copy" }, [
          h("p", { className: "db-eyebrow" }, "Creator Business HQ"),
          h("h1", null, `Welcome back, ${(state.name || "Creator").split(" ")[0]}.`),
          h("p", { className: "page-sub" }, "Your collaboration engine is live. Review your pipeline, respond faster, and push active negotiations to signed deals."),
          h("div", { className: "hq-actions" }, [
            h("a", { className: "btn btn-primary", href: state.urls.enquiries }, "Open Brand Opportunities"),
            h("a", { className: "btn", href: state.urls.public_page, target: "_blank" }, "Open public collab page ↗"),
          ])
        ]),
        h("div", { className: "hq-hero-kpis" }, [
          miniStat("Pipeline Value", inr(pipelineValue)),
          miniStat("Active Negotiations", String(activeNegotiations)),
          miniStat("Response Time", state.avg_response_hours ? `${state.avg_response_hours}h` : "—"),
          miniStat("Follow-ups Due", String(due)),
        ])
      ]),

      h("section", { className: "hq-metrics" }, [
        h("article", { className: "hq-metric large" }, [h("p", null, "Estimated Pipeline Value"), h("h3", null, inr(pipelineValue)), h("span", null, avgValue ? `Avg deal ${inr(avgValue)}` : "Start closing deals to unlock avg value")]),
        h("article", { className: "hq-metric" }, [h("p", null, "Win Rate"), h("h3", null, `${stats.conversion || 0}%`), h("span", null, `${closed} signed collaborations`)]),
        h("article", { className: "hq-metric" }, [h("p", null, "New Opportunities"), h("h3", null, String(fresh)), h("span", null, "Needs fast response")]),
        h("article", { className: "hq-metric" }, [h("p", null, "Creator Earnings (est.)"), h("h3", null, inr(Math.round(pipelineValue * 0.35))), h("span", null, "Based on active pipeline")]),
      ]),

      h("div", { className: "hq-grid" }, [
        h("section", { className: "hq-panel" }, [
          h("header", null, [h("h2", null, "Deal Pipeline Board")]),
          h("div", { className: "hq-stage-grid" }, (state.pipeline || []).map((s) =>
            h("article", { className: "hq-stage", key: s.key }, [h("div", { className: "top" }, [h("i", { style: { background: s.color } }), h("span", null, s.label)]), h("strong", null, String(s.count || 0))])
          ))
        ]),

        h("section", { className: "hq-panel" }, [
          h("header", null, [h("h2", null, "Creator Onboarding Progress")]),
          h("div", { className: "hq-check" }, (state.checklist || []).map((item, i) => h("a", { href: item.link, key: i, className: `check-item ${item.done ? "done" : ""}` }, [h("span", null, item.done ? "✓" : "○"), h("div", null, item.title)])))
        ]),

        h("section", { className: "hq-panel" }, [
          h("header", null, [h("h2", null, "Recent Brand Activity")]),
          (state.recent || []).length
            ? h("div", { className: "hq-activity" }, (state.recent || []).map((r) => h("a", { className: "hq-row", href: `${state.urls.status_base}${r.id}`, key: r.id }, [h("strong", null, r.brand_name), h("span", null, `${r.status_label} · ${r.budget}`)])))
            : h("p", { className: "empty-small" }, "No recent opportunities yet.")
        ]),

        h("section", { className: "hq-panel" }, [
          h("header", null, [h("h2", null, "Daily Actions")]),
          h("div", { className: "hq-actions-list" }, [
            h("a", { href: state.urls.enquiries }, "Review high-priority opportunities"),
            h("a", { href: state.urls.settings }, "Update rates, bio, and response settings"),
            h("a", { href: state.urls.analytics_or_upgrade }, "Analyze creator earnings performance"),
          ]),
          !state.is_pro_user && h("div", { className: "hq-upsell" }, [h("p", null, `You've used ${state.enq_this_month}/${state.FREE_ENQUIRY_LIMIT} monthly opportunities.`), h("a", { href: state.urls.upgrade, className: "btn btn-primary btn-sm" }, "Upgrade to Pro")])
        ]),
      ])
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

    return h("div", { className: "op-layout" }, [
      h("section", { className: "op-head" }, [
        h("div", null, [h("h1", null, "Brand Opportunities"), h("p", { className: "page-sub" }, "Filter, qualify, and convert inbound collaborations with stage-level control.")]),
        h("div", { className: "op-head-actions" }, [
          h("div", { className: "view-toggle" }, [
            h("button", { className: `vt-btn ${view === "table" ? "active" : ""}`, onClick: () => setView("table") }, "Table"),
            h("button", { className: `vt-btn ${view === "kanban" ? "active" : ""}`, onClick: () => setView("kanban") }, "Pipeline"),
          ]),
          h("button", { className: "btn", onClick: exportCsv }, "Export CSV"),
        ])
      ]),

      h("section", { className: "op-toolbar" }, [
        h("input", { type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search brand, contact, email, campaign brief..." }),
        h("div", { className: "op-saved" }, [
          h("button", { className: `btn btn-sm ${saved === "high" ? "btn-primary" : ""}`, onClick: () => setSaved("high") }, `High Value (${state.saved_views?.high || 0})`),
          h("button", { className: `btn btn-sm ${saved === "new" ? "btn-primary" : ""}`, onClick: () => setSaved("new") }, `Needs Reply (${state.saved_views?.new || 0})`),
          h("button", { className: `btn btn-sm ${saved === "closing" ? "btn-primary" : ""}`, onClick: () => setSaved("closing") }, `Closing Soon (${state.saved_views?.closing || 0})`),
          h("button", { className: "btn btn-sm", onClick: () => setSaved("") }, "Clear"),
        ])
      ]),

      h("div", { className: "filter-tabs" }, [
        h("button", { className: `ft-tab ${!statusFilter ? "active" : ""}`, onClick: () => setStatusFilter("") }, ["All ", h("span", { className: "ft-count" }, String(state.counts?.all || 0))]),
        ...(state.statuses || []).map((s) => h("button", { key: s.key, className: `ft-tab ${statusFilter === s.key ? "active" : ""}`, onClick: () => setStatusFilter(s.key) }, [s.label, " ", h("span", { className: "ft-count" }, String(state.counts?.[s.key] || 0))]))
      ]),

      rows.length === 0
        ? h("div", { className: "premium-empty" }, [h("h3", null, "No opportunities in this view"), h("p", null, "Adjust filters or share your collab page to generate more inbound requests.")])
        : (view === "table"
          ? h("div", { className: "op-table-wrap" }, h("table", { className: "enq-table" }, [
              h("thead", null, h("tr", null, ["Brand", "Channel", "Deal Value", "Stage", "Received", "Quick Update"].map((x) => h("th", { key: x }, x)))),
              h("tbody", null, rows.map((r) => h("tr", { key: r.id, onClick: () => (window.location.href = `${state.urls.detail_prefix}${r.id}`), className: "enx-row" }, [
                h("td", null, [h("div", { className: "etd-brand" }, r.brand_name), h("div", { className: "etd-contact" }, r.contact_name || r.email)]),
                h("td", { className: "td-muted" }, r.platform),
                h("td", null, r.budget),
                h("td", null, h("span", { className: `status-pill pill-${r.status}` }, r.status_label)),
                h("td", { className: "td-time" }, r.created_at_fmt),
                h("td", { onClick: (e) => e.stopPropagation() }, h("select", { className: "quick-status-select", defaultValue: r.status, onChange: (e) => updateStatus(r.id, e.target.value) }, (state.statuses || []).map((s) => h("option", { key: s.key, value: s.key }, s.label))))
              ])))
            ]))
          : h("div", { className: "kanban-grid" }, (state.statuses || []).map((s) => h("div", { className: "kanban-col", key: s.key }, [
              h("div", { className: "kanban-head" }, [h("span", { className: "kanban-label", style: { color: s.color } }, s.label), h("span", { className: "kanban-count" }, String(rows.filter(r => r.status === s.key).length))]),
              h("div", { className: "kanban-body" }, rows.filter((r) => r.status === s.key).map((r) => h("a", { key: r.id, href: `${state.urls.detail_prefix}${r.id}`, className: "kanban-card" }, [h("div", { className: "kc-brand" }, r.brand_name), h("div", { className: "kc-meta" }, `${r.platform} · ${r.budget}`)])))
            ])))
        )
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
