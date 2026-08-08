document.addEventListener('DOMContentLoaded', function () {
  initFlash();
  initSidebar();
  initGrain();
  if (window.DealAnimations) {
    window.DealAnimations.initReveal();
    window.DealAnimations.initCounters();
    window.DealAnimations.initKPIGlow();
    window.DealAnimations.init3DTilt();
  }
});

function initFlash() {
  document.querySelectorAll('.flash').forEach(function (el) {
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(16px)';
      setTimeout(function () { el.remove(); }, 350);
    }, 4000);
  });
}

function initSidebar() {
  var toggleBtn = document.getElementById('sidebarToggle');
  var sidebar = document.querySelector('.sidebar');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });

  document.addEventListener('click', function (e) {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
      sidebar.classList.remove('open');
    }
  });
}

function initGrain() {
  if (document.querySelector('.grain-overlay')) return;
  var grain = document.createElement('div');
  grain.className = 'grain-overlay';
  grain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(grain);
}

function showToast(msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function () { t.classList.add('show'); });
  setTimeout(function () {
    t.classList.remove('show');
    setTimeout(function () { t.remove(); }, 300);
  }, 2200);
}

// ── Password visibility toggle ──────────────────────────────────────────────
function togglePassword(inputId, btn) {
  var input = document.getElementById(inputId);
  if (!input) return;
  var isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  var eyeOpen = btn.querySelector('.eye-open');
  var eyeClosed = btn.querySelector('.eye-closed');
  if (eyeOpen && eyeClosed) {
    eyeOpen.style.display = isPassword ? 'none' : 'block';
    eyeClosed.style.display = isPassword ? 'block' : 'none';
  }
}

