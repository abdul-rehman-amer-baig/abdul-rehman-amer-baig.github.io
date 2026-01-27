/**
 * Main script – portfolio logic, system design dropdown, modals, theme.
 */

const projects = [
  {
    title: "URL Shortener",
    description: "Scalable URL shortening service with high availability and partition tolerance",
    category: "system-design",
    badge: "Scaling READ",
    githubUrl: "https://github.com/abdul-rehman-amer-baig/system-design-url-shortener",
    imageUrl: "https://raw.githubusercontent.com/abdul-rehman-amer-baig/system-design-url-shortener/main/url-shortener-architecture.png"
  }
  // Add more projects here with category field
  // Example:
  // {
  //   title: "AI Chatbot",
  //   description: "Intelligent chatbot using GPT",
  //   category: "ai",
  //   githubUrl: "https://github.com/yourname/ai-chatbot"
  // }
];

// Categories configuration
const categories = {
  'all': { name: 'All', icon: '🌟' },
  'system-design': { name: 'System Design', icon: '🏗️' }
};

// Shuffle array function
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Current active category
let activeCategory = 'system-design';

// Render projects
function renderProjects(filteredProjects) {
  const projectsList = document.getElementById('projectsListDropdown');
  const noResults = document.getElementById('noResultsDropdown');
  
  if (filteredProjects.length === 0) {
    projectsList.innerHTML = '';
    noResults.classList.add('show');
    return;
  }

  noResults.classList.remove('show');
  
  const githubIcon = '<svg class="project-github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>';
  projectsList.innerHTML = filteredProjects.map((project) => `
    <div class="project-item-dropdown collapsed" data-expanded="false">
      <div class="project-item-toggle" role="button" tabindex="0" aria-expanded="false">
        <div class="project-item-preview">
          <h4>${project.title}</h4>
        </div>
        <div class="project-item-actions">
          <span class="project-badge">${project.badge || 'System Design'}</span>
          <a href="${project.githubUrl}" target="_blank" class="project-github-link" rel="noopener noreferrer" aria-label="View ${project.title} on GitHub">${githubIcon}</a>
          <span class="project-expand-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></span>
        </div>
      </div>
      <div class="project-item-body">
        ${project.imageUrl ? `<div class="project-image-wrapper" data-image-url="${project.imageUrl}" data-image-title="${project.title}">
          <img src="${project.imageUrl}" alt="${project.title} Architecture" class="project-image" />
        </div>` : ''}
        <div class="project-item-content">
          <p>${project.description}</p>
        </div>
      </div>
    </div>
  `).join('');
}

// Filter projects by category and search
function filterProjects(searchTerm, category = 'system-design') {
  let filtered = projects.filter(project => project.category === category);
  
  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(project => 
      project.title.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term)
    );
  }
  
  return filtered;
}

// Update projects based on current filters
function updateProjects() {
  const searchInput = document.getElementById('searchInputDropdown');
  const searchTerm = searchInput ? searchInput.value : '';
  const filtered = filterProjects(searchTerm, activeCategory);
  renderProjects(filtered);
  updateExpandAllButton();
}

