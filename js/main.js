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

  // Close image modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('show')) {
      closeModal();
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
});

// Favicon by theme (light = black on cream, dark = purple on dark)
const FAVICON_LIGHT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23fef9e6'/%3E%3Ccircle cx='24' cy='14' r='3.25' fill='%23d97706'/%3E%3Ccircle cx='13' cy='34' r='3.25' fill='%23d97706'/%3E%3Ccircle cx='35' cy='34' r='3.25' fill='%23d97706'/%3E%3Cpath d='M24 17.25v6.5M24 23.75l-9 3.25M24 23.75l9 3.25' stroke='%23d97706' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";
const FAVICON_DARK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23151515'/%3E%3Ccircle cx='24' cy='14' r='3.25' fill='%23c4b5fd'/%3E%3Ccircle cx='13' cy='34' r='3.25' fill='%23c4b5fd'/%3E%3Ccircle cx='35' cy='34' r='3.25' fill='%23c4b5fd'/%3E%3Cpath d='M24 17.25v6.5M24 23.75l-9 3.25M24 23.75l9 3.25' stroke='%23c4b5fd' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";

function setFavicon(theme) {
  const link = document.getElementById('favicon');
  if (link) link.href = theme === 'dark' ? FAVICON_DARK : FAVICON_LIGHT;
}

// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const themeIcon = themeToggle.querySelector('.theme-icon');
  const html = document.documentElement;
  const currentTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme, themeIcon);
  setFavicon(currentTheme);

  themeToggle.addEventListener('click', () => {
    const t = html.getAttribute('data-theme');
    const newTheme = t === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme, themeIcon);
    setFavicon(newTheme);
  });
}

function updateThemeIcon(theme, el) {
  if (el) el.textContent = theme === 'dark' ? '☀️' : '🌙';
}
