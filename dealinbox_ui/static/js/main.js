document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sb-overlay');
  document.getElementById('menu-btn')?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
  });

  window.addEventListener('scroll', () => {
    document.querySelector('.pub-nav')?.classList.toggle('nav-scrolled', window.scrollY > 60);
  });

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  }), { threshold: 0.12 });
  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));

  setTimeout(() => {
    document.querySelectorAll('.flash').forEach(f => f.remove());
  }, 4000);

  // Keep Render instance warm while app is open.
  const ping = () => fetch('/ping', { method: 'GET', cache: 'no-store' }).catch(() => {});
  ping();
  setInterval(ping, 120000);
});

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'flash flash-success';
  t.innerHTML = `${msg}<button>×</button>`;
  t.querySelector('button').onclick = () => t.remove();
  const c = document.querySelector('.flash-container') || document.body;
  c.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
