(function () {
  if (!window.React || !window.ReactDOM) return;
  const h = React.createElement;

  function parseState(id) {
    const node = document.getElementById(id);
    if (!node) return null;
    try { return JSON.parse(node.textContent || "{}"); } catch (_) { return null; }
  }

  function currency(v) {
    const n = Number(v || 0);
    return `₹${n.toLocaleString("en-IN")}`;
  }

  function DashboardApp({ state }) {
    const stats = state.stats || {};
    const greeting = (state.name || "Creator").split(" ")[0];
    const card = (label, value, sub, cls) =>
      h("article", { className: `db-stat-card ${cls || ""}`.trim() }, [
        h("p", { key: "l" }, label),
        h("h3", { key: "v" }, value),
        h("span", { key: "s" }, sub),
      ]);

    return h("div", { className: "db-shell" }, [
      h("section", { className: "db-hero", key: "hero" }, [
        h("div", { key: "txt" }, [
          h("p", { className: "db-eyebrow", key: "e" }, "React Workspace"),
          h("h1", { key: "h" }, `Welcome back, ${greeting}.`),
          h("p", { className: "db-sub", key: "s" }, "Modernized dashboard running as React while preserving your Flask backend and workflows."),
        ]),
        h("div", { className: "db-hero-actions", key: "a" }, [
          h("a", { href: state.urls.public_page, target: "_blank", className: "btn", key: "p" }, "View public page ↗"),
          h("a", { href: state.urls.enquiries, className: "btn btn-primary", key: "e" }, "Open pipeline →"),
        ]),
      ]),
      h("section", { className: "db-stats-grid", key: "stats" }, [
        card("Pipeline value", currency(stats.total_val), stats.avg_value ? `Avg ${currency(stats.avg_value)}` : "Close deals to unlock average", "glow"),
        card("Conversion rate", `${stats.conversion || 0}%`, `${stats.accepted || 0} closed / ${stats.total || 0}`),
        card("New enquiries", String(stats.new_count || 0), stats.new_count ? "Needs attention" : "Inbox is clear"),
        h("article", { className: "db-stat-card", key: "pc" }, [
          h("p", { key: "pl" }, "Profile strength"),
          h("h3", { key: "pv" }, `${stats.profile_completion_pct || 0}%`),
          h("span", { key: "ps" }, h("a", { href: state.urls.settings }, "Improve profile →")),
          h("div", { className: "mini-progress", key: "pr" }, h("i", { style: { width: `${stats.profile_completion_pct || 0}%` } })),
        ]),
      ]),
      h("div", { className: "db-main-grid", key: "grid" }, [
        h("div", { className: "db-left-col", key: "left" }, [
          h("section", { className: "db-card", key: "pipe" }, [
            h("div", { className: "db-card-head", key: "head" }, [h("h2", { key: "h" }, "Pipeline by stage")]),
            h("div", { className: "db-stage-grid", key: "list" },
              (state.pipeline || []).map(s =>
                h("div", { className: "db-stage-item", key: s.key }, [
                  h("div", { className: "db-stage-top", key: "t" }, [h("span", { className: "dot", style: { background: s.color }, key: "d" }), s.label]),
                  h("strong", { key: "c" }, String(s.count || 0)),
                ])
              )
            ),
          ]),
          h("section", { className: "db-card", key: "recent" }, [
            h("div", { className: "db-card-head", key: "h" }, [h("h2", { key: "k" }, "Latest enquiries")]),
            (state.recent || []).length ? h("div", { className: "db-list", key: "rows" },
              state.recent.map(r => h("a", { href: `${state.urls.status_base}${r.id}`, className: "db-list-row", key: r.id }, [
                h("div", { key: "l" }, [h("h4", { key: "b" }, r.brand_name), h("p", { key: "p" }, `${r.platform} · ${r.budget}`)]),
                h("div", { className: "db-row-meta", key: "m" }, [h("span", { className: `pill pill-${r.status}`, key: "s" }, r.status_label), h("small", { key: "d" }, r.created_at_fmt)]),
              ]))
            ) : h("div", { className: "premium-empty", key: "e" }, [h("h3", { key: "h" }, "No enquiries yet"), h("p", { key: "p" }, "Share your page to start receiving inbound deals.")]),
          ]),
        ]),
        h("aside", { className: "db-right-col", key: "right" }, [
          h("section", { className: "db-card", key: "noti" }, [
            h("div", { className: "db-card-head", key: "h" }, [h("h2", { key: "k" }, "Notifications")]),
            (state.notifications || []).length
              ? h("div", { className: "db-mini-list", key: "n" }, state.notifications.map((n, i) => h("div", { className: "mini-row", key: i }, [h("strong", { key: "t" }, String(n.type || "").toUpperCase()), h("span", { key: "x" }, n.text || "")])))
              : h("p", { className: "empty-small", key: "e" }, "No urgent notifications right now."),
          ]),
          !state.is_pro_user && h("section", { className: "db-card upsell", key: "u" }, [
            h("p", { className: "upsell-tag", key: "t" }, "Pro growth"),
            h("h3", { key: "h" }, `Scale beyond ${state.FREE_ENQUIRY_LIMIT} enquiries/month`),
            h("p", { key: "p" }, `You have used ${state.enq_this_month} this month.`),
            h("a", { href: state.urls.upgrade, className: "btn btn-primary btn-full", key: "a" }, "Upgrade to Pro"),
          ]),
        ]),
      ]),
    ]);
  }

  function EnquiriesApp({ state }) {
    const [view, setView] = React.useState("table");
    const [query, setQuery] = React.useState("");
    const [saved, setSaved] = React.useState("");
    const rows = (state.enquiries || []).filter(r => {
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
    return h("div", { className: "enx-shell" }, [
      h("section", { className: "enx-head", key: "h" }, [
        h("div", { key: "l" }, [h("h1", { key: "t" }, "React Pipeline Workspace"), h("p", { className: "page-sub", key: "s" }, "Modern table + kanban experience backed by the same Flask routes.")]),
        h("div", { className: "enx-actions", key: "r" }, [
          h("div", { className: "view-toggle", key: "v" }, [
            h("button", { className: `vt-btn ${view === "table" ? "active" : ""}`, onClick: () => setView("table"), key: "tb" }, "Table"),
            h("button", { className: `vt-btn ${view === "kanban" ? "active" : ""}`, onClick: () => setView("kanban"), key: "kb" }, "Kanban"),
          ]),
        ]),
      ]),
      h("section", { className: "enx-toolbar db-card", key: "tb" }, [
        h("div", { className: "enx-search", key: "s" }, h("input", { type: "search", placeholder: "Search enquiries…", value: query, onChange: e => setQuery(e.target.value) })),
        h("div", { className: "enx-saved", key: "f" }, ["high", "new", "closing"].map(t => h("button", { className: "btn btn-sm", onClick: () => setSaved(t), key: t }, t))),
      ]),
      view === "table"
        ? h("div", { className: "enq-table-wrap premium-table-wrap", key: "table" }, h("table", { className: "enq-table" }, [
          h("thead", { key: "th" }, h("tr", null, ["Brand", "Platform", "Budget", "Status", "Received", "Quick update"].map(x => h("th", { key: x }, x)))),
          h("tbody", { key: "tb" }, rows.map(r => h("tr", { key: r.id, onClick: () => (window.location.href = `${state.urls.detail_prefix}${r.id}`), className: "enx-row" }, [
            h("td", { key: "b" }, [h("div", { className: "etd-brand", key: "n" }, r.brand_name), h("div", { className: "etd-contact", key: "c" }, r.contact_name || r.email)]),
            h("td", { key: "p", className: "td-muted" }, r.platform),
            h("td", { key: "bg" }, r.budget),
            h("td", { key: "s" }, h("span", { className: `status-pill pill-${r.status}` }, r.status_label)),
            h("td", { key: "d", className: "td-time" }, r.created_at_fmt),
            h("td", { key: "q", onClick: e => e.stopPropagation() }, h("select", { className: "quick-status-select", defaultValue: r.status, onChange: e => updateStatus(r.id, e.target.value) },
              (state.statuses || []).map(s => h("option", { value: s.key, key: s.key }, s.label))
            )),
          ]))),
        ]))
        : h("div", { className: "kanban-grid", key: "kb" }, (state.statuses || []).map(s =>
          h("div", { className: "kanban-col", key: s.key }, [
            h("div", { className: "kanban-head", key: "h" }, [h("span", { className: "kanban-label", style: { color: s.color }, key: "l" }, s.label), h("span", { className: "kanban-count", key: "c" }, String(rows.filter(r => r.status === s.key).length))]),
            h("div", { className: "kanban-body", key: "b" }, rows.filter(r => r.status === s.key).map(r => h("a", { href: `${state.urls.detail_prefix}${r.id}`, className: "kanban-card", key: r.id }, [h("div", { className: "kc-brand", key: "n" }, r.brand_name), h("div", { className: "kc-meta", key: "m" }, `${r.platform} · ${r.budget}`)]))),
          ])
        ),
    ]);
  }

  const dashboardState = parseState("dashboardState");
  const dashboardRoot = document.getElementById("dashboardReactRoot");
  if (dashboardState && dashboardRoot) {
    ReactDOM.createRoot(dashboardRoot).render(h(DashboardApp, { state: dashboardState }));
  }

  const enquiriesState = parseState("enquiriesState");
  const enquiriesRoot = document.getElementById("enquiriesReactRoot");
  if (enquiriesState && enquiriesRoot) {
    ReactDOM.createRoot(enquiriesRoot).render(h(EnquiriesApp, { state: enquiriesState }));
  }
})();
