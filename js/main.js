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

  // Sums the offsetParent chain. Unlike getBoundingClientRect this ignores transforms, so the
  // header's fadeInUp and navAppear's wobble keyframes can't skew the measured resting spot,
  // and it's independent of scroll position (e.g. a mobile URL-bar resize while scrolled).
  const restingOffset = (el) => {
    let top = 0;
    let left = 0;
    for (let node = el; node; node = node.offsetParent) {
      top += node.offsetTop;
      left += node.offsetLeft;
    }
    return { top, left };
  };

  const measureAnchors = () => {
    homeRect = restingOffset(themeToggleHomeAnchor);
    dockRect = restingOffset(themeToggleDockAnchor);
  };

  const syncToggle = () => {
    measureAnchors();
    applyRect(toggleDocked ? dockRect : homeRect);
  };

  if (themeToggleEl && themeToggleHomeAnchor && themeToggleDockAnchor) {
    // Place instantly at the header slot on load, no transition, then re-enable it.
    measureAnchors();
    themeToggleEl.style.transition = 'none';
    applyRect(homeRect);
    requestAnimationFrame(() => {
      themeToggleEl.style.transition = '';
    });

    // Web fonts and late styles shift the header after first paint; re-measure once they land.
    window.addEventListener('resize', syncToggle);
    window.addEventListener('load', syncToggle);
    document.fonts?.ready.then(syncToggle);
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
    'task-scheduling': {
      owner: 'abdul-rehman-amer-baig',
      repo: 'usecase-system-design-task-scheduling',
      branch: 'main',
      title: 'One-Off Task Scheduling',
    },
    'url-shortener': {
      owner: 'abdul-rehman-amer-baig',
      repo: 'system-design-url-shortener',
      branch: 'main',
      // The write-up lives in the project folder, not the repo-root README
      dir: 'url-shortener',
      title: 'URL Shortener',
    },
    'task-tracker': {
      owner: 'abdul-rehman-amer-baig',
      repo: 'task-tracker',
      branch: 'main',
      title: 'Task Tracker',
    },
  };

  // The write-up the "read the latest" banner opens; update when a newer one lands
  const LATEST_USE_CASE = 'task-scheduling';

  const readmeModal = document.getElementById('readmeModal');
  const readmeModalBody = document.getElementById('readmeModalBody');
  const readmeModalTitle = document.getElementById('readmeModalTitle');
  const readmeModalRepoLink = document.getElementById('readmeModalRepoLink');
  const closeReadmeModalBtn = document.getElementById('closeReadmeModal');
  const readmeModalCopyLink = document.getElementById('readmeModalCopyLink');
  const readmeModalCopyLabel = document.getElementById('readmeModalCopyLabel');
  const readmeCache = {};

  // Shareable deep links: each use case pop-up lives at #use-case/<key>
  const USE_CASE_HASH_PREFIX = '#use-case/';
  const useCaseKeyFromHash = () => {
    if (!location.hash.startsWith(USE_CASE_HASH_PREFIX)) return null;
    const key = decodeURIComponent(location.hash.slice(USE_CASE_HASH_PREFIX.length));
    return USE_CASES[key] ? key : null;
  };
  // True when this page pushed the history entry for the open pop-up, so closing can go
  // back to it; false when the visitor arrived via a shared link (nothing to go back to)
  let pushedUseCaseEntry = false;

  async function openReadmeModal(key, { updateUrl = true } = {}) {
    const useCase = USE_CASES[key];
    if (!useCase || !readmeModal) return;

    if (updateUrl && useCaseKeyFromHash() !== key) {
      history.pushState({ useCase: key }, '', `${USE_CASE_HASH_PREFIX}${key}`);
      pushedUseCaseEntry = true;
    }
    readmeModalCopyLink.classList.remove('copied');
    readmeModalCopyLabel.textContent = 'Copy link';

    const repoUrl = `https://github.com/${useCase.owner}/${useCase.repo}`;
    const dirPath = useCase.dir ? `${useCase.dir}/` : '';
    const rawBase = `https://raw.githubusercontent.com/${useCase.owner}/${useCase.repo}/${useCase.branch}/${dirPath}`;

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

  function hideReadmeModal() {
    readmeModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  function closeReadmeModal() {
    if (!useCaseKeyFromHash()) {
      hideReadmeModal();
    } else if (pushedUseCaseEntry) {
      // Pop our own entry; the popstate handler hides the modal
      pushedUseCaseEntry = false;
      history.back();
    } else {
      // Arrived via a shared link: drop the hash without adding history
      history.replaceState(null, '', location.pathname + location.search);
      hideReadmeModal();
    }
  }

  if (readmeModal) {
    // Back/forward: open or close the pop-up to match the URL
    window.addEventListener('popstate', () => {
      const key = useCaseKeyFromHash();
      if (key) {
        openReadmeModal(key, { updateUrl: false });
      } else {
        pushedUseCaseEntry = false;
        hideReadmeModal();
      }
    });

    // Shared link on load: bring the Use Cases section into view behind the pop-up, then open it
    const initialKey = useCaseKeyFromHash();
    if (initialKey) {
      document.getElementById('useCasesSection')?.scrollIntoView();
      openReadmeModal(initialKey, { updateUrl: false });
    }

    readmeModalCopyLink.addEventListener('click', async () => {
      const key = useCaseKeyFromHash();
      const url = `${location.href.split('#')[0]}${key ? USE_CASE_HASH_PREFIX + key : ''}`;
      try {
        await navigator.clipboard.writeText(url);
        readmeModalCopyLabel.textContent = 'Copied!';
        readmeModalCopyLink.classList.add('copied');
      } catch {
        // Clipboard blocked (e.g. insecure context): leave the URL in the address bar to copy by hand
        readmeModalCopyLabel.textContent = 'Copy from address bar';
      }
      setTimeout(() => {
        readmeModalCopyLabel.textContent = 'Copy link';
        readmeModalCopyLink.classList.remove('copied');
      }, 2000);
    });

    document.querySelectorAll('[data-usecase]').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        // Diagram clicks open the image viewer (document-level handler), not the README
        if (e.target.closest('.showcase-image-wrapper')) return;
        openReadmeModal(card.dataset.usecase);
      });
    });

    // Banner opens the latest write-up directly; its href is the same deep link, so
    // cmd/middle-click still opens a shareable URL in a new tab
    const wipBanner = document.querySelector('.wip-banner');
    if (wipBanner && USE_CASES[LATEST_USE_CASE]) {
      wipBanner.href = `${USE_CASE_HASH_PREFIX}${LATEST_USE_CASE}`;
      wipBanner.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        // Scroll first so closing the pop-up leaves the visitor at the Use Cases section
        document.getElementById('useCasesSection')?.scrollIntoView();
        openReadmeModal(LATEST_USE_CASE);
      });
    }

    closeReadmeModalBtn.addEventListener('click', closeReadmeModal);
    readmeModal.querySelector('.readme-modal-overlay').addEventListener('click', closeReadmeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && readmeModal.classList.contains('show')) closeReadmeModal();
    });
  }

  // Use Cases row: prev/next arrows step one card at a time; disabled at either end
  const usecaseRow = document.querySelector('.usecase-list');
  const usecasePrev = document.getElementById('usecasePrev');
  const usecaseNext = document.getElementById('usecaseNext');
  if (usecaseRow && usecasePrev && usecaseNext) {
    const step = () => {
      const card = usecaseRow.querySelector('.showcase-card');
      const gap = parseFloat(getComputedStyle(usecaseRow).columnGap) || 0;
      return card ? card.offsetWidth + gap : usecaseRow.clientWidth;
    };

    const updateArrows = () => {
      const maxScroll = usecaseRow.scrollWidth - usecaseRow.clientWidth;
      usecasePrev.disabled = usecaseRow.scrollLeft <= 1;
      usecaseNext.disabled = usecaseRow.scrollLeft >= maxScroll - 1;
    };

    usecasePrev.addEventListener('click', () => usecaseRow.scrollBy({ left: -step(), behavior: 'smooth' }));
    usecaseNext.addEventListener('click', () => usecaseRow.scrollBy({ left: step(), behavior: 'smooth' }));

    let arrowFrame = null;
    usecaseRow.addEventListener('scroll', () => {
      cancelAnimationFrame(arrowFrame);
      arrowFrame = requestAnimationFrame(updateArrows);
    }, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();
  }

  // Contact links: number/address are base64 in the markup so scrapers don't get them for free
  document.querySelectorAll('[data-wa]').forEach((link) => {
    const number = atob(link.dataset.wa);
    const text = encodeURIComponent(link.dataset.waText || '');
    link.href = `https://wa.me/${number}${text ? `?text=${text}` : ''}`;
  });

  document.querySelectorAll('[data-mail]').forEach((link) => {
    const address = atob(link.dataset.mail);
    const params = new URLSearchParams();
    if (link.dataset.mailSubject) params.set('subject', link.dataset.mailSubject);
    if (link.dataset.mailBody) params.set('body', link.dataset.mailBody);
    const query = params.toString().replace(/\+/g, '%20'); // mail clients want %20, not +
    link.href = `mailto:${address}${query ? `?${query}` : ''}`;
  });

  /* ---------------------------------------------------------------------------
     Write-up backlog: everything queued up, grouped by theme behind a toggle.
     Add an entry here and the counts, progress bar and groups all follow.
     --------------------------------------------------------------------------- */
  const PLANNED_WRITE_UPS = [
    { title: 'AI prescribing templates', theme: 'AI & Healthcare' },
    { title: 'The Twilio bill that doubled', theme: 'Cost & Performance' },
    { title: 'Building recurring subscriptions on Stripe', theme: 'Payments' },
    { title: 'Splitting payments across vendors with Mollie', theme: 'Payments' },
    { title: 'AI Scribe: consultation notes from conversation', theme: 'AI & Healthcare' },
    { title: 'Telehealth billing by call duration', theme: 'AI & Healthcare' },
    { title: 'Wallet auto top-up with payment_intent', theme: 'Payments' },
    { title: 'Background jobs without Redis or Celery', theme: 'Cost & Performance' },
    { title: 'Short-lived access tokens and a refresh flow', theme: 'Security' },
    { title: 'Reviewing code for a team of two', theme: 'Leadership' },
  ];

  const published = Object.keys(USE_CASES).length;
  const total = published + PLANNED_WRITE_UPS.length;
  const percent = Math.round((published / total) * 100);

  // The top banner carries the same progress, so both move together
  const backlogBanner = document.querySelector('.wip-banner');
  if (backlogBanner && !backlogBanner.querySelector('.wu-banner-progress')) {
    const progress = document.createElement('span');
    progress.className = 'wu-banner-progress';
    // The bar is decorative here: the count beside it already states the numbers,
    // and marking it up as a progressbar too would announce them twice
    progress.innerHTML = `
      <span class="wu-track wu-track-mini" aria-hidden="true"><span class="wu-fill" style="width: ${percent}%"></span></span>
      <span class="wu-banner-count">${published}/${total}</span>`;
    backlogBanner.insertBefore(progress, backlogBanner.querySelector('.wip-banner-arrow'));
  }

  /* The backlog panel is a working document, so it only shows while developing:
     on localhost / Live Server / a file:// open, or with ?backlog in the URL to
     spot-check it on the published site. Note this only hides it — the titles are
     still in this file, so treat them as public. */
  const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', ''];
  const showBacklog =
    LOCAL_HOSTS.includes(location.hostname) ||
    location.protocol === 'file:' ||
    new URLSearchParams(location.search).has('backlog');

  const backlogEl = document.getElementById('writeUpBacklog');
  if (backlogEl && showBacklog) {
    const themes = [...new Set(PLANNED_WRITE_UPS.map((w) => w.theme))];
    const inTheme = (theme) => PLANNED_WRITE_UPS.filter((w) => w.theme === theme);

    backlogEl.className = 'wu-panel';
    backlogEl.innerHTML = `
      <div class="wu-head">
        <span class="usecase-more-dot" aria-hidden="true"></span>
        <span class="wu-head-title">Write-ups published</span>
        <span class="wu-count"><strong>${published}</strong> of ${total}</span>
      </div>
      <div class="wu-track" role="progressbar" aria-valuenow="${published}" aria-valuemin="0" aria-valuemax="${total}" aria-label="Write-ups published">
        <div class="wu-fill" style="width: ${percent}%"></div>
      </div>
      <div class="wu-summary">
        ${themes.map((theme) => `
          <span class="wu-summary-item">${theme}<span class="wu-summary-count">${inTheme(theme).length}</span></span>`).join('')}
      </div>
      <div class="wu-details" id="writeUpBacklogDetails">
        <div class="wu-details-inner">
          <div class="wu-groups">
            ${themes.map((theme) => `
              <div class="wu-group">
                <div class="wu-group-head">
                  <span class="wu-group-name">${theme}</span>
                  <span class="wu-group-count">${inTheme(theme).length}</span>
                </div>
                <ul class="wu-list">
                  ${inTheme(theme).map((w) => `<li class="wu-item">${w.title}</li>`).join('')}
                </ul>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <button type="button" class="wu-toggle" aria-expanded="false" aria-controls="writeUpBacklogDetails">
        <span class="wu-toggle-text">Show all ${PLANNED_WRITE_UPS.length}</span>
        <svg class="wu-toggle-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>`;

    const toggle = backlogEl.querySelector('.wu-toggle');
    const toggleText = backlogEl.querySelector('.wu-toggle-text');
    toggle.addEventListener('click', () => {
      const open = backlogEl.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggleText.textContent = open ? 'Show less' : `Show all ${PLANNED_WRITE_UPS.length}`;
    });
  }

  // Contact tooltips: show the address/number itself. mailto only helps visitors with a
  // desktop client, and plenty of people would rather save the number than open a chat.
  const noHover = window.matchMedia('(hover: none)').matches;

  document.querySelectorAll('.contact-wrap').forEach((wrap) => {
    const link = wrap.querySelector('[data-mail], [data-wa]');
    const valueEl = wrap.querySelector('.contact-value');
    const copyBtn = wrap.querySelector('.contact-copy');
    if (!link || !valueEl || !copyBtn) return;

    const copyValue = link.dataset.mail ? atob(link.dataset.mail) : `+${atob(link.dataset.wa)}`;
    valueEl.textContent = link.dataset.waDisplay || copyValue;

    const defaultLabel = copyBtn.getAttribute('aria-label');
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      // A pointer click leaves focus on the button, and :focus-within would keep this
      // tooltip open after the pointer moves to the other icon. detail === 0 means
      // keyboard activation, where focus must stay put.
      if (e.detail > 0) copyBtn.blur();
      try {
        await navigator.clipboard.writeText(copyValue);
      } catch {
        // Clipboard blocked (insecure context): select the text so Cmd/Ctrl+C works
        const range = document.createRange();
        range.selectNodeContents(valueEl);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      copyBtn.classList.add('copied');
      copyBtn.setAttribute('aria-label', copyBtn.dataset.copiedLabel);
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.setAttribute('aria-label', defaultLabel);
      }, 2000);
    });

    // No hover on touch: first tap reveals the tooltip, a second follows the link
    if (noHover) {
      link.addEventListener('click', (e) => {
        if (!wrap.classList.contains('tip-open')) {
          e.preventDefault();
          // Only one tooltip open at a time
          document.querySelectorAll('.contact-wrap.tip-open').forEach((w) => w.classList.remove('tip-open'));
          wrap.classList.add('tip-open');
        }
      });
    }
  });

  if (noHover) {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.contact-wrap')) {
        document.querySelectorAll('.contact-wrap.tip-open').forEach((w) => w.classList.remove('tip-open'));
      }
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
