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
          h("span", { className: "hero-chip", key: "chip" }, `${state.total}+ creators · ${state.enq_total}+ enquiries handled`),
          h("h1", { key: "title" }, "The premium operating system for creator-brand deals."),
          h("p", { key: "sub" }, "React-powered product experience with the same trusted Flask backend and workflows."),
          h("div", { className: "hero-actions", key: "actions" }, [
            h("a", { href: state.urls.signup, className: "btn btn-primary btn-xl", key: "signup" }, "Create my DealInbox"),
            h("a", { href: state.urls.login, className: "btn btn-lg", key: "login" }, "Log in"),
          ]),
        ]),
        h("div", { className: "hero-v2-preview", key: "preview" }, [
          h("div", { className: "hp-head", key: "head" }, [h("span", { key: 1 }), h("span", { key: 2 }), h("span", { key: 3 }), h("p", { key: 4 }, "dealinbox.in/dashboard")]),
          h("div", { className: "hp-body", key: "body" }, [
            h("div", { className: "hp-kpis", key: "kpis" }, [
              h("article", { key: "k1" }, [h("small", null, "Pipeline value"), h("strong", null, "₹2,45,000")]),
              h("article", { key: "k2" }, [h("small", null, "Conversion"), h("strong", null, "38%")]),
              h("article", { key: "k3" }, [h("small", null, "Needs response"), h("strong", null, "6")]),
            ]),
          ]),
        ]),
      ]),
    ]);
  }

  function DashboardApp({ state }) {
    const stats = state.stats || {};
    const greeting = (state.name || "Creator").split(" ")[0];
    const card = (label, value, sub, cls) =>
      h("article", { className: `db-stat-card ${cls || ""}`.trim() }, [h("p", { key: "l" }, label), h("h3", { key: "v" }, value), h("span", { key: "s" }, sub)]);

    return h("div", { className: "db-shell" }, [
      h("section", { className: "db-hero", key: "hero" }, [
        h("div", { key: "txt" }, [
          h("p", { className: "db-eyebrow", key: "e" }, "React Control Center"),
          h("h1", { key: "h" }, `Welcome back, ${greeting}.`),
          h("p", { className: "db-sub", key: "s" }, "Component-based dashboard UI while preserving your existing Flask endpoints and business flows."),
        ]),
        h("div", { className: "db-hero-actions", key: "a" }, [
          h("a", { href: state.urls.public_page, target: "_blank", className: "btn", key: "p" }, "View public page ↗"),
          h("a", { href: state.urls.enquiries, className: "btn btn-primary", key: "e" }, "Open pipeline →"),
        ]),
      ]),
      h("section", { className: "db-stats-grid", key: "stats" }, [
        card("Pipeline value", inr(stats.total_val), stats.avg_value ? `Avg ${inr(stats.avg_value)}` : "Close deals to unlock average", "glow"),
        card("Conversion rate", `${stats.conversion || 0}%`, `${stats.accepted || 0} closed / ${stats.total || 0}`),
        card("New enquiries", String(stats.new_count || 0), stats.new_count ? "Needs attention" : "Inbox is clear"),
        h("article", { className: "db-stat-card", key: "profile" }, [
          h("p", { key: "pl" }, "Profile strength"),
          h("h3", { key: "pv" }, `${stats.profile_completion_pct || 0}%`),
          h("span", { key: "ps" }, h("a", { href: state.urls.settings }, "Improve profile →")),
          h("div", { className: "mini-progress", key: "pr" }, h("i", { style: { width: `${stats.profile_completion_pct || 0}%` } })),
        ]),
      ]),
      h("div", { className: "db-main-grid", key: "grid" }, [
        h("div", { className: "db-left-col", key: "left" }, [
          h("section", { className: "db-card", key: "pipeline" }, [
            h("div", { className: "db-card-head", key: "ph" }, [h("h2", null, "Pipeline by stage")]),
            h("div", { className: "db-stage-grid", key: "ps" }, (state.pipeline || []).map(s =>
              h("div", { className: "db-stage-item", key: s.key }, [h("div", { className: "db-stage-top", key: "t" }, [h("span", { className: "dot", style: { background: s.color }, key: "d" }), s.label]), h("strong", { key: "c" }, String(s.count || 0))])
            )),
          ]),
          h("section", { className: "db-card", key: "recent" }, [
            h("div", { className: "db-card-head", key: "rh" }, [h("h2", null, "Latest enquiries")]),
            (state.recent || []).length
              ? h("div", { className: "db-list", key: "r" }, (state.recent || []).map(r =>
                  h("a", { href: `${state.urls.status_base}${r.id}`, className: "db-list-row", key: r.id }, [
                    h("div", null, [h("h4", null, r.brand_name), h("p", null, `${r.platform} · ${r.budget}`)]),
                    h("div", { className: "db-row-meta" }, [h("span", { className: `pill pill-${r.status}` }, r.status_label), h("small", null, r.created_at_fmt)]),
                  ])
                ))
              : h("div", { className: "premium-empty", key: "empty" }, [h("h3", null, "No enquiries yet"), h("p", null, "Share your page to receive inbound requests.")]),
          ]),
          h("section", { className: "db-card", key: "activity" }, [
            h("div", { className: "db-card-head", key: "ah" }, [h("h2", null, "Activity timeline")]),
            (state.activity || []).length
              ? h("div", { className: "timeline", key: "al" }, (state.activity || []).map((a, i) =>
                  h("div", { className: "tl-item", key: i }, [h("i"), h("div", null, [h("h5", null, a.action), a.detail ? h("p", null, a.detail) : null, h("small", null, a.created_at_fmt)])])
                ))
              : h("p", { className: "empty-small" }, "No recent activity yet."),
          ]),
        ]),
        h("aside", { className: "db-right-col", key: "right" }, [
          h("section", { className: "db-card", key: "check" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Onboarding checklist")]),
            h("div", { className: "checklist" }, (state.checklist || []).map((item, i) =>
              h("a", { href: item.link, className: `check-item ${item.done ? "done" : ""}`.trim(), key: i }, [h("span", null, item.done ? "✓" : "○"), h("div", null, item.title)])
            )),
          ]),
          h("section", { className: "db-card", key: "rem" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Upcoming reminders")]),
            (state.pending_tasks || []).length
              ? h("div", { className: "db-mini-list" }, (state.pending_tasks || []).map(r => h("a", { href: `${state.urls.status_base}${r.id}`, className: "mini-row", key: r.id }, [h("strong", null, r.brand_name), h("span", null, `Due ${r.reminder_due_fmt}`)])))
              : h("p", { className: "empty-small" }, "No reminders due in next 7 days."),
          ]),
          h("section", { className: "db-card", key: "noti" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Notifications")]),
            (state.notifications || []).length
              ? h("div", { className: "db-mini-list" }, (state.notifications || []).map((n, i) => h("div", { className: "mini-row", key: i }, [h("strong", null, String(n.type || "").toUpperCase()), h("span", null, n.text || "")])))
              : h("p", { className: "empty-small" }, "No urgent notifications right now."),
          ]),
          h("section", { className: "db-card quick-actions", key: "quick" }, [
            h("div", { className: "db-card-head" }, [h("h2", null, "Quick actions")]),
            h("a", { className: "qa-btn", href: state.urls.enquiries }, "Open enquiry board"),
            h("a", { className: "qa-btn", href: state.urls.analytics_or_upgrade }, "Open analytics"),
            h("a", { className: "qa-btn", href: state.urls.settings }, "Update profile"),
          ]),
          !state.is_pro_user && h("section", { className: "db-card upsell", key: "upsell" }, [
            h("p", { className: "upsell-tag" }, "Pro growth"),
            h("h3", null, `Scale beyond ${state.FREE_ENQUIRY_LIMIT} enquiries/month`),
            h("p", null, `You have used ${state.enq_this_month} this month.`),
            h("a", { href: state.urls.upgrade, className: "btn btn-primary btn-full" }, "Upgrade to Pro"),
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
      a.download = "enquiries.csv";
      a.click();
    }

    return h("div", { className: "enx-shell" }, [
      h("section", { className: "enx-head", key: "head" }, [
        h("div", null, [h("h1", null, "React Pipeline Workspace"), h("p", { className: "page-sub" }, "Reusable React components with existing backend APIs.")]),
        h("div", { className: "enx-actions" }, [
          h("div", { className: "view-toggle" }, [
            h("button", { className: `vt-btn ${view === "table" ? "active" : ""}`, onClick: () => setView("table") }, "Table"),
            h("button", { className: `vt-btn ${view === "kanban" ? "active" : ""}`, onClick: () => setView("kanban") }, "Kanban"),
          ]),
          h("button", { className: "btn", onClick: exportCsv }, "Export"),
        ]),
      ]),
      h("section", { className: "enx-toolbar db-card", key: "toolbar" }, [
        h("div", { className: "enx-search" }, h("input", { type: "search", placeholder: "Search brand, contact, email, or brief…", value: query, onChange: (e) => setQuery(e.target.value) })),
        h("div", { className: "enx-saved" }, [
          h("button", { className: "btn btn-sm", onClick: () => setSaved("high") }, "High value"),
          h("button", { className: "btn btn-sm", onClick: () => setSaved("new") }, "Needs response"),
          h("button", { className: "btn btn-sm", onClick: () => setSaved("closing") }, "Closing soon"),
        ]),
      ]),
      h("div", { className: "filter-tabs", key: "tabs" }, [
        h("button", { className: `ft-tab ${!statusFilter ? "active" : ""}`, onClick: () => setStatusFilter("") }, ["All ", h("span", { className: "ft-count" }, String(state.counts?.all || 0))]),
        ...(state.statuses || []).map((s) =>
          h("button", { className: `ft-tab ${statusFilter === s.key ? "active" : ""}`, onClick: () => setStatusFilter(s.key), key: s.key }, [s.label, " ", h("span", { className: "ft-count" }, String(state.counts?.[s.key] || 0))])
        ),
      ]),
      view === "table"
        ? h("div", { className: "enq-table-wrap premium-table-wrap", key: "table" }, h("table", { className: "enq-table" }, [
          h("thead", null, h("tr", null, ["Brand", "Platform", "Budget", "Status", "Received", "Quick update"].map((x) => h("th", { key: x }, x)))),
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
