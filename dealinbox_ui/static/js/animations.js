(function () {
  function initReveal() {
    var els = document.querySelectorAll('.reveal-up');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { threshold: 0.08 });
    els.forEach(function (el, i) {
      el.style.transitionDelay = (i * 45) + 'ms';
      io.observe(el);
    });
  }

  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (!target) return;
      var start = null;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1000, 1);
        var v = Math.floor(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = v.toLocaleString('en-IN');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  window.DealAnimations = { initReveal: initReveal, initCounters: initCounters };
})();
