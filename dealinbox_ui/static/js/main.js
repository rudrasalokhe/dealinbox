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

  // ── Three.js ambient background ───────────────────
  initThreeBackground();

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

function initThreeBackground() {
  var root = document.getElementById('three-bg');
  if (!root || !window.THREE) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 7);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  root.appendChild(renderer.domElement);

  var keyLight = new THREE.PointLight(0x84b5ff, 2.1, 40);
  keyLight.position.set(4, 3, 5);
  scene.add(keyLight);

  var rimLight = new THREE.PointLight(0x42e3cc, 1.8, 40);
  rimLight.position.set(-5, -4, 6);
  scene.add(rimLight);

  var ambient = new THREE.AmbientLight(0x4d6cb5, 0.45);
  scene.add(ambient);

  var knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.1, 0.24, 220, 22),
    new THREE.MeshStandardMaterial({ color: 0x6fa9ff, metalness: 0.5, roughness: 0.2 })
  );
  knot.position.set(-1.8, 0.1, -1.2);
  scene.add(knot);

  var crystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0x58e2cf,
      roughness: 0.15,
      metalness: 0.08,
      transmission: 0.15,
      thickness: 1.2
    })
  );
  crystal.position.set(2.2, -0.35, -1.8);
  scene.add(crystal);

  var field = new THREE.BufferGeometry();
  var pCount = 340;
  var pos = new Float32Array(pCount * 3);
  for (var i = 0; i < pCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
  }
  field.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var particles = new THREE.Points(
    field,
    new THREE.PointsMaterial({ color: 0x9ebfff, size: 0.03, transparent: true, opacity: 0.6 })
  );
  scene.add(particles);

  var mouseX = 0;
  var mouseY = 0;
  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.8;
  });

  var clock = new THREE.Clock();
  function animate() {
    var t = clock.getElapsedTime();
    knot.rotation.x = t * 0.22;
    knot.rotation.y = t * 0.45;
    crystal.rotation.x = -t * 0.18;
    crystal.rotation.y = -t * 0.3;
    particles.rotation.y = t * 0.02;

    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

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
