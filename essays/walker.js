// ===== A little runner that scampers to your cursor (2D) =====
// Procedural stick figure: runs toward the cursor wherever it is, full run
// cycle (legs, arms, lean, bob), walks when close, stands when it arrives.
// Theme-aware, pointer-events none, off under reduced-motion.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // desktop only: no cursor on phones/tablets, so skip the follower entirely
  if (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches)) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'walker-canvas';
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

  // feet position eases toward the cursor; body is drawn above the feet
  var figX = W * 0.5, figY = H * 0.5;
  var targetX = W * 0.5, targetY = H * 0.5;
  var vx = 0, phase = 0, dir = 1;

  function setTarget(x, y) {
    targetX = Math.max(14, Math.min(W - 14, x));
    targetY = Math.max(70, Math.min(H - 10, y));
  }
  window.addEventListener('mousemove', function (e) { setTarget(e.clientX, e.clientY); });
  window.addEventListener('touchmove', function (e) {
    var t = e.touches && e.touches[0]; if (t) setTarget(t.clientX, t.clientY);
  }, { passive: true });

  function palette() {
    var th = document.documentElement.getAttribute('data-theme');
    if (th === 'disco') return { stroke: '#ff2d95', glow: '#ff2d95' };
    if (th === 'dark') return { stroke: 'rgba(224,221,216,0.9)', glow: '' };
    return { stroke: 'rgba(26,26,26,0.85)', glow: '' };
  }

  function update() {
    var dx = targetX - figX, dy = targetY - figY;
    vx = Math.max(-8, Math.min(8, dx * 0.12));
    var vy = Math.max(-8, Math.min(8, dy * 0.12));
    if (Math.abs(dx) < 1) vx = 0;
    if (Math.abs(dy) < 1) vy = 0;
    figX += vx; figY += vy;
    var speed = Math.hypot(vx, vy);
    if (Math.abs(vx) > 0.3) dir = vx > 0 ? 1 : -1;
    if (speed > 0.3) phase += 0.16 + speed * 0.11;
    return speed;
  }

  function drawFigure(speed, pal) {
    var moving = speed > 0.4;
    var lean = Math.min(speed * 0.9, 7) * dir;
    var stride = Math.min(speed, 7) * 1.7;
    var lift = Math.min(speed, 7) * 1.35;
    var bob = Math.abs(Math.sin(phase)) * Math.min(speed, 6) * 0.5;

    var legLen = 20, torso = 18, headR = 6, armLen = 14;
    var ground = figY;                       // feet rest at the cursor point
    var hipX = figX, hipY = ground - legLen - bob;
    var neckX = hipX + lean, neckY = hipY - torso;
    var headX = neckX + dir * 2, headY = neckY - headR - 1;
    var shX = neckX + lean * 0.2, shY = neckY + 4;

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = pal.stroke; ctx.lineWidth = 2.2;
    if (pal.glow) { ctx.shadowBlur = 8; ctx.shadowColor = pal.glow; } else { ctx.shadowBlur = 0; }

    // legs
    for (var k = 0; k < 2; k++) {
      var ph = phase + k * Math.PI, sw, ft;
      if (moving) { sw = Math.sin(ph) * stride; ft = Math.max(0, Math.sin(ph)) * lift; }
      else { sw = (k === 0 ? -4 : 4); ft = 0; }
      var footX = moving ? hipX + dir * sw + lean * 0.3 : hipX + sw;
      var footY = ground - ft;
      var kneeX = (hipX + footX) / 2 + dir * 3, kneeY = (hipY + footY) / 2 + 2;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY); ctx.lineTo(kneeX, kneeY); ctx.lineTo(footX, footY);
      ctx.stroke();
    }

    // spine
    ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(neckX, neckY); ctx.stroke();

    // arms
    for (k = 0; k < 2; k++) {
      var aph = phase + k * Math.PI + Math.PI, handX, handY;
      if (moving) { handX = shX + dir * Math.sin(aph) * stride * 0.85; handY = shY + armLen * 0.7 + Math.cos(aph) * 4; }
      else { handX = shX + (k === 0 ? -4 : 4); handY = shY + armLen * 0.9; }
      var elbowX = (shX + handX) / 2 + dir * 2, elbowY = (shY + handY) / 2 + 4;
      ctx.beginPath();
      ctx.moveTo(shX, shY); ctx.lineTo(elbowX, elbowY); ctx.lineTo(handX, handY);
      ctx.stroke();
    }

    // head
    ctx.beginPath(); ctx.arc(headX, headY, headR, 0, Math.PI * 2); ctx.stroke();
  }

  function loop() {
    var speed = update();
    ctx.clearRect(0, 0, W, H);
    drawFigure(speed, palette());
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
