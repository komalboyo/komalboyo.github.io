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

  // ===== synthesized guitar riff on strum =====
  var AC = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function pluck(freq, when, dur) {
    if (!AC) return;
    var o = AC.createOscillator(), o2 = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'sawtooth'; o2.type = 'triangle';
    o.frequency.value = freq; o2.frequency.value = freq * 2.004;
    lp.type = 'lowpass'; lp.Q.value = 1;
    lp.frequency.setValueAtTime(Math.min(7000, freq * 8), when);
    lp.frequency.exponentialRampToValueAtTime(Math.max(420, freq * 1.6), when + dur * 0.9);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.15, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(AC.destination);
    o.start(when); o2.start(when); o.stop(when + dur + 0.05); o2.stop(when + dur + 0.05);
  }
  function riff() {
    if (!audio()) return;
    var t = AC.currentTime, chord = [110, 164.81, 220, 261.63, 329.63, 440];
    chord.forEach(function (f, i) { pluck(f, t + i * 0.055, 1.4); });
  }
  function play() { strum(); audio(); riff(); }

  // Opening strum once the page settles.
  setTimeout(strum, 700);

  // Gentle, periodic strums.
  setInterval(strum, 6500);

  // Strum on hover / tap.
  guitar.addEventListener('mouseenter', play);
  guitar.addEventListener('click', play);

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
