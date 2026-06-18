// ===== A dragon that follows the cursor and breathes fire when you press =====
// Procedural canvas wyrm: follow-the-leader segment chain, horned head, eye,
// dorsal spines, whiskers. Hold the mouse/finger down to breathe fire from its
// mouth. Theme-aware, pointer-events none, off under reduced-motion.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'dragon-canvas';
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

  var N = 34, SPACING = 16, MAXR = 21;
  var pts = [];
  for (var i = 0; i < N; i++) pts.push({ x: W * 0.5, y: H * 0.45 });
  var target = { x: W * 0.5, y: H * 0.4 };
  var lastInput = -9999;

  function move(x, y) { target.x = x; target.y = y; lastInput = performance.now(); }
  window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
  window.addEventListener('touchmove', function (e) {
    var t = e.touches && e.touches[0]; if (t) move(t.clientX, t.clientY);
  }, { passive: true });

  // ---- fire ----
  var firing = false, fire = [];
  window.addEventListener('mousedown', function () { firing = true; });
  window.addEventListener('mouseup', function () { firing = false; });
  window.addEventListener('touchstart', function () { firing = true; }, { passive: true });
  window.addEventListener('touchend', function () { firing = false; });

  var headAngle = 0, mouthX = 0, mouthY = 0;

  function palette() {
    var th = document.documentElement.getAttribute('data-theme');
    if (th === 'disco') return { stroke: '#ff2d95', fill: 'rgba(255,45,149,0.10)', eye: '#00ffd5', glow: '#ff2d95', blend: 'screen' };
    if (th === 'dark') return { stroke: 'rgba(224,221,216,0.82)', fill: 'rgba(224,221,216,0.07)', eye: '#6cb4ff', glow: '', blend: 'screen' };
    return { stroke: 'rgba(26,26,26,0.74)', fill: 'rgba(26,26,26,0.09)', eye: '#0055cc', glow: '', blend: 'multiply' };
  }
  function radiusAt(i) {
    var t = i / (N - 1);
    return Math.max(0.6, MAXR * Math.pow(1 - t, 0.55) * (0.55 + 0.45 * Math.sin(t * Math.PI + 0.5)));
  }
  function normalAt(i) {
    var a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.0001;
    return { x: -dy / d, y: dx / d, tx: dx / d, ty: dy / d };
  }

  var t0 = performance.now();
  function wander(now) {
    var t = (now - t0) / 1000;
    return { x: W * 0.5 + Math.cos(t * 0.45) * W * 0.3, y: H * 0.45 + Math.sin(t * 0.7) * H * 0.28 };
  }

  function step(now) {
    var tgt = (now - lastInput > 2500) ? wander(now) : target;
    pts[0].x += (tgt.x - pts[0].x) * 0.16;
    pts[0].y += (tgt.y - pts[0].y) * 0.16;
    for (var i = 1; i < N; i++) {
      var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      var d = Math.hypot(dx, dy) || 0.0001, k = SPACING / d;
      pts[i].x = pts[i - 1].x + dx * k;
      pts[i].y = pts[i - 1].y + dy * k;
    }
    headAngle = Math.atan2(pts[0].y - pts[1].y, pts[0].x - pts[1].x);
    mouthX = pts[0].x + Math.cos(headAngle) * MAXR * 2.2;
    mouthY = pts[0].y + Math.sin(headAngle) * MAXR * 2.2;
  }

  function spawnFire() {
    for (var i = 0; i < 4; i++) {
      var spread = (Math.random() - 0.5) * 0.55;
      var a = headAngle + spread, spd = 2.4 + Math.random() * 3.4;
      fire.push({
        x: mouthX, y: mouthY,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        life: 0, max: 22 + Math.random() * 18, sz: 5 + Math.random() * 6
      });
    }
  }
  function updateFire() {
    for (var i = fire.length - 1; i >= 0; i--) {
      var p = fire[i];
      p.life++; p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.vy -= 0.04;
      if (p.life >= p.max) fire.splice(i, 1);
    }
  }
  function drawFire() {
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 0;
    for (var i = 0; i < fire.length; i++) {
      var p = fire[i], t = p.life / p.max;
      var hue = 48 - 40 * t, a = (1 - t) * 0.85, r = p.sz * (1 - t * 0.55);
      ctx.fillStyle = 'hsla(' + hue + ',100%,' + (62 - 18 * t) + '%,' + a + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function draw() {
    var p = palette();
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    canvas.style.mixBlendMode = p.blend;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (p.glow) { ctx.shadowBlur = 10; ctx.shadowColor = p.glow; } else { ctx.shadowBlur = 0; }

    var left = [], right = [], i;
    for (i = 0; i < N; i++) {
      var nrm = normalAt(i), r = radiusAt(i);
      left.push({ x: pts[i].x + nrm.x * r, y: pts[i].y + nrm.y * r });
      right.push({ x: pts[i].x - nrm.x * r, y: pts[i].y - nrm.y * r });
    }
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (i = 1; i < N; i++) ctx.lineTo(left[i].x, left[i].y);
    for (i = N - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    ctx.fillStyle = p.fill; ctx.fill();
    ctx.strokeStyle = p.stroke; ctx.lineWidth = 1.4; ctx.stroke();

    ctx.lineWidth = 1.2;
    for (i = 2; i < N * 0.72; i += 2) {
      var nm = normalAt(i), r2 = radiusAt(i), sp = Math.max(6, r2 * 0.85);
      ctx.beginPath();
      ctx.moveTo(pts[i].x + nm.x * r2, pts[i].y + nm.y * r2);
      ctx.lineTo(pts[i].x + nm.x * (r2 + sp) - nm.tx * (sp * 0.7), pts[i].y + nm.y * (r2 + sp) - nm.ty * (sp * 0.7));
      ctx.lineTo(pts[i].x + nm.x * r2 - nm.tx * (sp * 0.55), pts[i].y + nm.y * r2 - nm.ty * (sp * 0.55));
      ctx.stroke();
    }

    var tn = normalAt(N - 1), tail = pts[N - 1];
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(tail.x - tn.tx * 14 + tn.x * 7, tail.y - tn.ty * 14 + tn.y * 7);
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(tail.x - tn.tx * 14 - tn.x * 7, tail.y - tn.ty * 14 - tn.y * 7);
    ctx.stroke();

    // head
    var hr = MAXR * 1.25;
    ctx.save();
    ctx.translate(pts[0].x, pts[0].y);
    ctx.rotate(headAngle);
    ctx.beginPath();
    ctx.moveTo(hr * 1.8, 0);
    ctx.lineTo(hr * 0.2, -hr * 0.85);
    ctx.lineTo(-hr * 0.7, 0);
    ctx.lineTo(hr * 0.2, hr * 0.85);
    ctx.closePath();
    ctx.fillStyle = p.fill; ctx.fill();
    ctx.strokeStyle = p.stroke; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-hr * 0.1, -hr * 0.55); ctx.lineTo(-hr * 1.5, -hr * 1.5);
    ctx.moveTo(-hr * 0.1, hr * 0.55); ctx.lineTo(-hr * 1.5, hr * 1.5);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hr * 1.7, -hr * 0.25); ctx.quadraticCurveTo(hr * 3.0, -hr * 0.8, hr * 3.5, -hr * 1.9);
    ctx.moveTo(hr * 1.7, hr * 0.25); ctx.quadraticCurveTo(hr * 3.0, hr * 0.8, hr * 3.5, hr * 1.9);
    ctx.stroke();
    ctx.shadowBlur = p.glow ? 14 : 7; ctx.shadowColor = p.eye;
    ctx.fillStyle = p.eye;
    ctx.beginPath();
    ctx.arc(hr * 0.55, -hr * 0.42, 2.6, 0, Math.PI * 2);
    ctx.arc(hr * 0.55, hr * 0.42, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawFire();
  }

  function loop(now) {
    step(now);
    if (firing) spawnFire();
    updateFire();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
