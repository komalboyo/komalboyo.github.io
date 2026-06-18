// ===== Stairway: strumming guitar =====
(function () {
  var guitar = document.querySelector('.guitar');
  if (!guitar) return;

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  var busy = false;
  function strum() {
    if (busy) return;
    busy = true;
    guitar.classList.add('strum');
    setTimeout(function () {
      guitar.classList.remove('strum');
      busy = false;
    }, 950); // longest string delay (0.25s) + animation (0.6s) + buffer
  }

  // Opening strum once the page settles.
  setTimeout(strum, 700);

  // Gentle, periodic strums.
  setInterval(strum, 6500);

  // Strum on hover / tap.
  guitar.addEventListener('mouseenter', strum);
  guitar.addEventListener('click', strum);

  // Strum when a verse scrolls into view.
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) strum();
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.verse').forEach(function (v) { obs.observe(v); });
  }
})();
