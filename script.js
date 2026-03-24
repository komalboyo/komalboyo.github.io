// ===== Theme Toggle (light → dark → disco → light) =====
(function () {
  var toggle = document.getElementById('theme-toggle');
  var html = document.documentElement;
  var themes = ['light', 'dark', 'disco'];

  var saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'disco') {
    html.setAttribute('data-theme', saved);
  }

  toggle.addEventListener('click', function () {
    var current = html.getAttribute('data-theme') || 'light';
    var next = themes[(themes.indexOf(current) + 1) % themes.length];
    if (next === 'light') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', next);
    }
    localStorage.setItem('theme', next);
  });
})();

// ===== Mobile Menu Toggle =====
(function () {
  var menuToggle = document.getElementById('menu-toggle');
  var navLinks = document.getElementById('nav-links');
  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', function () {
    menuToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      menuToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
})();

// ===== Sidenote toggle (mobile) =====
document.querySelectorAll('.sn-num').forEach(function (num) {
  num.addEventListener('click', function () {
    var wrapper = num.closest('.sidenote-wrapper');
    if (wrapper) {
      var note = wrapper.querySelector('.sidenote');
      if (note) {
        note.classList.toggle('active');
      }
    }
  });
});

// ===== Temperature slider =====
(function () {
  var slider = document.getElementById('temp-slider');
  var display = document.getElementById('temp-value');
  if (!slider || !display) return;

  function update() {
    var val = parseFloat(slider.value);
    display.textContent = val.toFixed(2);
    document.querySelectorAll('[data-temp]').forEach(function (el) {
      var threshold = parseFloat(el.dataset.temp);
      el.style.opacity = val >= threshold ? '1' : '0';
      el.style.pointerEvents = val >= threshold ? '' : 'none';
    });
  }

  slider.addEventListener('input', update);
  update();
})();

// ===== Smooth scroll for anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    var target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Disco: 3D tilt on featured essay card =====
(function () {
  var card = document.querySelector('.featured-essay');
  if (!card) return;

  var bound, raf;

  function isDiscoMode() {
    return document.documentElement.getAttribute('data-theme') === 'disco';
  }

  card.addEventListener('mouseenter', function () {
    bound = card.getBoundingClientRect();
  });

  card.addEventListener('mousemove', function (e) {
    if (!isDiscoMode()) return;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var x = (e.clientX - bound.left) / bound.width;
      var y = (e.clientY - bound.top) / bound.height;
      var rotY = (x - 0.5) * 12;  // max ±6deg
      var rotX = (0.5 - y) * 8;   // max ±4deg
      card.style.transform = 'perspective(800px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateZ(8px)';
    });
  });

  card.addEventListener('mouseleave', function () {
    if (!isDiscoMode()) return;
    card.style.transform = '';
  });
})();

// ===== Disco: Subtle mouse-follow glow =====
(function () {
  var glow = null;

  function isDiscoMode() {
    return document.documentElement.getAttribute('data-theme') === 'disco';
  }

  function createGlow() {
    glow = document.createElement('div');
    glow.id = 'disco-glow';
    glow.style.cssText = 'position:fixed;width:300px;height:300px;border-radius:50%;pointer-events:none;z-index:0;' +
      'background:radial-gradient(circle,rgba(255,45,149,0.07) 0%,transparent 70%);' +
      'transition:opacity 0.4s;opacity:0;will-change:transform;';
    document.body.appendChild(glow);
  }

  document.addEventListener('mousemove', function (e) {
    if (!isDiscoMode()) {
      if (glow) glow.style.opacity = '0';
      return;
    }
    if (!glow) createGlow();
    glow.style.opacity = '1';
    glow.style.transform = 'translate(' + (e.clientX - 150) + 'px,' + (e.clientY - 150) + 'px)';
  });
})();
