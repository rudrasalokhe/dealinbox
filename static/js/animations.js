(function () {
  function initReveal() {
    var els = document.querySelectorAll('.reveal-up');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { threshold: 0.06 });
    els.forEach(function (el, i) {
      el.style.transitionDelay = (i * 60) + 'ms';
      io.observe(el);
    });
  }

  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (!target) return;
      var start = null;
      var duration = 1200;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        var v = Math.floor(target * eased);
        el.textContent = v.toLocaleString('en-IN');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  function initKPIGlow() {
    document.querySelectorAll('.dbx-kpi, .kpi-card').forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 8px 30px rgba(79,110,247,.12)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
      });
    });
  }

  function init3DTilt() {
    if ('ontouchstart' in window || window.innerWidth < 768) return;
    var cards = document.querySelectorAll('.card-interactive, .lp-feature, .lp-test-card, .dbx-kpi, .hm-card, .lp-price-card');
    cards.forEach(function (card) {
      card.style.transition = 'transform 0.15s ease-out, box-shadow 0.15s ease-out, border-color 0.15s ease-out';
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -6;
        var rotateY = ((x - centerX) / centerX) * 6;
        card.style.transform = 'perspective(1000px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateZ(4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });
  }

  window.DealAnimations = { 
    initReveal: initReveal, 
    initCounters: initCounters,
    initKPIGlow: initKPIGlow,
    init3DTilt: init3DTilt
  };
})();
