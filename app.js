/**
 * Web Utility Toolbox - App Controller
 * Manages UI interactions, routing, theme switching, notifications, and global clipboard helpers.
 */

// Establish global namespace
window.App = {};

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // UI Elements
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const toolPanels = document.querySelectorAll('.tool-panel');
    const headerTitle = document.querySelector('.header-title');
    const headerSubtitle = document.querySelector('.header-subtitle');
    const searchInput = document.querySelector('.search-input');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const toast = document.getElementById('toast');
    const dashboardCards = document.querySelectorAll('.dashboard-card');

    // ==========================================
    // Sidebar Collapse Manager
    // ==========================================
    function setSidebarCollapsed(collapsed) {
        if (collapsed) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('title', 'Expand Sidebar');
        } else {
            sidebar.classList.remove('collapsed');
            document.body.classList.remove('sidebar-collapsed');
            if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('title', 'Collapse Sidebar');
        }
        localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
    }

    function initSidebar() {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState === 'true') {
            setSidebarCollapsed(true);
        }
    }

    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = sidebar.classList.contains('collapsed');
            setSidebarCollapsed(!isCollapsed);
        });
    }

    initSidebar();

    // ==========================================
    // Router / Navigation
    // ==========================================
    function navigateTo(targetId) {
        // Exit fullscreen if active on navigation
        const activeFullscreenCard = document.querySelector('.card.fullscreen');
        if (activeFullscreenCard) {
            activeFullscreenCard.classList.remove('fullscreen');
            document.body.classList.remove('fullscreen-active');
            // Reset icons to maximize icon
            const inputBtn = document.getElementById('btn-json-input-fullscreen');
            const outputBtn = document.getElementById('btn-json-output-fullscreen');
            const maximizeSvg = `
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
            `;
            if (inputBtn) {
                inputBtn.innerHTML = maximizeSvg;
                inputBtn.title = 'Fullscreen';
            }
            if (outputBtn) {
                outputBtn.innerHTML = maximizeSvg;
                outputBtn.title = 'Fullscreen';
            }
        }

        // Toggle Active Panel
        toolPanels.forEach(panel => {
            if (panel.id === targetId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Toggle Active Nav Item
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update Header Titles
        const activeNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (activeNav) {
            headerTitle.textContent = activeNav.querySelector('.nav-label').textContent;
            headerSubtitle.textContent = activeNav.getAttribute('title') || 'Interactive tool utility';
        } else if (targetId === 'dashboard') {
            headerTitle.textContent = 'Dashboard';
            headerSubtitle.textContent = 'Select a tool to get started';
        }

        // Close sidebar on mobile
        sidebar.classList.remove('mobile-open');

        // Scroll main wrapper to top
        window.scrollTo(0, 0);
    }

    // Nav click handlers
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.getAttribute('data-target'));
        });
    });

    // Dashboard card click handlers
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            navigateTo(card.getAttribute('data-target'));
        });
    });

    // Mobile Hamburger Toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Close mobile sidebar by clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('mobile-open') && 
            !sidebar.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });

    // ==========================================
    // Search Filter
    // ==========================================
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            // Filter Sidebar Menu items
            navItems.forEach(item => {
                const target = item.getAttribute('data-target');
                if (target === 'dashboard') return; // Always keep Dashboard button visible

                const label = item.querySelector('.nav-label').textContent.toLowerCase();
                const title = item.getAttribute('title').toLowerCase();
                
                if (label.includes(query) || title.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            // Filter Dashboard Cards (if dashboard is visible)
            dashboardCards.forEach(card => {
                const title = card.querySelector('.dashboard-card-title').textContent.toLowerCase();
                const desc = card.querySelector('.dashboard-card-desc').textContent.toLowerCase();
                
                if (title.includes(query) || desc.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // ==========================================
    // Theme Manager (Dark / Light)
    // ==========================================
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateThemeIcon('dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            updateThemeIcon('light');
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        showToast(`Theme switched to ${newTheme} mode!`, 'success');
    }

    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="18.36" x2="5.64" y2="19.78"></line>
                    <line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>
                </svg>`;
            themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
        } else {
            themeToggleBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>`;
            themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    initTheme();

    // ==========================================
    // Toast Notification Utility
    // ==========================================
    let toastTimeout;
    function showToast(message, type = 'success') {
        if (!toast) return;
        toast.className = 'notification-banner';
        toast.classList.add(type);
        toast.querySelector('.notification-text').textContent = message;
        toast.classList.add('show');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Clipboard Copy Helper
    function handleCopyToClipboard(textToCopy) {
        if (!textToCopy || textToCopy.trim() === '') {
            showToast('Nothing to copy!', 'error');
            return;
        }
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy text.', 'error');
        });
    }

    // Attach copy button listeners globally
    document.querySelectorAll('.copy-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSelector = btn.getAttribute('data-copy-target');
            const targetEl = document.querySelector(targetSelector);
            if (targetEl) {
                const text = targetEl.value !== undefined ? targetEl.value : targetEl.textContent;
                handleCopyToClipboard(text);
            }
        });
    });

    // Expose helpers globally
    window.App.showToast = showToast;
    window.App.handleCopyToClipboard = handleCopyToClipboard;
    window.App.navigateTo = navigateTo;

    // Default route navigation on load
    navigateTo('dashboard');
});
