document.addEventListener('DOMContentLoaded', function () {
  initFlash();
  initSidebar();
  initSceneByPage();
  if (window.DealAnimations) {
    window.DealAnimations.initReveal();
    window.DealAnimations.initCounters();
  }
});

function initSceneByPage() {
  var scene = document.body.dataset.scene || 'none';
  if (!window.DealScenes) return;

  if (scene === 'deal-cosmos') window.DealScenes.initDealCosmos();
  if (scene === 'pipeline-galaxy') {
    var data = window.DASHBOARD_DATA || {};
    window.DealScenes.initPipelineGalaxy(data);
  }
  if (scene === 'enquiry-grid') window.DealScenes.initGridLines();
  if (scene === 'brand-signal') window.DealScenes.initHelixSignal();
  if (scene === 'data-universe') {
    var analyticsData = window.ANALYTICS_3D_DATA || {};
    window.DealScenes.initDataUniverse(analyticsData);
  }
  if (scene === 'gold-rush') window.DealScenes.initGoldRush();
  if (scene === 'creator-aura') window.DealScenes.initCreatorAura();
  if (scene === 'signal-tracker') window.DealScenes.initSignalTracker();
}

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

function showToast(msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(8px)';
    setTimeout(function () { t.remove(); }, 300);
  }, 2200);
}
