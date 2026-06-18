// ===== Click to set off a mini neutron-star burst =====
// No follower. Each click flashes a white core, a shockwave ring, and a spray
// of radiating sparks. Theme-aware, pointer-events none, off under reduced-motion.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'sparkle-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50;';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function palette() {
    var th = document.documentElement.getAttribute('data-theme');
    if (th === 'disco') return { sparks: ['#ff2d95', '#00ffd5', '#ffffff'] };
    if (th === 'dark') return { sparks: ['#6cb4ff', '#bcd8ff', '#ffffff'] };
    return { sparks: ['#0055cc', '#4f8fff', '#ffffff'] };
  }

  var parts = [];
  var TAU = Math.PI * 2;

  function burst(x, y) {
    var pal = palette();
    parts.push({ type: 'core', x: x, y: y, life: 0, max: 15 });
    parts.push({ type: 'ring', x: x, y: y, life: 0, max: 28 });
    var n = 28, i;
    for (i = 0; i < n; i++) {
      var ang = (i / n) * TAU + Math.random() * 0.25;
      var spd = 3 + Math.random() * 6.5;
      parts.push({
        type: 'spark', x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life: 0, max: 26 + Math.random() * 22, color: pal.sparks[i % pal.sparks.length]
      });
    }
    for (i = 0; i < 10; i++) {
      var a2 = Math.random() * TAU, s2 = 0.5 + Math.random() * 2.2;
      parts.push({
        type: 'spark', x: x, y: y, vx: Math.cos(a2) * s2, vy: Math.sin(a2) * s2,
        life: 0, max: 42 + Math.random() * 34, color: '#ffffff'
      });
    }
  }

  window.addEventListener('mousedown', function (e) { burst(e.clientX, e.clientY); });
  window.addEventListener('touchstart', function (e) {
    var t = e.touches && e.touches[0]; if (t) burst(t.clientX, t.clientY);
  }, { passive: true });

  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life++;
      var t = p.life / p.max;

      if (p.type === 'spark') {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92;
        var a = 1 - t;
        ctx.globalAlpha = Math.max(0, a);
        ctx.strokeStyle = p.color;
        ctx.shadowBlur = 6; ctx.shadowColor = p.color;
        ctx.lineWidth = 1.8 * a + 0.4;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (p.type === 'core') {
        var r = 4 + t * 24, ca = (1 - t) * 0.9;
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, 'rgba(255,255,255,' + ca + ')');
        g.addColorStop(0.4, 'rgba(200,225,255,' + (ca * 0.6) + ')');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      } else { // ring
        var rr = t * 46;
        ctx.globalAlpha = (1 - t) * 0.55;
        ctx.strokeStyle = '#cfe2ff';
        ctx.shadowBlur = 8; ctx.shadowColor = '#9cc3ff';
        ctx.lineWidth = 2 * (1 - t) + 0.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, TAU); ctx.stroke();
      }

      if (p.life >= p.max) parts.splice(i, 1);
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
