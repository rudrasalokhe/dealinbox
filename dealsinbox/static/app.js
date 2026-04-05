const toast = (msg) => {
  const root = document.getElementById('toast-container');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await jsonFetch('/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd.entries())) });
    location.href = '/dashboard';
  } catch (err) { toast(err.message); }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await jsonFetch('/auth/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(fd.entries())) });
    location.href = '/dashboard';
  } catch (err) { toast(err.message); }
});

window.loadDashboard = async () => {
  try {
    const s = await jsonFetch('/api/dashboard/stats');
    mRevenue.textContent = currency(s.today_revenue); mOrders.textContent = s.today_orders;
    mAov.textContent = currency(s.avg_order_value); mMargin.textContent = `${s.gross_margin_pct}%`; mLow.textContent = s.low_stock_alerts;
    const line = await jsonFetch('/api/dashboard/sparkline');
    new Chart(document.getElementById('sparkline'), { type: 'line', data: { labels: line.map(x => x._id), datasets: [{ data: line.map(x => x.revenue), borderColor: '#2563EB', tension: 0.3 }] }, options: { plugins: { legend: { display: false } } } });
  } catch (e) { toast(e.message); }
};

let orderPage = 1;
window.loadOrders = async () => {
  const status = document.getElementById('statusFilter')?.value || '';
  const search = document.getElementById('searchOrder')?.value || '';
  try {
    const data = await jsonFetch(`/api/orders?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&page=${orderPage}`);
    const tbody = document.querySelector('#ordersTable tbody'); tbody.innerHTML = '';
    data.items.forEach(o => {
      tbody.insertAdjacentHTML('beforeend', `<tr><td>${o.order_number}</td><td>${o.customer_name}</td><td>${o.product_name}</td><td>${o.quantity}</td><td>${currency(o.quantity * o.selling_price)}</td><td><span class="badge ${o.status}">${o.status}</span></td></tr>`);
    });
    document.getElementById('ordersEmpty').style.display = data.items.length ? 'none' : 'block';
    document.getElementById('pageMeta').textContent = `${data.page}/${data.pages || 1}`;
  } catch (e) { toast(e.message); }
};

document.getElementById('statusFilter')?.addEventListener('change', () => { orderPage = 1; loadOrders(); });
document.getElementById('searchOrder')?.addEventListener('input', () => { orderPage = 1; loadOrders(); });
document.getElementById('prevPage')?.addEventListener('click', () => { if (orderPage > 1) { orderPage--; loadOrders(); } });
document.getElementById('nextPage')?.addEventListener('click', () => { orderPage++; loadOrders(); });
document.getElementById('exportCsv')?.addEventListener('click', () => { window.location = '/api/orders/export/csv'; });

window.loadInventory = async () => {
  try {
    const rows = await jsonFetch('/api/inventory');
    const tbody = document.querySelector('#inventoryTable tbody'); tbody.innerHTML = '';
    rows.forEach(p => {
      const low = Number(p.stock_count) <= Number(p.low_stock_threshold || 10);
      tbody.insertAdjacentHTML('beforeend', `<tr><td>${p.sku}</td><td>${p.name}</td><td>${p.category}</td><td>${currency(p.cost_price)}</td><td>${currency(p.selling_price)}</td><td class="${low ? 'low-stock' : ''}">${p.stock_count}${low ? ' ⚠' : ''}</td></tr>`);
    });
    document.getElementById('inventoryEmpty').style.display = rows.length ? 'none' : 'block';
  } catch (e) { toast(e.message); }
};

window.loadCustomers = async () => {
  try {
    const rows = await jsonFetch('/api/customers');
    const tbody = document.querySelector('#customersTable tbody'); tbody.innerHTML = '';
    rows.forEach(c => tbody.insertAdjacentHTML('beforeend', `<tr><td>${c.customer_name}</td><td>${c.customer_city || '-'}</td><td>${c.total_orders}</td><td>${currency(c.total_spend)}</td><td>${new Date(c.last_order_date).toLocaleDateString()}</td></tr>`));
    document.getElementById('customersEmpty').style.display = rows.length ? 'none' : 'block';
  } catch (e) { toast(e.message); }
};

document.getElementById('profitForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  try {
    const r = await jsonFetch('/api/profit/calculate', { method: 'POST', body: JSON.stringify(data) });
    rMargin.textContent = `${r.net_margin_pct}%`; rProfit.textContent = currency(r.profit_per_order);
    rBreak.textContent = r.break_even_units; rMonthly.textContent = currency(r.monthly_profit);
  } catch (err) { toast(err.message); }
});
