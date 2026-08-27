/**
 * Main script – portfolio logic, image modal, theme.
 */

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Image Modal functionality
  const imageModal = document.getElementById('imageModal');
  const closeImageModal = document.getElementById('closeImageModal');
  const modalImage = document.getElementById('modalImage');
  const modalImageTitle = document.getElementById('modalImageTitle');
  const imageModalOverlay = imageModal.querySelector('.image-modal-overlay');

  // Zoom & pan state
  const modalImageWrap = document.getElementById('modalImageWrap');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomResetBtn = document.getElementById('zoomReset');
  const zoomLevelEl = document.getElementById('zoomLevel');

  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartPanX = 0;
  let dragStartPanY = 0;

  function updateTransform() {
    if (scale <= 1) {
      panX = 0;
      panY = 0;
    }
    modalImage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    zoomLevelEl.textContent = Math.round(scale * 100) + '%';
    modalImageWrap.classList.toggle('zoomed', scale > 1);
  }

  function resetZoom() {
    scale = 1;
    panX = 0;
    panY = 0;
    updateTransform();
  }

  function zoom(delta) {
    const newScale = Math.min(Math.max(0.25, scale + delta), 5);
    // Zoom toward center
    const rect = modalImageWrap.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const ratio = newScale / scale;
    panX = cx - ratio * (cx - panX);
    panY = cy - ratio * (cy - panY);
    scale = newScale;
    updateTransform();
  }

  zoomInBtn.addEventListener('click', () => zoom(0.3));
  zoomOutBtn.addEventListener('click', () => zoom(-0.3));
  zoomResetBtn.addEventListener('click', resetZoom);

  // Mouse wheel zoom
  modalImageWrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    zoom(delta);
  }, { passive: false });

  // Drag to pan
  modalImageWrap.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartPanX = panX;
    dragStartPanY = panY;
    modalImageWrap.classList.add('dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = dragStartPanX + (e.clientX - dragStartX);
    panY = dragStartPanY + (e.clientY - dragStartY);
    updateTransform();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    modalImageWrap.classList.remove('dragging');
  });

  // Touch drag to pan
  modalImageWrap.addEventListener('touchstart', (e) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragStartPanX = panX;
    dragStartPanY = panY;
    modalImageWrap.classList.add('dragging');
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    panX = dragStartPanX + (e.touches[0].clientX - dragStartX);
    panY = dragStartPanY + (e.touches[0].clientY - dragStartY);
    updateTransform();
  }, { passive: true });

  document.addEventListener('touchend', () => {
    isDragging = false;
    modalImageWrap.classList.remove('dragging');
  });

  // Handle image clicks (showcase cards)
  document.addEventListener('click', (e) => {
    const imageWrapper = e.target.closest('.showcase-image-wrapper');
    if (imageWrapper) {
      e.preventDefault();
      e.stopPropagation();
      const imageUrl = imageWrapper.getAttribute('data-image-url');
      const imageTitle = imageWrapper.getAttribute('data-image-title');
      modalImage.src = imageUrl;
      modalImage.alt = imageTitle;
      modalImageTitle.textContent = imageTitle;
      resetZoom();
      imageModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  });

  function closeModal() {
    imageModal.classList.remove('show');
    document.body.style.overflow = '';
    resetZoom();
  }

  closeImageModal.addEventListener('click', closeModal);
  imageModalOverlay.addEventListener('click', closeModal);

  // Close image modal on Escape key (takes priority when stacked above the readme modal)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('show')) {
      closeModal();
      e.stopImmediatePropagation();
    }
  });

  // Awards timeline progress bar
  const timelineProgress = document.getElementById('timelineProgress');
  const awardsTimeline = document.querySelector('.awards-timeline');
  if (timelineProgress && awardsTimeline) {
    const updateProgress = () => {
      const rect = awardsTimeline.getBoundingClientRect();
      const timelineHeight = awardsTimeline.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrolled = viewportHeight - rect.top;
      const progress = Math.min(Math.max(scrolled / timelineHeight, 0), 1);
      timelineProgress.style.height = (progress * 100) + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // Top nav
  const topNav = document.getElementById('topNav');
  const navLinks = document.querySelectorAll('.topnav-link');
  const navSections = Array.from(navLinks).map(link => ({
    link,
    section: document.getElementById(link.dataset.section)
  })).filter(item => item.section);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const vibrate = (pattern) => navigator.vibrate?.(pattern);

  // Theme toggle docking: a single fixed button whose top/left are driven to
  // match either the header anchor or the nav anchor, animated via CSS transition
  // on those properties, so it reads as one element traveling, not two fading in/out.
  const themeToggleEl = document.getElementById('themeToggle');
  const themeToggleHomeAnchor = document.getElementById('themeToggleHomeAnchor');
  const themeToggleDockAnchor = document.getElementById('themeToggleDockAnchor');
  let toggleDocked = false;
  let homeRect = null;
  let dockRect = null;

  const applyRect = (rect) => {
    themeToggleEl.style.top = `${rect.top}px`;
    themeToggleEl.style.left = `${rect.left}px`;
  };

  if (themeToggleEl && themeToggleHomeAnchor && themeToggleDockAnchor) {
    // Cache both anchor positions now, before .topnav's entrance animation ever runs.
    // Reading them live mid-transition instead would capture a transient position from
    // navAppear's transform keyframes (it wobbles) rather than the element's true resting spot.
    homeRect = themeToggleHomeAnchor.getBoundingClientRect();
    dockRect = themeToggleDockAnchor.getBoundingClientRect();

    // Place instantly at the header slot on load, no transition, then re-enable it.
    themeToggleEl.style.transition = 'none';
    applyRect(homeRect);
    requestAnimationFrame(() => {
      themeToggleEl.style.transition = '';
    });

    window.addEventListener('resize', () => {
      homeRect = themeToggleHomeAnchor.getBoundingClientRect();
      dockRect = themeToggleDockAnchor.getBoundingClientRect();
      applyRect(toggleDocked ? dockRect : homeRect);
    });
  }

  const SCROLL_THRESHOLD = 60;
  let lastActive = null;
  let navVisible = false;
  const onScroll = () => {
    // Show/hide navbar based on scroll position
    const shouldShow = window.scrollY > SCROLL_THRESHOLD;
    if (shouldShow && !navVisible) {
      topNav.classList.remove('visible');
      void topNav.offsetWidth; // reflow
      topNav.classList.add('visible');
      navVisible = true;
      // Funny landing thud: strong-pause-soft-pause-soft
      vibrate([80, 40, 30, 20, 15]);
    } else if (!shouldShow && navVisible) {
      topNav.classList.remove('visible');
      navVisible = false;
    }

    if (themeToggleEl && shouldShow !== toggleDocked) {
      toggleDocked = shouldShow;
      applyRect(toggleDocked ? dockRect : homeRect);
    }

    // Active section tracking
    const scrollPos = window.scrollY + window.innerHeight / 3;
    let current = navSections[0];
    for (const item of navSections) {
      if (item.section.offsetTop <= scrollPos) current = item;
    }

    if (current.link !== lastActive) {
      navLinks.forEach(l => l.classList.remove('active'));
      current.link.classList.add('active');
      lastActive = current.link;
    }
  };

  // Short tap buzz on nav link click
  navLinks.forEach(link => {
    link.addEventListener('pointerdown', () => vibrate(12));
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Skills marquee: auto-scrolls, pauses on hover, stays manually scrollable/draggable
  const skillsMarquee = document.getElementById('skillsMarquee');
  if (skillsMarquee) {
    const track = document.getElementById('skillsTrack');
    const SPEED = 0.4;
    let paused = false;
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let resumeTimer = null;

    const loopWidth = () => track.scrollWidth / 2;

    const wrapScroll = () => {
      const lw = loopWidth();
      if (skillsMarquee.scrollLeft >= lw) skillsMarquee.scrollLeft -= lw;
      else if (skillsMarquee.scrollLeft < 0) skillsMarquee.scrollLeft += lw;
    };

    const pauseTemporarily = () => {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 2000);
    };

    // scrollLeft is rounded to an integer by the browser, so a sub-pixel
    // per-frame increment must be accumulated in JS, not read back each tick.
    let scrollPos = skillsMarquee.scrollLeft;
    let wasIdle = true;

    (function tick() {
      if (paused || dragging) {
        wasIdle = true;
      } else {
        if (wasIdle) {
          scrollPos = skillsMarquee.scrollLeft; // resync after manual interaction
          wasIdle = false;
        }
        scrollPos += SPEED;
        const lw = loopWidth();
        if (scrollPos >= lw) scrollPos -= lw;
        else if (scrollPos < 0) scrollPos += lw;
        skillsMarquee.scrollLeft = scrollPos;
      }
      requestAnimationFrame(tick);
    })();

    skillsMarquee.addEventListener('mouseenter', () => { paused = true; });
    skillsMarquee.addEventListener('mouseleave', () => { if (!dragging) paused = false; });
    skillsMarquee.addEventListener('wheel', pauseTemporarily, { passive: true });
    skillsMarquee.addEventListener('touchstart', () => { paused = true; }, { passive: true });
    skillsMarquee.addEventListener('touchend', pauseTemporarily, { passive: true });

    skillsMarquee.addEventListener('mousedown', (e) => {
      dragging = true;
      paused = true;
      dragStartX = e.clientX;
      dragStartScroll = skillsMarquee.scrollLeft;
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      skillsMarquee.scrollLeft = dragStartScroll - (e.clientX - dragStartX);
      wrapScroll();
    });
    window.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        pauseTemporarily();
      }
    });
  }

  // Use Case (README) Modal
  const USE_CASES = {
    'news-scheduling': {
      owner: 'abdul-rehman-amer-baig',
      repo: 'usecase-system-design-news-scheduling',
      branch: 'main',
      title: 'News Scheduling Architecture',
    },
  };

  const readmeModal = document.getElementById('readmeModal');
  const readmeModalBody = document.getElementById('readmeModalBody');
  const readmeModalTitle = document.getElementById('readmeModalTitle');
  const readmeModalRepoLink = document.getElementById('readmeModalRepoLink');
  const closeReadmeModalBtn = document.getElementById('closeReadmeModal');
  const readmeCache = {};

  async function openReadmeModal(key) {
    const useCase = USE_CASES[key];
    if (!useCase || !readmeModal) return;

    const repoUrl = `https://github.com/${useCase.owner}/${useCase.repo}`;
    const rawBase = `https://raw.githubusercontent.com/${useCase.owner}/${useCase.repo}/${useCase.branch}/`;

    readmeModalTitle.textContent = useCase.title;
    readmeModalRepoLink.href = repoUrl;
    readmeModalBody.innerHTML = '<div class="readme-loading">Loading use case…</div>';
    readmeModal.classList.add('show');
    document.body.style.overflow = 'hidden';

    try {
      if (!readmeCache[key]) {
        const res = await fetch(`${rawBase}README.md`);
        if (!res.ok) throw new Error('README fetch failed');
        const markdown = await res.text();
        readmeCache[key] = marked.parse(markdown);
      }
      readmeModalBody.innerHTML = readmeCache[key];
      readmeModalBody.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src');
        if (src && !/^https?:\/\//.test(src)) {
          img.src = rawBase + src.replace(/^\.?\//, '');
        }
        img.addEventListener('click', () => {
          modalImage.src = img.src;
          modalImage.alt = img.alt || '';
          modalImageTitle.textContent = img.alt || '';
          resetZoom();
          imageModal.classList.add('show');
          document.body.style.overflow = 'hidden';
        });
      });
    } catch (err) {
      readmeModalBody.innerHTML = `<div class="readme-error">Couldn't load this use case right now. <a href="${repoUrl}" target="_blank" rel="noopener noreferrer">View it on GitHub instead</a>.</div>`;
    }
  }

  function closeReadmeModal() {
    readmeModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (readmeModal) {
    document.querySelectorAll('[data-usecase]').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        openReadmeModal(card.dataset.usecase);
      });
    });

    closeReadmeModalBtn.addEventListener('click', closeReadmeModal);
    readmeModal.querySelector('.readme-modal-overlay').addEventListener('click', closeReadmeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && readmeModal.classList.contains('show')) closeReadmeModal();
    });
  }
});

