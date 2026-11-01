document.addEventListener('DOMContentLoaded', () => {
  const imageModal = document.getElementById('imageModal');
  const closeImageModal = document.getElementById('closeImageModal');
  const modalImage = document.getElementById('modalImage');
  const modalImageTitle = document.getElementById('modalImageTitle');
  const imageModalOverlay = imageModal.querySelector('.image-modal-overlay');

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

  modalImageWrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    zoom(delta);
  }, { passive: false });

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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('show')) {
      closeModal();
      e.stopImmediatePropagation();
    }
  });

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
    measureAnchors();
    themeToggleEl.style.transition = 'none';
    applyRect(homeRect);
    requestAnimationFrame(() => {
      themeToggleEl.style.transition = '';
    });

    window.addEventListener('resize', syncToggle);
    window.addEventListener('load', syncToggle);
    document.fonts?.ready.then(syncToggle);
  }

  const SCROLL_THRESHOLD = 60;
  let lastActive = null;
  let navVisible = false;
  const onScroll = () => {
    const shouldShow = window.scrollY > SCROLL_THRESHOLD;
    if (shouldShow && !navVisible) {
      topNav.classList.remove('visible');
      void topNav.offsetWidth;
      topNav.classList.add('visible');
      navVisible = true;

      vibrate([80, 40, 30, 20, 15]);
    } else if (!shouldShow && navVisible) {
      topNav.classList.remove('visible');
      navVisible = false;
    }

    if (themeToggleEl && shouldShow !== toggleDocked) {
      toggleDocked = shouldShow;
      applyRect(toggleDocked ? dockRect : homeRect);
    }

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

  navLinks.forEach(link => {
    link.addEventListener('pointerdown', () => vibrate(12));
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

    let scrollPos = skillsMarquee.scrollLeft;
    let wasIdle = true;

    (function tick() {
      if (paused || dragging) {
        wasIdle = true;
      } else {
        if (wasIdle) {
          scrollPos = skillsMarquee.scrollLeft;
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

  const USE_CASES = {
    'ai-prescribing-templates': {
      owner: 'abdul-rehman-amer-baig',
      repo: 'ai-prescribing-templates',
      branch: 'main',
      title: 'AI Prescribing Template Generator',
    },
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

  const LATEST_USE_CASE = 'ai-prescribing-templates';

  const readmeModal = document.getElementById('readmeModal');
  const readmeModalBody = document.getElementById('readmeModalBody');
  const readmeModalTitle = document.getElementById('readmeModalTitle');
  const readmeModalRepoLink = document.getElementById('readmeModalRepoLink');
  const closeReadmeModalBtn = document.getElementById('closeReadmeModal');
  const readmeModalCopyLink = document.getElementById('readmeModalCopyLink');
  const readmeModalCopyLabel = document.getElementById('readmeModalCopyLabel');
  const readmeCache = {};

  const USE_CASE_HASH_PREFIX = '#use-case/';
  const useCaseKeyFromHash = () => {
    if (!location.hash.startsWith(USE_CASE_HASH_PREFIX)) return null;
    const key = decodeURIComponent(location.hash.slice(USE_CASE_HASH_PREFIX.length));
    return USE_CASES[key] ? key : null;
  };

  let pushedUseCaseEntry = false;

  async function openReadmeModal(key, { updateUrl = true } = {}) {
    const useCase = USE_CASES[key];
    if (!useCase || !readmeModal) return;

    if (updateUrl && useCaseKeyFromHash() !== key) {
      history.pushState({ useCase: key }, '', `${USE_CASE_HASH_PREFIX}${key}`);
      pushedUseCaseEntry = true;
    }
    window.goatcounter?.count?.({ path: `writings/${key}`, title: useCase.title, event: true });
    readmeModalCopyLink.classList.remove('copied');
    readmeModalCopyLabel.textContent = 'Copy link';

    const repoUrl = `https://github.com/${useCase.owner}/${useCase.repo}`;
    const dirPath = useCase.dir ? `${useCase.dir}/` : '';
    const rawBase = `https://raw.githubusercontent.com/${useCase.owner}/${useCase.repo}/${useCase.branch}/${dirPath}`;

    readmeModalTitle.textContent = useCase.title;
    readmeModalRepoLink.href = repoUrl;
    readmeModalBody.innerHTML = '<div class="readme-loading">Loading…</div>';
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

      readmeModalBody.querySelectorAll('pre code[class*="language-"]').forEach((block) => {
        const lang = block.className.match(/language-(\S+)/)[1];
        if (window.hljs && hljs.getLanguage(lang)) hljs.highlightElement(block);
      });
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
    } catch {
      readmeModalBody.innerHTML = `<div class="readme-error">Couldn't load this writing right now. <a href="${repoUrl}" target="_blank" rel="noopener noreferrer">View it on GitHub instead</a>.</div>`;
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
      pushedUseCaseEntry = false;
      history.back();
    } else {
      history.replaceState(null, '', location.pathname + location.search);
      hideReadmeModal();
    }
  }

  if (readmeModal) {
    window.addEventListener('popstate', () => {
      const key = useCaseKeyFromHash();
      if (key) {
        openReadmeModal(key, { updateUrl: false });
      } else {
        pushedUseCaseEntry = false;
        hideReadmeModal();
      }
    });

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

        if (e.target.closest('.showcase-image-wrapper')) return;
        openReadmeModal(card.dataset.usecase);
      });
    });

    const wipBanner = document.querySelector('.wip-banner');
    if (wipBanner && USE_CASES[LATEST_USE_CASE]) {
      wipBanner.href = `${USE_CASE_HASH_PREFIX}${LATEST_USE_CASE}`;
      wipBanner.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();

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
    const query = params.toString().replace(/\+/g, '%20');
    link.href = `mailto:${address}${query ? `?${query}` : ''}`;
  });

  const PLANNED_WRITE_UPS = [
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

  const backlogBanner = document.querySelector('.wip-banner');
  if (backlogBanner && !backlogBanner.querySelector('.wu-banner-progress')) {
    const progress = document.createElement('span');
    progress.className = 'wu-banner-progress';

    progress.innerHTML = `
      <span class="wu-track wu-track-mini" aria-hidden="true"><span class="wu-fill" style="width: ${percent}%"></span></span>
      <span class="wu-banner-count">${published}/${total}</span>`;
    backlogBanner.insertBefore(progress, backlogBanner.querySelector('.wip-banner-arrow'));
  }

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

  const writingsWrap = document.getElementById('writings');
  const writingsTrack = document.getElementById('writingsTrack');
  if (writingsWrap && writingsTrack) {
    const cards = [...writingsTrack.querySelectorAll(':scope > .showcase-card')];
    const phoneLayout = window.matchMedia('(max-width: 767.98px)');

    const placeStack = () => {
      const navOffset = 88;
      cards.forEach((card, i) => {
        const top = Math.min(navOffset + i * 16, window.innerHeight - card.offsetHeight - 16);
        card.style.setProperty('--stick-top', `${Math.round(top)}px`);
      });
    };

    const hintText = writingsWrap.querySelector('.writings-hint-text');
    const updateWindowFade = () => {
      const end = writingsTrack.scrollTop + writingsTrack.clientHeight >= writingsTrack.scrollHeight - 2;
      writingsWrap.classList.toggle('at-end', end);
      const trackBottom = writingsTrack.getBoundingClientRect().bottom;
      const remaining = cards.filter((card) => card.getBoundingClientRect().top + 60 > trackBottom).length;
      hintText.textContent = end || !remaining
        ? `You've seen all ${cards.length} writings`
        : `Scroll inside for ${remaining} more`;
    };

    const sizeWindow = () => {
      const padding = parseFloat(getComputedStyle(writingsTrack).paddingTop) * 2;
      writingsTrack.style.setProperty('--window-h', `${Math.ceil(cards[0].offsetHeight + padding + 140)}px`);
      updateWindowFade();
    };

    const applyLayout = () => {
      if (phoneLayout.matches) {
        writingsTrack.style.removeProperty('--window-h');
        writingsTrack.scrollTop = 0;
        placeStack();
      } else {
        cards.forEach((card) => card.style.removeProperty('--stick-top'));
        sizeWindow();
      }
    };

    writingsTrack.addEventListener('scroll', () => !phoneLayout.matches && updateWindowFade(), { passive: true });
    phoneLayout.addEventListener('change', applyLayout);
    window.addEventListener('resize', applyLayout);
    document.fonts?.ready.then(applyLayout);
    applyLayout();
  }

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

      if (e.detail > 0) copyBtn.blur();
      try {
        await navigator.clipboard.writeText(copyValue);
      } catch {
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

    if (noHover) {
      link.addEventListener('click', (e) => {
        if (!wrap.classList.contains('tip-open')) {
          e.preventDefault();

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

const FAVICON_LIGHT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23fef9e6'/%3E%3Ccircle cx='24' cy='14' r='3.25' fill='%23d97706'/%3E%3Ccircle cx='13' cy='34' r='3.25' fill='%23d97706'/%3E%3Ccircle cx='35' cy='34' r='3.25' fill='%23d97706'/%3E%3Cpath d='M24 17.25v6.5M24 23.75l-9 3.25M24 23.75l9 3.25' stroke='%23d97706' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";
const FAVICON_DARK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23151515'/%3E%3Ccircle cx='24' cy='14' r='3.25' fill='%23c4b5fd'/%3E%3Ccircle cx='13' cy='34' r='3.25' fill='%23c4b5fd'/%3E%3Ccircle cx='35' cy='34' r='3.25' fill='%23c4b5fd'/%3E%3Cpath d='M24 17.25v6.5M24 23.75l-9 3.25M24 23.75l9 3.25' stroke='%23c4b5fd' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";

function setFavicon(theme) {
  const link = document.getElementById('favicon');
  if (link) link.href = theme === 'dark' ? FAVICON_DARK : FAVICON_LIGHT;
}

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
