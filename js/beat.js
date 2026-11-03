(function () {
  const audio = document.getElementById('trackAudio');
  const toggle = document.getElementById('audioToggle');
  if (!audio || !toggle) return;

  const root = document.documentElement;
  const bars = Array.from(toggle.querySelectorAll('.audio-bar'));
  const label = toggle.querySelector('.audio-label');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STORAGE_KEY = 'music';
  const SEEN_KEY = 'music-seen';
  const VOLUME = 0.55;
  const TAPS = [0, 80, 160, 240];        // ms of delay, so the pulse travels across the grid
  const HISTORY = 64;
  const history = Array.from({ length: HISTORY }, () => ({ t: -1, v: 0 }));
  // 240ms is under an eighth note at this tempo, so real hits still get through,
  // but a long saturated kick can no longer re-trigger on its own decay.
  const REFRACTORY = 240;                // ms; one kick must not fire twice
  const DECAY = 210;                     // ms; how long a pulse takes to fall away
  const WINDOW = 60;                     // frames of flux kept for the median
  const fluxWindow = new Float32Array(WINDOW);
  const fluxSorted = new Float32Array(WINDOW);
  let fluxAt = 0;

  let ctx = null;
  let analyser = null;
  let spectrum = null;
  let rafId = null;
  let cursor = 0;
  let level = 0;
  let fadeId = null;
  let lowBand = null;      // [firstBin, lastBin] covering the kick
  let lastLow = null;      // previous frame's low bins, for the onset test
  let lastOnset = 0;
  let lastFrame = 0;
  let primed = false;      // the first frame reads as one huge rise; skip it

  audio.volume = 0;

  function connect() {
    if (ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      ctx = new AudioCtx();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      // barely smoothed: onsets have to stay sharp to be detectable
      analyser.smoothingTimeConstant = 0.1;
      spectrum = new Uint8Array(analyser.frequencyBinCount);
      ctx.createMediaElementSource(audio).connect(analyser);
      analyser.connect(ctx.destination);
      const hzPerBin = ctx.sampleRate / analyser.fftSize;
      lowBand = [
        Math.max(1, Math.round(30 / hzPerBin)),
        Math.min(spectrum.length - 1, Math.round(160 / hzPerBin)),
      ];
      lastLow = new Float32Array(lowBand[1] - lowBand[0] + 1);
    } catch (err) {
      ctx = null;
      analyser = null;
      return false;
    }
    return true;
  }

  function bandLevel(fromHz, toHz) {
    const hzPerBin = ctx.sampleRate / analyser.fftSize;
    const from = Math.max(1, Math.round(fromHz / hzPerBin));
    const to = Math.min(spectrum.length - 1, Math.round(toHz / hzPerBin));
    let sum = 0;
    for (let i = from; i <= to; i += 1) sum += spectrum[i];
    return sum / ((to - from + 1) * 255);
  }

  function fadeTo(target, done) {
    clearInterval(fadeId);
    const step = (target - audio.volume) / 12;
    fadeId = setInterval(() => {
      const next = audio.volume + step;
      if ((step > 0 && next >= target) || (step < 0 && next <= target) || step === 0) {
        audio.volume = target;
        clearInterval(fadeId);
        if (done) done();
        return;
      }
      audio.volume = Math.min(1, Math.max(0, next));
    }, 30);
  }

  function clearBeat() {
    TAPS.forEach((_, i) => root.style.removeProperty(`--beat-${i}`));
    ['a', 'b', 'c'].forEach((k) => root.style.removeProperty(`--wob-${k}`));
    bars.forEach((bar) => bar.style.removeProperty('transform'));
  }

  function sampleAt(when) {
    let best = null;
    for (let i = 0; i < HISTORY; i += 1) {
      const entry = history[i];
      if (entry.t < 0 || entry.t > when) continue;
      if (!best || entry.t > best.t) best = entry;
    }
    return best ? best.v : 0;
  }

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    // time-based, so the feel is the same on a 60 Hz and a 120 Hz display
    const dt = lastFrame ? Math.min(100, now - lastFrame) : 16;
    lastFrame = now;
    analyser.getByteFrequencyData(spectrum);

    // The sub bass sustains between kicks, so loudness alone stays pinned high.
    // Sum only the frame-to-frame *rises* in the low bins: that spikes on the
    // attack of a kick and sits near zero while a bass note merely rings on.
    let flux = 0;
    for (let i = lowBand[0]; i <= lowBand[1]; i += 1) {
      const v = spectrum[i] / 255;
      const k = i - lowBand[0];
      if (v > lastLow[k]) flux += v - lastLow[k];
      lastLow[k] = v;
    }
    if (!primed) {
      primed = true;
      flux = 0;
    }

    // Threshold off the median of the last second, not the mean or the peak: a
    // pad swell or the first frame would drag those up and swallow the kicks.
    fluxWindow[fluxAt] = flux;
    fluxAt = (fluxAt + 1) % WINDOW;
    fluxSorted.set(fluxWindow);
    fluxSorted.sort();
    const median = fluxSorted[WINDOW >> 1];
    const threshold = Math.max(median * 2.2, 0.07);

    // The refractory window stops one kick firing repeatedly as its flux
    // wobbles across the threshold. Quieter hits give a smaller pulse.
    if (flux > threshold && now - lastOnset > REFRACTORY) {
      lastOnset = now;
      level = Math.max(level, Math.min(1, 0.2 + (flux / threshold - 1) * 0.55));
    } else {
      level *= Math.exp(-dt / DECAY);
    }

    history[cursor] = { t: now, v: level };
    cursor = (cursor + 1) % HISTORY;
    TAPS.forEach((delay, i) => {
      root.style.setProperty(`--beat-${i}`, sampleAt(now - delay).toFixed(3));
    });

    // A fast shimmy layered on top of the pulse, so things buzz instead of just
    // swelling. Three different rates, so nothing shakes in step with anything else.
    const sec = now / 1000;
    root.style.setProperty('--wob-a', Math.sin(sec * 69).toFixed(3));
    root.style.setProperty('--wob-b', Math.sin(sec * 44 + 1.7).toFixed(3));
    root.style.setProperty('--wob-c', Math.sin(sec * 94 + 3.1).toFixed(3));

    const eq = [bandLevel(35, 130), bandLevel(130, 400), bandLevel(400, 1800), bandLevel(1800, 7000)];
    bars.forEach((bar, i) => {
      bar.style.transform = `scaleY(${(0.22 + Math.min(1, eq[i] * 1.5) * 0.78).toFixed(3)})`;
    });
  }

  function startVisuals() {
    if (reduceMotion.matches || !analyser || rafId !== null) return;
    root.classList.add('beat-on');
    rafId = requestAnimationFrame(tick);
  }

  function stopVisuals() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    level = 0;
    lastOnset = 0;
    lastFrame = 0;
    primed = false;
    fluxWindow.fill(0);
    if (lastLow) lastLow.fill(0);
    history.forEach((entry) => { entry.t = -1; entry.v = 0; });
    root.classList.remove('beat-on');
    clearBeat();
  }

  const TIPS = {
    off: [
      'Do not press this at work',
      'Warning: the page starts wobbling',
      'Nothing professional happens next',
      'Your colleagues will know',
      'The resume can wait',
    ],
    on: [
      'Make it stop',
      'Okay, that is enough',
      'The cards are tired now',
      'Turning this off is also allowed',
      'My neighbours say hello',
    ],
  };

  function setState(playing) {
    toggle.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    if (label) label.textContent = playing ? 'Dancing' : 'Play the vibe';
    const pool = TIPS[playing ? 'on' : 'off'];
    toggle.dataset.tip = pool[Math.floor(Math.random() * pool.length)];
  }

  async function play() {
    connect();
    if (ctx && ctx.state === 'suspended') {
      try { await ctx.resume(); } catch (err) { /* resumes on the next gesture */ }
    }
    await audio.play();
    fadeTo(VOLUME);
  }

  function pause() {
    fadeTo(0, () => audio.pause());
  }

  audio.addEventListener('play', () => {
    setState(true);
    startVisuals();
  });

  audio.addEventListener('pause', () => {
    setState(false);
    stopVisuals();
  });

  toggle.addEventListener('click', () => {
    const turningOn = audio.paused;
    if (turningOn) {
      play().catch(() => setState(false));
    } else {
      pause();
    }
    toggle.classList.remove('nudge', 'show-tip');
    try {
      localStorage.setItem(STORAGE_KEY, turningOn ? 'on' : 'off');
      localStorage.setItem(SEEN_KEY, '1');
    } catch (err) { /* private mode */ }
    window.goatcounter?.count?.({
      path: `music/${turningOn ? 'play' : 'pause'}`,
      title: turningOn ? 'Music on' : 'Music off',
      event: true,
    });
    window.clarity?.('event', `music/${turningOn ? 'play' : 'pause'}`);
  });

  reduceMotion.addEventListener('change', (e) => {
    if (e.matches) stopVisuals();
    else if (!audio.paused) startVisuals();
  });

  setState(false);

  // returning visitors who left it on get it back, where the browser allows autoplay
  let stored = null;
  let seen = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
    seen = localStorage.getItem(SEEN_KEY);
  } catch (err) { /* private mode */ }
  // The button is hidden on phones. Taking the breakpoint off the computed style
  // keeps the number in the stylesheet, and stops a saved 'on' from autoplaying
  // where there is no visible control to switch it off again.
  const hidden = getComputedStyle(toggle).display === 'none';

  if (stored === 'on' && !hidden) play().catch(() => setState(false));

  // First time here: pulse, and show the tooltip once unprompted. Anyone who has
  // already pressed it has made their choice, so they never see this again.
  if (!seen && !hidden) {
    toggle.classList.add('nudge');
    setTimeout(() => {
      if (!audio.paused || !toggle.classList.contains('nudge')) return;
      toggle.classList.add('show-tip');
      setTimeout(() => toggle.classList.remove('show-tip'), 4000);
    }, 2500);
  }
})();