// Favicon by theme (light = black on cream, dark = purple on dark)
const FAVICON_LIGHT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23fef9e6'/%3E%3Ccircle cx='24' cy='14' r='3.25' fill='%23d97706'/%3E%3Ccircle cx='13' cy='34' r='3.25' fill='%23d97706'/%3E%3Ccircle cx='35' cy='34' r='3.25' fill='%23d97706'/%3E%3Cpath d='M24 17.25v6.5M24 23.75l-9 3.25M24 23.75l9 3.25' stroke='%23d97706' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";
const FAVICON_DARK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23151515'/%3E%3Ccircle cx='24' cy='14' r='3.25' fill='%23c4b5fd'/%3E%3Ccircle cx='13' cy='34' r='3.25' fill='%23c4b5fd'/%3E%3Ccircle cx='35' cy='34' r='3.25' fill='%23c4b5fd'/%3E%3Cpath d='M24 17.25v6.5M24 23.75l-9 3.25M24 23.75l9 3.25' stroke='%23c4b5fd' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";

function setFavicon(theme) {
  const link = document.getElementById('favicon');
  if (link) link.href = theme === 'dark' ? FAVICON_DARK : FAVICON_LIGHT;
}

// Theme Toggle Functionality (header button + floating button next to the sticky nav)
const themeToggles = Array.from(document.querySelectorAll('.theme-toggle'));
if (themeToggles.length) {
  const html = document.documentElement;
  const currentTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', currentTheme);
  themeToggles.forEach((btn) => updateThemeIcon(currentTheme, btn.querySelector('.theme-icon')));
  setFavicon(currentTheme);

  themeToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeToggles.forEach((b) => updateThemeIcon(newTheme, b.querySelector('.theme-icon')));
      setFavicon(newTheme);
    });
  });
}

function updateThemeIcon(theme, el) {
  if (el) el.textContent = theme === 'dark' ? '☀️' : '🌙';
}
