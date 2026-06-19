// ===== Dragon Warrior Mode =====
// A toggle (saved in localStorage) that turns the site into an imperial,
// Kung-Fu-Panda-style experience: gold Chinese dragon cursor + fire, jade/gold
// backdrop (CSS via data-dragon="on"), a cinematic entrance (gong + golden flash
// + dragon-seal stamp), content that unfurls as you scroll, parallax clouds, and
// synthesized sound (gong / wind / fire crackle). Off by default. Backdrop works
// everywhere; the cursor dragon is desktop-only.
(function () {
  var DOC = document.documentElement;
  var modeOn = localStorage.getItem('dragonMode') === 'on';
  if (modeOn) DOC.setAttribute('data-dragon', 'on');

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = !window.matchMedia ||
    (!window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: none)').matches);

  // ---------------- reframe the resume into a warrior's journey ----------------
  var LABELS = { education: 'Training', experience: 'Campaigns', research: 'Sacred Scrolls', awards: 'Honors', projects: 'Creations', skills: 'Mastery', opinions: 'Wisdom' };
  function reframe(on) {
    Object.keys(LABELS).forEach(function (id) {
      var h = document.querySelector('#' + id + ' h2');
      if (!h) return;
      if (on) { if (h.getAttribute('data-orig') === null) h.setAttribute('data-orig', h.innerHTML); h.textContent = LABELS[id]; }
      else { var o = h.getAttribute('data-orig'); if (o !== null) { h.innerHTML = o; h.removeAttribute('data-orig'); } }
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var hash = (a.getAttribute('href') || '').split('#')[1];
      if (!hash || !LABELS[hash]) return;
      if (on) { if (a.getAttribute('data-orig') === null) a.setAttribute('data-orig', a.textContent); a.textContent = LABELS[hash]; }
      else { var o = a.getAttribute('data-orig'); if (o !== null) { a.textContent = o; a.removeAttribute('data-orig'); } }
    });
  }

  // ---------------- temple backdrop (mountains + lanterns) ----------------
  var bd = null;
  function backdrop(on) {
    if (on) {
      if (bd) return;
      bd = document.createElement('div'); bd.className = 'dwm-backdrop'; bd.setAttribute('aria-hidden', 'true');
      bd.innerHTML = '<div class="dwm-mtn"></div><div class="dwm-lantern dwm-lantern-l"><i></i></div><div class="dwm-lantern dwm-lantern-r"><i></i></div>';
      document.body.appendChild(bd);
    } else { if (bd && bd.parentNode) bd.parentNode.removeChild(bd); bd = null; }
  }

  // ---------------- toggle: a temple gong you strike ----------------
  var btn = document.createElement('button');
  btn.className = 'dwm-gong' + (modeOn ? ' active' : '');
  btn.type = 'button';
  btn.setAttribute('aria-pressed', modeOn ? 'true' : 'false');
  btn.setAttribute('aria-label', 'Toggle Dragon Warrior Mode');
  btn.title = 'Strike the gong — Dragon Warrior Mode';
  btn.innerHTML =
    '<span class="dwm-gong-frame" aria-hidden="true"></span>' +
    '<span class="dwm-gong-disc" aria-hidden="true"><span class="dwm-gong-boss"></span></span>' +
    '<span class="dwm-gong-mallet" aria-hidden="true"></span>' +
    '<span class="dwm-gong-ripple" aria-hidden="true"></span>' +
    '<span class="dwm-gong-label">' + (modeOn ? 'Dragon Warrior' : 'Strike to Enter') + '</span>';
  function mount() {
    document.body.appendChild(btn);
    if (modeOn) { reframe(true); backdrop(true); setupReveal(); addScroll(); startDragon(); }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  btn.addEventListener('click', function () {
    modeOn = !modeOn;
    localStorage.setItem('dragonMode', modeOn ? 'on' : 'off');
    btn.classList.toggle('active', modeOn);
    btn.setAttribute('aria-pressed', modeOn ? 'true' : 'false');
    btn.classList.remove('struck'); void btn.offsetWidth; btn.classList.add('struck');
    var lbl = btn.querySelector('.dwm-gong-label'); if (lbl) lbl.textContent = modeOn ? 'Dragon Warrior' : 'Strike to Enter';
    if (modeOn) {
      DOC.setAttribute('data-dragon', 'on');
      audio(); gong(); playEntrance(); reframe(true); backdrop(true);
      setupReveal(); addScroll(); startDragon();
    } else {
      DOC.removeAttribute('data-dragon');
      reframe(false); backdrop(false); removeScroll(); revealAll(); stopCrackle(); stopDragon();
    }
  });

  // ---------------- sound (Web Audio, synthesized) ----------------
  var AC = null, noiseBuf = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume();
    if (AC && !noiseBuf) {
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return AC;
  }
  function gong() {
    if (!AC) return;
    var t = AC.currentTime, master = AC.createGain();
    master.gain.value = 0.55; master.connect(AC.destination);
    [1, 2.01, 2.79, 3.84, 5.1].forEach(function (m, i) {
      var o = AC.createOscillator(); o.type = 'sine';
      o.frequency.value = 88 * m * (1 + (Math.random() - 0.5) * 0.01);
      var g = AC.createGain(); g.gain.value = 0;
      o.connect(g); g.connect(master);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.6 / (i + 1), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0006, t + 3.6);
      o.start(t); o.stop(t + 3.8);
    });
    // metallic strike
    if (noiseBuf) {
      var n = AC.createBufferSource(); n.buffer = noiseBuf;
      var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.7;
      var ng = AC.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      n.connect(bp); bp.connect(ng); ng.connect(AC.destination); n.start(t); n.stop(t + 0.4);
    }
  }
  var lastWhoosh = -9999;
  function whoosh() {
    if (!AC || !noiseBuf) return;
    var now = performance.now(); if (now - lastWhoosh < 1100) return; lastWhoosh = now;
    var t = AC.currentTime, n = AC.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, t); bp.frequency.linearRampToValueAtTime(1100, t + 0.5); bp.frequency.linearRampToValueAtTime(350, t + 1.0);
    var g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 1.0);
    n.connect(bp); bp.connect(g); g.connect(AC.destination); n.start(t); n.stop(t + 1.05);
  }
  var crackle = null;
  function startCrackle() {
    if (!AC || !noiseBuf || crackle) return;
    var src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
    var g = AC.createGain(); g.gain.value = 0.0;
    src.connect(bp); bp.connect(g); g.connect(AC.destination); src.start();
    var iv = setInterval(function () {
      if (!AC) return;
      g.gain.setTargetAtTime(0.02 + Math.random() * 0.06, AC.currentTime, 0.02);
    }, 55);
    crackle = { src: src, g: g, iv: iv };
  }
  function stopCrackle() {
    if (!crackle) return;
    clearInterval(crackle.iv);
    try { crackle.g.gain.setTargetAtTime(0, AC.currentTime, 0.05); crackle.src.stop(AC.currentTime + 0.2); } catch (e) {}
    crackle = null;
  }

  // ---------------- cinematic entrance ----------------
  function ensureClothFilter() {
    if (document.getElementById('dwm-cloth-svg')) return;
    var holder = document.createElement('div');
    holder.id = 'dwm-cloth-svg';
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    holder.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<filter id="dwmCloth" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.006 0.026" numOctaves="2" seed="4" result="n">' +
      '<animate attributeName="seed" from="1" to="80" dur="7s" repeatCount="indefinite"/></feTurbulence>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter></defs></svg>';
    document.body.appendChild(holder);
  }

  function playEntrance() {
    if (reduced) return;
    whoosh();
    ensureClothFilter();
    var stage = document.createElement('div');
    stage.className = 'dwm-fling-stage';
    stage.innerHTML =
      '<div class="dwm-streak"></div>' +
      '<div class="dwm-fling">' +
        '<div class="dwm-cloth"><span class="dwm-glyph">龍</span><span class="dwm-fling-title">DRAGON WARRIOR</span></div>' +
        '<span class="dwm-rod dwm-rod-l"></span>' +
        '<span class="dwm-rod dwm-rod-r"></span>' +
      '</div>';
    document.body.appendChild(stage);
    requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.add('go'); }); });
    setTimeout(function () { if (stage.parentNode) stage.parentNode.removeChild(stage); }, 3500);
  }

  // ---------------- scroll: unfurl reveals + parallax + wind ----------------
  var io = null;
  function setupReveal() {
    var sel = 'main section, .featured-essay, .entry, .exp, .pub, .project-item, .award, .edu, .skill-group, .essay-body > p, .essay-body > .essay-break, .essay-body > blockquote';
    var els = document.querySelectorAll(sel);
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('dwm-reveal', 'dwm-in'); }); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('dwm-in'); io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    }
    els.forEach(function (e) { e.classList.add('dwm-reveal'); io.observe(e); });
  }
  function revealAll() {
    if (io) { io.disconnect(); io = null; }
    document.querySelectorAll('.dwm-reveal').forEach(function (e) { e.classList.add('dwm-in'); });
  }
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    DOC.style.setProperty('--dwm-scroll', y.toFixed(1));
    if (Math.abs(y - lastY) > 60) { whoosh(); }
    lastY = y;
  }
  function addScroll() { lastY = window.scrollY || 0; window.addEventListener('scroll', onScroll, { passive: true }); }
  function removeScroll() { window.removeEventListener('scroll', onScroll); DOC.style.removeProperty('--dwm-scroll'); }

  // ---------------- gold Chinese dragon ----------------
  var canvas, ctx, dpr, W, H, running = false, rafId = null;
  var N = 38, SPACING = 14, MAXR = 18;
  var pts, target, lastInput, headAngle = 0, mouthX = 0, mouthY = 0;
  var firing = false, fire = [], t0 = 0;
  var PAL = {
    base: '#d8b33f', back: '#f7e08f', belly: '#9a7517', line: 'rgba(54,34,4,0.85)',
    fin: 'rgba(247,224,143,0.34)', finEdge: 'rgba(120,86,12,0.8)', mane: 'rgba(247,224,143,0.7)',
    eye: '#ff3b30', pupil: '#1a0a00', tooth: '#fff6e0', glow: 'rgba(255,210,90,0.55)'
  };
  function onMove(e) { var x = e.clientX, y = e.clientY; if (e.touches && e.touches[0]) { x = e.touches[0].clientX; y = e.touches[0].clientY; } target.x = x; target.y = y; lastInput = performance.now(); }
  function onDown() { firing = true; audio(); startCrackle(); }
  function onUp() { firing = false; stopCrackle(); }
  function resize() { W = window.innerWidth; H = window.innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function startDragon() {
    if (running || !finePointer || reduced) return;
    running = true;
    canvas = document.createElement('canvas'); canvas.id = 'dragon-canvas'; canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d'); dpr = Math.min(window.devicePixelRatio || 1, 2); resize();
    pts = []; for (var i = 0; i < N; i++) pts.push({ x: W * 0.5, y: H * 0.45 });
    target = { x: W * 0.5, y: H * 0.4 }; lastInput = -9999; t0 = performance.now(); fire = [];
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    rafId = requestAnimationFrame(loop);
  }
  function stopDragon() {
    if (!running) return; running = false;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMove);
    window.removeEventListener('touchmove', onMove); window.removeEventListener('mousedown', onDown);
    window.removeEventListener('mouseup', onUp);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null; fire = [];
  }
  function radiusAt(i) { var t = i / (N - 1); return Math.max(0.7, MAXR * Math.pow(1 - t, 0.5) * (0.5 + 0.5 * Math.sin(t * Math.PI + 0.4))); }
  function normalAt(i) { var a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)]; var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.0001; return { x: -dy / d, y: dx / d, tx: dx / d, ty: dy / d }; }
  function smoothClosed(poly) { var n = poly.length, m = { x: (poly[n - 1].x + poly[0].x) / 2, y: (poly[n - 1].y + poly[0].y) / 2 }; ctx.moveTo(m.x, m.y); for (var k = 0; k < n; k++) { var c = poly[k], nx = poly[(k + 1) % n]; ctx.quadraticCurveTo(c.x, c.y, (c.x + nx.x) / 2, (c.y + nx.y) / 2); } }
  function wander(now) { var t = (now - t0) / 1000; return { x: W * 0.5 + Math.cos(t * 0.4) * W * 0.33, y: H * 0.45 + Math.sin(t * 0.66) * H * 0.3 }; }
  function step(now) {
    var tgt = (now - lastInput > 2500) ? wander(now) : target;
    pts[0].x += (tgt.x - pts[0].x) * 0.16; pts[0].y += (tgt.y - pts[0].y) * 0.16;
    for (var i = 1; i < N; i++) { var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y; var d = Math.hypot(dx, dy) || 0.0001, k = SPACING / d; pts[i].x = pts[i - 1].x + dx * k; pts[i].y = pts[i - 1].y + dy * k; }
    headAngle = Math.atan2(pts[0].y - pts[1].y, pts[0].x - pts[1].x);
    mouthX = pts[0].x + Math.cos(headAngle) * MAXR * 2.5; mouthY = pts[0].y + Math.sin(headAngle) * MAXR * 2.5;
  }
  function spawnFire() { for (var i = 0; i < 5; i++) { var sp = (Math.random() - 0.5) * 0.6, a = headAngle + sp, v = 2.6 + Math.random() * 3.6; fire.push({ x: mouthX, y: mouthY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 22 + Math.random() * 18, sz: 5 + Math.random() * 6 }); } }
  function updateFire() { for (var i = fire.length - 1; i >= 0; i--) { var p = fire[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.vy -= 0.04; if (p.life >= p.max) fire.splice(i, 1); } }
  function drawFire() { ctx.globalCompositeOperation = 'lighter'; ctx.shadowBlur = 0; for (var i = 0; i < fire.length; i++) { var p = fire[i], t = p.life / p.max; ctx.fillStyle = 'hsla(' + (48 - 40 * t) + ',100%,' + (62 - 18 * t) + '%,' + ((1 - t) * 0.85) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.sz * (1 - t * 0.55)), 0, 6.283); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; }
  function drawHead(now) {
    var hr = MAXR * 1.25, p = PAL;
    ctx.save(); ctx.translate(pts[0].x, pts[0].y); ctx.rotate(headAngle);
    ctx.strokeStyle = p.mane; ctx.lineWidth = 2.6;
    for (var mn = -1; mn <= 1; mn++) { ctx.beginPath(); ctx.moveTo(-hr * 0.4, mn * hr * 0.45); ctx.quadraticCurveTo(-hr * 1.4, mn * hr * 1.0 - hr * 0.4, -hr * 2.3 - Math.sin(now * 0.006 + mn) * 7, mn * hr * 0.85 - hr * 0.2); ctx.stroke(); }
    var grd = ctx.createLinearGradient(0, -hr, 0, hr * 0.9); grd.addColorStop(0, p.back); grd.addColorStop(0.55, p.base); grd.addColorStop(1, p.belly);
    ctx.beginPath();
    ctx.moveTo(-hr * 0.7, -hr * 0.5); ctx.quadraticCurveTo(hr * 0.05, -hr * 0.95, hr * 0.95, -hr * 0.5);
    ctx.quadraticCurveTo(hr * 1.7, -hr * 0.22, hr * 2.05, -hr * 0.02); ctx.lineTo(hr * 2.05, hr * 0.08);
    ctx.quadraticCurveTo(hr * 1.6, hr * 0.26, hr * 1.05, hr * 0.46); ctx.quadraticCurveTo(hr * 0.3, hr * 0.66, -hr * 0.7, hr * 0.5); ctx.closePath();
    if (p.glow) { ctx.shadowBlur = 10; ctx.shadowColor = p.glow; }
    ctx.fillStyle = grd; ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = p.line; ctx.lineWidth = 1.5; ctx.stroke();
    if (firing) {
      ctx.fillStyle = '#2a0a00'; ctx.beginPath(); ctx.moveTo(hr * 1.0, hr * 0.02); ctx.lineTo(hr * 2.05, hr * 0.06); ctx.lineTo(hr * 1.15, hr * 0.62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = p.tooth; for (var u = 0; u < 4; u++) { var ux = hr * (1.25 + u * 0.22); ctx.beginPath(); ctx.moveTo(ux, hr * 0.04); ctx.lineTo(ux + hr * 0.07, hr * 0.04); ctx.lineTo(ux + hr * 0.035, hr * 0.2); ctx.closePath(); ctx.fill(); }
    } else {
      ctx.fillStyle = p.tooth; ctx.beginPath(); ctx.moveTo(hr * 1.9, hr * 0.08); ctx.lineTo(hr * 1.78, hr * 0.08); ctx.lineTo(hr * 1.86, hr * 0.32); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = p.line; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hr * 1.0, hr * 0.22); ctx.lineTo(hr * 2.0, hr * 0.05); ctx.stroke();
    }
    ctx.strokeStyle = p.line; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(hr * 1.72, -hr * 0.12, 1.5, 0.4, 3.4); ctx.stroke();
    ctx.strokeStyle = p.belly; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    [1, -1].forEach(function (s) {
      var by = -hr * 0.5 + (s < 0 ? hr * 0.25 : 0);
      ctx.beginPath(); ctx.moveTo(-hr * 0.2, by); ctx.quadraticCurveTo(-hr * 1.1, by - hr * 0.9, -hr * 1.7, by - hr * 1.6); ctx.stroke();
      ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-hr * 0.9, by - hr * 0.6); ctx.lineTo(-hr * 1.3, by - hr * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-hr * 1.35, by - hr * 1.05); ctx.lineTo(-hr * 1.05, by - hr * 1.25); ctx.stroke(); ctx.lineWidth = 2.6;
    });
    ctx.lineCap = 'round';
    ctx.strokeStyle = p.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hr * 0.18, -hr * 0.52); ctx.quadraticCurveTo(hr * 0.6, -hr * 0.66, hr * 0.9, -hr * 0.44); ctx.stroke();
    ctx.shadowBlur = 10; ctx.shadowColor = p.eye; ctx.fillStyle = p.eye; ctx.beginPath(); ctx.ellipse(hr * 0.55, -hr * 0.3, 5.6, 3.4, -0.25, 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = p.pupil; ctx.beginPath(); ctx.ellipse(hr * 0.57, -hr * 0.3, 1.1, 2.8, -0.25, 0, 6.283); ctx.fill();
    ctx.strokeStyle = p.line; ctx.lineWidth = 1.2; var ws = Math.sin(now * 0.0035) * hr * 0.4;
    ctx.beginPath(); ctx.moveTo(hr * 1.95, -hr * 0.04); ctx.quadraticCurveTo(hr * 3.6, -hr * 1.0, hr * 4.4, -hr * 2.4 + ws); ctx.moveTo(hr * 1.95, hr * 0.16); ctx.quadraticCurveTo(hr * 3.5, hr * 0.9, hr * 4.2, hr * 2.2 + ws); ctx.stroke();
    ctx.restore();
  }
  function draw(now) {
    var p = PAL; ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var i, left = [], right = [], minY = 1e9, maxY = -1e9;
    for (i = 0; i < N; i++) { var nrm = normalAt(i), r = radiusAt(i); left.push({ x: pts[i].x + nrm.x * r, y: pts[i].y + nrm.y * r }); right.push({ x: pts[i].x - nrm.x * r, y: pts[i].y - nrm.y * r }); if (pts[i].y < minY) minY = pts[i].y; if (pts[i].y > maxY) maxY = pts[i].y; }
    ctx.beginPath();
    for (i = 1; i < N * 0.85; i++) { var nm = normalAt(i), rr = radiusAt(i); var finH = (9 + 5 * Math.sin(i * 0.5 + now * 0.004)) * Math.min(1, (N - i) / (N * 0.7)); var x = pts[i].x + nm.x * (rr + finH), y = pts[i].y + nm.y * (rr + finH); if (i === 1) ctx.moveTo(pts[i].x + nm.x * rr * 0.6, pts[i].y + nm.y * rr * 0.6); ctx.lineTo(x, y); }
    for (i = Math.floor(N * 0.85) - 1; i >= 1; i--) { var nm2 = normalAt(i), rr2 = radiusAt(i); ctx.lineTo(pts[i].x + nm2.x * rr2 * 0.6, pts[i].y + nm2.y * rr2 * 0.6); }
    ctx.closePath(); ctx.fillStyle = p.fin; ctx.fill(); ctx.strokeStyle = p.finEdge; ctx.lineWidth = 1; ctx.stroke();
    var outline = left.concat(right.slice().reverse()); ctx.beginPath(); smoothClosed(outline); ctx.closePath();
    var bg = ctx.createLinearGradient(0, minY - MAXR, 0, maxY + MAXR); bg.addColorStop(0, p.back); bg.addColorStop(0.5, p.base); bg.addColorStop(1, p.belly);
    ctx.shadowBlur = 14; ctx.shadowColor = p.glow; ctx.fillStyle = bg; ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = p.line; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = p.belly; ctx.globalAlpha = 0.3; ctx.lineWidth = 1;
    for (i = 4; i < N - 5; i += 2) { var n3 = normalAt(i), r3 = radiusAt(i), ang = Math.atan2(n3.ty, n3.tx); for (var s = -1; s <= 1; s++) { var cx = pts[i].x - n3.x * (s * r3 * 0.42), cy = pts[i].y - n3.y * (s * r3 * 0.42); ctx.beginPath(); ctx.arc(cx, cy, r3 * 0.34, ang - 2.4, ang - 0.7); ctx.stroke(); } }
    ctx.globalAlpha = 1;
    var tn = normalAt(N - 1), tail = pts[N - 1]; ctx.fillStyle = p.fin; ctx.strokeStyle = p.finEdge; ctx.lineWidth = 1.2;
    [-1, 0, 1].forEach(function (k) { ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.quadraticCurveTo(tail.x + tn.tx * 12 + tn.x * k * 9, tail.y + tn.ty * 12 + tn.y * k * 9, tail.x + tn.tx * 26 + tn.x * k * 12, tail.y + tn.ty * 26 + tn.y * k * 12); ctx.quadraticCurveTo(tail.x + tn.tx * 16 + tn.x * k * 4, tail.y + tn.ty * 16 + tn.y * k * 4, tail.x, tail.y); ctx.fill(); ctx.stroke(); });
    drawHead(now); drawFire();
  }
  function loop(now) { if (!running) return; step(now); if (firing) spawnFire(); updateFire(); draw(now); rafId = requestAnimationFrame(loop); }
})();
