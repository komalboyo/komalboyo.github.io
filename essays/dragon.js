// ===== A dragon that follows the cursor and breathes fire when you press =====
// Procedural canvas dragon: follow-the-leader spine, shaded scaled body, flapping
// membrane WINGS, jagged dorsal spikes, fanged reptilian head with a slit eye and
// horns, spaded tail. Hold the mouse/finger down and it opens its maw and breathes
// fire. Theme-aware, pointer-events none, off under reduced-motion.
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

  var N = 36, SPACING = 15, MAXR = 20;
  var pts = [];
  for (var i = 0; i < N; i++) pts.push({ x: W * 0.5, y: H * 0.45 });
  var target = { x: W * 0.5, y: H * 0.4 };
  var lastInput = -9999;

  function move(x, y) { target.x = x; target.y = y; lastInput = performance.now(); }
  window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
  window.addEventListener('touchmove', function (e) {
    var t = e.touches && e.touches[0]; if (t) move(t.clientX, t.clientY);
  }, { passive: true });

  var firing = false, fire = [];
  window.addEventListener('mousedown', function () { firing = true; });
  window.addEventListener('mouseup', function () { firing = false; });
  window.addEventListener('touchstart', function () { firing = true; }, { passive: true });
  window.addEventListener('touchend', function () { firing = false; });

  var headAngle = 0, mouthX = 0, mouthY = 0;

  function palette() {
    var th = document.documentElement.getAttribute('data-theme');
    if (th === 'disco') return { base: '#ff2d95', back: '#ff93c6', belly: '#a01464', line: '#ff2d95', wing: 'rgba(0,255,213,0.34)', wingEdge: '#00ffd5', spike: '#ff2d95', eye: '#00ffd5', pupil: '#06121a', tooth: '#ffffff', glow: '#ff2d95' };
    if (th === 'dark') return { base: '#3a9b6e', back: '#84e7b4', belly: '#1f6a4d', line: 'rgba(160,242,205,0.55)', wing: 'rgba(60,140,105,0.5)', wingEdge: 'rgba(160,242,205,0.6)', spike: '#1f6a4d', eye: '#ffd24a', pupil: '#241a00', tooth: '#f3f0e2', glow: '' };
    return { base: '#4a8a5c', back: '#8ac79a', belly: '#2c5a3b', line: 'rgba(20,42,26,0.85)', wing: 'rgba(58,108,70,0.5)', wingEdge: 'rgba(20,42,26,0.7)', spike: '#23492f', eye: '#e0a91a', pupil: '#2a1f00', tooth: '#f6f3e8', glow: '' };
  }
  function radiusAt(i) {
    var t = i / (N - 1);
    return Math.max(0.8, MAXR * Math.pow(1 - t, 0.5) * (0.55 + 0.45 * Math.sin(t * Math.PI + 0.45)));
  }
  function normalAt(i) {
    var a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.0001;
    return { x: -dy / d, y: dx / d, tx: dx / d, ty: dy / d }; // tangent points toward tail
  }

  var t0 = performance.now();
  function wander(now) {
    var t = (now - t0) / 1000;
    return { x: W * 0.5 + Math.cos(t * 0.4) * W * 0.32, y: H * 0.45 + Math.sin(t * 0.66) * H * 0.3 };
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
    mouthX = pts[0].x + Math.cos(headAngle) * MAXR * 2.4;
    mouthY = pts[0].y + Math.sin(headAngle) * MAXR * 2.4;
  }

  function smoothClosed(poly) {
    var n = poly.length;
    var m = { x: (poly[n - 1].x + poly[0].x) / 2, y: (poly[n - 1].y + poly[0].y) / 2 };
    ctx.moveTo(m.x, m.y);
    for (var k = 0; k < n; k++) {
      var c = poly[k], nx = poly[(k + 1) % n];
      ctx.quadraticCurveTo(c.x, c.y, (c.x + nx.x) / 2, (c.y + nx.y) / 2);
    }
  }

  function spawnFire() {
    for (var i = 0; i < 5; i++) {
      var spread = (Math.random() - 0.5) * 0.6, a = headAngle + spread, spd = 2.6 + Math.random() * 3.6;
      fire.push({ x: mouthX, y: mouthY, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 0, max: 22 + Math.random() * 18, sz: 5 + Math.random() * 6 });
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
    ctx.globalCompositeOperation = 'lighter'; ctx.shadowBlur = 0;
    for (var i = 0; i < fire.length; i++) {
      var p = fire[i], t = p.life / p.max;
      ctx.fillStyle = 'hsla(' + (48 - 40 * t) + ',100%,' + (62 - 18 * t) + '%,' + ((1 - t) * 0.85) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.sz * (1 - t * 0.55)), 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawWing(now, idx, side, p) {
    if (idx >= N - 2) return;
    var nm = normalAt(idx), r = radiusAt(idx);
    var ox = nm.x * side, oy = nm.y * side;          // outward normal
    var tx = nm.tx, ty = nm.ty;                       // toward tail
    var sx = pts[idx].x + ox * r * 0.4, sy = pts[idx].y + oy * r * 0.4; // shoulder
    var flap = (Math.sin(now * 0.007) + 1) / 2;       // 0..1
    var span = 58 * (0.62 + 0.38 * flap);
    function P(o, t) { return { x: sx + ox * span * o + tx * span * t, y: sy + oy * span * o + ty * span * t }; }
    var p1 = P(1.0, 0.10), p2 = P(0.66, 0.62), p3 = P(0.30, 1.04), p4 = P(0.05, 1.32);

    // membrane
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(p1.x, p1.y);
    function scallop(a, b) {
      var mx = (a.x + b.x) / 2 - ox * span * 0.16, my = (a.y + b.y) / 2 - oy * span * 0.16;
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
    }
    scallop(p1, p2); scallop(p2, p3); scallop(p3, p4);
    ctx.lineTo(sx, sy);
    ctx.closePath();
    ctx.fillStyle = p.wing; ctx.fill();

    // bones
    ctx.strokeStyle = p.wingEdge; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    ctx.lineWidth = 1.1;
    [p2, p3, p4].forEach(function (pt) {
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pt.x, pt.y); ctx.stroke();
    });
  }

  function drawHead(p, now) {
    var hr = MAXR * 1.2;
    ctx.save();
    ctx.translate(pts[0].x, pts[0].y);
    ctx.rotate(headAngle);

    // mane
    ctx.strokeStyle = p.wing; ctx.lineWidth = 2.6;
    for (var mn = -1; mn <= 1; mn++) {
      ctx.beginPath();
      ctx.moveTo(-hr * 0.4, mn * hr * 0.4);
      ctx.quadraticCurveTo(-hr * 1.3, mn * hr * 0.9 - hr * 0.5, -hr * 2.1 - Math.sin(now * 0.006 + mn) * 6, mn * hr * 0.7 - hr * 0.4);
      ctx.stroke();
    }

    var grd = ctx.createLinearGradient(0, -hr, 0, hr * 0.9);
    grd.addColorStop(0, p.back); grd.addColorStop(0.55, p.base); grd.addColorStop(1, p.belly);

    // skull + heavier jaw
    ctx.beginPath();
    ctx.moveTo(-hr * 0.7, -hr * 0.5);
    ctx.quadraticCurveTo(hr * 0.05, -hr * 0.98, hr * 0.95, -hr * 0.52);
    ctx.quadraticCurveTo(hr * 1.7, -hr * 0.24, hr * 2.1, -hr * 0.04);
    ctx.lineTo(hr * 2.1, hr * 0.08);
    ctx.quadraticCurveTo(hr * 1.6, hr * 0.26, hr * 1.05, hr * 0.46);
    ctx.quadraticCurveTo(hr * 0.3, hr * 0.66, -hr * 0.7, hr * 0.5);
    ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    ctx.strokeStyle = p.line; ctx.lineWidth = 1.6; ctx.stroke();

    // jaw / teeth
    if (firing) {
      ctx.fillStyle = '#2a0a00';
      ctx.beginPath();
      ctx.moveTo(hr * 1.0, hr * 0.02); ctx.lineTo(hr * 2.1, hr * 0.06); ctx.lineTo(hr * 1.15, hr * 0.66); ctx.closePath(); ctx.fill();
      ctx.fillStyle = p.tooth;
      for (var u = 0; u < 4; u++) { var ux = hr * (1.25 + u * 0.22); ctx.beginPath(); ctx.moveTo(ux, hr * 0.04); ctx.lineTo(ux + hr * 0.07, hr * 0.04); ctx.lineTo(ux + hr * 0.03, hr * 0.2); ctx.closePath(); ctx.fill(); }
      for (var lo = 0; lo < 3; lo++) { var lx = hr * (1.2 + lo * 0.2); ctx.beginPath(); ctx.moveTo(lx, hr * 0.5); ctx.lineTo(lx + hr * 0.07, hr * 0.5); ctx.lineTo(lx + hr * 0.03, hr * 0.34); ctx.closePath(); ctx.fill(); }
    } else {
      ctx.strokeStyle = p.line; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hr * 1.0, hr * 0.24); ctx.lineTo(hr * 2.05, hr * 0.05); ctx.stroke();
      ctx.fillStyle = p.tooth; // two fangs
      ctx.beginPath(); ctx.moveTo(hr * 1.9, hr * 0.08); ctx.lineTo(hr * 1.78, hr * 0.08); ctx.lineTo(hr * 1.86, hr * 0.34); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hr * 1.55, hr * 0.16); ctx.lineTo(hr * 1.45, hr * 0.16); ctx.lineTo(hr * 1.52, hr * 0.4); ctx.closePath(); ctx.fill();
    }

    // nostril
    ctx.strokeStyle = p.line; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(hr * 1.75, -hr * 0.14, 1.6, 0.4, 3.4); ctx.stroke();

    // horns: a cluster of three, swept back + a cheek spike
    ctx.fillStyle = p.belly;
    [[-0.5, -0.5, -2.0, -1.5], [-0.35, -0.25, -1.7, -0.95], [-0.2, 0.0, -1.4, -0.45], [0.55, -0.5, 0.2, -1.15]].forEach(function (h) {
      ctx.beginPath();
      ctx.moveTo(hr * h[0], hr * h[1]);
      ctx.quadraticCurveTo(hr * (h[0] + h[2]) * 0.5, hr * (h[1] + h[3]) * 0.5 - hr * 0.2, hr * h[2], hr * h[3]);
      ctx.quadraticCurveTo(hr * (h[0] + h[2]) * 0.5 + hr * 0.16, hr * (h[1] + h[3]) * 0.5, hr * h[0] + hr * 0.26, hr * h[1] + hr * 0.18);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = p.line; ctx.lineWidth = 1; ctx.stroke();
    });

    // brow + slit eye
    ctx.strokeStyle = p.line; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(hr * 0.18, -hr * 0.54); ctx.quadraticCurveTo(hr * 0.6, -hr * 0.68, hr * 0.9, -hr * 0.46); ctx.stroke();
    if (p.glow) { ctx.shadowBlur = 12; ctx.shadowColor = p.eye; }
    ctx.fillStyle = p.eye;
    ctx.beginPath(); ctx.ellipse(hr * 0.55, -hr * 0.32, 6, 3.6, -0.25, 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.pupil;
    ctx.beginPath(); ctx.ellipse(hr * 0.57, -hr * 0.32, 1.2, 3.0, -0.25, 0, 6.283); ctx.fill();

    // whiskers
    ctx.strokeStyle = p.line; ctx.lineWidth = 1;
    var ws = Math.sin(now * 0.004) * hr * 0.25;
    ctx.beginPath();
    ctx.moveTo(hr * 1.9, -hr * 0.06); ctx.quadraticCurveTo(hr * 3.1, -hr * 0.8, hr * 3.6, -hr * 1.7 + ws);
    ctx.moveTo(hr * 1.9, hr * 0.18); ctx.quadraticCurveTo(hr * 3.0, hr * 0.7, hr * 3.4, hr * 1.5 + ws);
    ctx.stroke();

    ctx.restore();
  }

  function draw(now) {
    var p = palette();
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    canvas.style.mixBlendMode = 'normal';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    var i, left = [], right = [], minY = 1e9, maxY = -1e9;
    for (i = 0; i < N; i++) {
      var nrm = normalAt(i), r = radiusAt(i);
      left.push({ x: pts[i].x + nrm.x * r, y: pts[i].y + nrm.y * r });
      right.push({ x: pts[i].x - nrm.x * r, y: pts[i].y - nrm.y * r });
      if (pts[i].y < minY) minY = pts[i].y;
      if (pts[i].y > maxY) maxY = pts[i].y;
    }

    // wings (behind body)
    drawWing(now, 6, 1, p);
    drawWing(now, 6, -1, p);

    // jagged dorsal spikes (behind body)
    ctx.fillStyle = p.spike; ctx.strokeStyle = p.line; ctx.lineWidth = 1;
    for (i = 2; i < N * 0.8; i += 1) {
      var nm = normalAt(i), rr = radiusAt(i);
      var h2 = Math.max(3, rr * 1.15) * Math.min(1, (N - i) / (N * 0.7));
      var bx = pts[i].x + nm.x * rr * 0.7, by = pts[i].y + nm.y * rr * 0.7;
      var tipx = pts[i].x + nm.x * (rr + h2) + nm.tx * h2 * 0.35;
      var tipy = pts[i].y + nm.y * (rr + h2) + nm.ty * h2 * 0.35;
      var b2x = pts[i].x + nm.x * rr * 0.7 + nm.tx * rr * 0.5, b2y = pts[i].y + nm.y * rr * 0.7 + nm.ty * rr * 0.5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tipx, tipy); ctx.lineTo(b2x, b2y); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // body
    var outline = left.concat(right.slice().reverse());
    ctx.beginPath(); smoothClosed(outline); ctx.closePath();
    var bg = ctx.createLinearGradient(0, minY - MAXR, 0, maxY + MAXR);
    bg.addColorStop(0, p.back); bg.addColorStop(0.5, p.base); bg.addColorStop(1, p.belly);
    ctx.globalAlpha = 0.94;
    if (p.glow) { ctx.shadowBlur = 12; ctx.shadowColor = p.glow; } else { ctx.shadowBlur = 0; }
    ctx.fillStyle = bg; ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.strokeStyle = p.line; ctx.lineWidth = 1.6; ctx.stroke();

    // scales
    ctx.strokeStyle = p.belly; ctx.globalAlpha = 0.26; ctx.lineWidth = 1;
    for (i = 4; i < N - 5; i += 2) {
      var n3 = normalAt(i), r3 = radiusAt(i), ang = Math.atan2(n3.ty, n3.tx);
      for (var s = -1; s <= 1; s++) {
        var cx = pts[i].x - n3.x * (s * r3 * 0.42), cy = pts[i].y - n3.y * (s * r3 * 0.42);
        ctx.beginPath(); ctx.arc(cx, cy, r3 * 0.34, ang - 2.4, ang - 0.7); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // spaded tail
    var tn = normalAt(N - 1), tail = pts[N - 1];
    var fwdx = -tn.tx, fwdy = -tn.ty; // toward tail tip is +tangent; tip extends along tangent
    var tipX = tail.x + tn.tx * 22, tipY = tail.y + tn.ty * 22;
    var midX = tail.x + tn.tx * 8, midY = tail.y + tn.ty * 8;
    ctx.fillStyle = p.spike; ctx.strokeStyle = p.line; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(midX + tn.x * 11, midY + tn.y * 11);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(midX - tn.x * 11, midY - tn.y * 11);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    drawHead(p, now);
    drawFire();
  }

  function loop(now) {
    step(now);
    if (firing) spawnFire();
    updateFire();
    draw(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