function updateExpandAllButton() {
  const list = document.getElementById('projectsListDropdown');
  const btn = document.getElementById('expandAllBtn');
  if (!list || !btn) return;
  const items = list.querySelectorAll('.project-item-dropdown');
  const expanded = list.querySelectorAll('.project-item-dropdown:not(.collapsed)');
  if (items.length === 0) {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = 'inline-flex';
  btn.textContent = expanded.length === items.length ? 'Collapse All' : 'Expand All';
}

function setAllExpanded(expand) {
  const list = document.getElementById('projectsListDropdown');
  if (!list) return;
  const items = list.querySelectorAll('.project-item-dropdown');
  items.forEach((el) => {
    const toggle = el.querySelector('.project-item-toggle');
    el.classList.toggle('collapsed', !expand);
    el.setAttribute('data-expanded', expand ? 'true' : 'false');
    if (toggle) toggle.setAttribute('aria-expanded', expand);
  });
  updateExpandAllButton();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Dropdown functionality
  const dropdown = document.getElementById('projectsDropdown');
  const toggle = document.getElementById('projectsToggle');
  const closeBtn = document.getElementById('closeDropdown');
  const searchInput = document.getElementById('searchInputDropdown');
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    dropdown.classList.add('show');
    setTimeout(() => searchInput.focus(), 100);
    updateProjects();
  });

  closeBtn.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });

  // Close on outside click
  dropdown.addEventListener('click', (e) => {
    if (e.target === dropdown) {
      dropdown.classList.remove('show');
    }
  });

  // Search functionality
  searchInput.addEventListener('input', () => {
    updateProjects();
  });

  // Framework Modal functionality
  const frameworkModal = document.getElementById('frameworkModal');
  const frameworkModalToggle = document.getElementById('frameworkModalToggle');
  const closeFrameworkModal = document.getElementById('closeFrameworkModal');
  const modalOverlay = frameworkModal.querySelector('.modal-overlay');

  frameworkModalToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    frameworkModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  });

  closeFrameworkModal.addEventListener('click', () => {
    frameworkModal.classList.remove('show');
    document.body.style.overflow = '';
  });

  modalOverlay.addEventListener('click', () => {
    frameworkModal.classList.remove('show');
    document.body.style.overflow = '';
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && frameworkModal.classList.contains('show')) {
      frameworkModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });

  // Collapsible project items
  const projectsListDropdown = document.getElementById('projectsListDropdown');
  const expandAllBtn = document.getElementById('expandAllBtn');

  projectsListDropdown.addEventListener('click', (e) => {
    if (e.target.closest('.project-github-link')) return;
    const toggle = e.target.closest('.project-item-toggle');
    if (!toggle) return;
    const card = toggle.closest('.project-item-dropdown');
    if (!card) return;
    e.preventDefault();
    const isExpanded = card.getAttribute('data-expanded') === 'true';
    card.classList.toggle('collapsed', isExpanded);
    card.setAttribute('data-expanded', !isExpanded);
    toggle.setAttribute('aria-expanded', !isExpanded);
    updateExpandAllButton();
  });

  projectsListDropdown.addEventListener('keydown', (e) => {
    if (e.target.closest('.project-github-link')) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const toggle = e.target.closest('.project-item-toggle');
    if (!toggle) return;
    e.preventDefault();
    toggle.click();
  });

  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const items = projectsListDropdown.querySelectorAll('.project-item-dropdown');
      const allExpanded = items.length > 0 && items.length === projectsListDropdown.querySelectorAll('.project-item-dropdown:not(.collapsed)').length;
      setAllExpanded(!allExpanded);
    });
  }

  // Image Modal functionality
  const imageModal = document.getElementById('imageModal');
  const closeImageModal = document.getElementById('closeImageModal');
  const modalImage = document.getElementById('modalImage');
  const modalImageTitle = document.getElementById('modalImageTitle');
  const imageModalOverlay = imageModal.querySelector('.image-modal-overlay');

  // Handle image clicks (when expanded; image is inside .project-item-body)
  document.addEventListener('click', (e) => {
    const imageWrapper = e.target.closest('.project-image-wrapper');
    if (imageWrapper) {
      e.preventDefault();
      e.stopPropagation();
      const imageUrl = imageWrapper.getAttribute('data-image-url');
      const imageTitle = imageWrapper.getAttribute('data-image-title');
      modalImage.src = imageUrl;
      modalImage.alt = `${imageTitle} Architecture`;
      modalImageTitle.textContent = `${imageTitle} Architecture`;
      imageModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  });

  closeImageModal.addEventListener('click', () => {
    imageModal.classList.remove('show');
    document.body.style.overflow = '';
  });

  imageModalOverlay.addEventListener('click', () => {
    imageModal.classList.remove('show');
    document.body.style.overflow = '';
  });

  // Close image modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('show')) {
      imageModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  const dropdown = document.getElementById('projectsDropdown');
  if (e.key === 'Escape' && dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
});

// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const themeIcon = themeToggle.querySelector('.theme-icon');
  const html = document.documentElement;
  const currentTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme, themeIcon);

  themeToggle.addEventListener('click', () => {
    const t = html.getAttribute('data-theme');
    const newTheme = t === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme, themeIcon);
  });
}

function updateThemeIcon(theme, el) {
  if (el) el.textContent = theme === 'dark' ? '☀️' : '🌙';
}
