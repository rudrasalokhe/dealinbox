document.addEventListener('DOMContentLoaded', function () {

  // ── Auto-dismiss flashes ───────────────────────────
  document.querySelectorAll('.flash').forEach(function (el) {
    setTimeout(function () {
      el.style.opacity = '0'; el.style.transform = 'translateX(16px)';
      el.style.transition = 'all .35s ease';
      setTimeout(function () { el.remove(); }, 350);
    }, 4500);
  });

  // ── Animate bar charts ─────────────────────────────
  document.querySelectorAll('.bc-bar').forEach(function (bar) {
    var h = bar.style.height; bar.style.height = '0';
    setTimeout(function () { bar.style.height = h; }, 150);
  });

  // ── Animate status breakdown bars ─────────────────
  document.querySelectorAll('.sb-bar').forEach(function (bar) {
    var w = bar.style.width; bar.style.width = '0';
    setTimeout(function () { bar.style.width = w; }, 200);
  });

  // ── Animate pipeline bar segments ─────────────────
  document.querySelectorAll('.pb-segment').forEach(function (seg, i) {
    var f = seg.style.flex; seg.style.flex = '0';
    setTimeout(function () { seg.style.flex = f; }, 100 + i * 60);
  });

  // ── Stagger card animations ────────────────────────
  var cards = document.querySelectorAll('.kpi-card, .feat-card, .price-card, .how-step, .mel-item');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 55);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  cards.forEach(function (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(14px)';
    card.style.transition = 'opacity .4s ease, transform .4s ease';
    obs.observe(card);
  });

  // ── Counter animation for KPI values ──────────────
  document.querySelectorAll('.kpi-value').forEach(function (el) {
    var text = el.textContent;
    var num  = parseInt(text.replace(/[^0-9]/g, ''));
    if (isNaN(num) || num === 0) return;
    var prefix = text.includes('₹') ? '₹' : '';
    var suffix = text.replace(/[₹0-9,]/g, '').trim();
    var start = null;
    function animate(ts) {
      if (!start) start = ts;
      var prog = Math.min((ts - start) / 800, 1);
      var ease = 1 - Math.pow(1 - prog, 3);
      var val  = Math.round(ease * num);
      el.textContent = prefix + val.toLocaleString('en-IN') + suffix;
      if (prog < 1) requestAnimationFrame(animate);
    }
    var cobs = new IntersectionObserver(function (ents) {
      if (ents[0].isIntersecting) { requestAnimationFrame(animate); cobs.disconnect(); }
    });
    cobs.observe(el);
  });

  // ── Ambient 3D scene motion ───────────────────────
  var scene = document.querySelector('.fx-scene');
  if (scene) {
    document.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 18;
      var y = (e.clientY / window.innerHeight - 0.5) * 18;
      scene.style.setProperty('--mx', x.toFixed(2) + 'deg');
      scene.style.setProperty('--my', y.toFixed(2) + 'deg');
    });
  }

  // ── Sidebar mobile toggle ──────────────────────────
  var toggleBtn = document.getElementById('sidebarToggle');
  var sidebar   = document.querySelector('.sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) && e.target !== toggleBtn) {
        sidebar.classList.remove('open');
      }
    });
  }

});

// ── Toast notification ─────────────────────────────
function showToast(msg) {
  var t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () {
    t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(8px)';
    t.style.transition = 'all .3s ease';
    setTimeout(function () { t.remove(); }, 300);
  }, 2500);
}
