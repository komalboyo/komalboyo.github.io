// ===== Theme Toggle =====
(function () {
  var toggle = document.getElementById('theme-toggle');
  var html = document.documentElement;

  // Check for saved preference, default to light
  var saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    html.setAttribute('data-theme', 'dark');
  }

  toggle.addEventListener('click', function () {
    var isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
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
