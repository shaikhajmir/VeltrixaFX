/**
 * VeltrixaFX - Client Authentication & UI Orchestration Utility
 * Handles session protection, dynamic UI updates, API operations, and premium toast messaging.
 * Updated to globally bind settings, profile dropdowns, notifications sliders, and connect wallet.
 */

// Define protected and public page routes
const PROTECTED_PAGES = [
  'user_profile.html',
  'institutional_profile_security_settings.html',
  'institutional_wallet_fund_management.html',
  'transaction_history_financial_reports.html',
  'advanced_trading_terminal.html',
  'professional_trading_terminal.html',
  'copy_trading.html',
  'affiliate_dashboard.html',
  'institutional_kyc_verification.html',
  'kyc_approval_pending.html',
  'unified_verification_hub.html',
  'global_market_overview_terminal.html',
  'institutional_analytics_performance_dashboard.html'
];

let currentUser = null;

// Simulated Notifications List for high-end dynamic feel
let notificationList = [
  { id: 1, title: 'KYC Document Approved', text: 'Identity verified. Upgraded to Premium institutional tier status.', time: 'Just now', icon: 'gpp_good', color: 'text-secondary' },
  { id: 2, title: 'Secure Handshake Established', text: 'JWT session cookie verified. Dynamic database balance synced.', time: '10m ago', icon: 'verified_user', color: 'text-green-400' },
  { id: 3, title: 'API Key Active', text: 'Developer portal rotated live REST API key successfully.', time: '1h ago', icon: 'api', color: 'text-amber-400' },
  { id: 4, title: 'Margin Ledger Online', text: 'SQLite database connection successfully initialized.', time: '2h ago', icon: 'database', color: 'text-purple-400' }
];

// Premium Toast Notification System
window.showToast = function(message, type = 'success') {
  // Remove existing toasts if any
  const existing = document.getElementById('vx-toast-container');
  if (existing) existing.remove();

  // Create container
  const container = document.createElement('div');
  container.id = 'vx-toast-container';
  container.className = 'fixed top-6 right-6 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none animate-slide-in';

  // Create toast
  const toast = document.createElement('div');
  
  let bgGradient = 'from-[#1e293b] to-[#0f172a]';
  let borderGlow = 'rgba(76, 215, 246, 0.3)';
  let icon = 'info';
  let iconColor = 'text-secondary';
  
  if (type === 'success') {
    bgGradient = 'from-[#064e3b]/90 to-[#022c22]/90';
    borderGlow = 'rgba(16, 185, 129, 0.4)';
    icon = 'check_circle';
    iconColor = 'text-green-400';
  } else if (type === 'error') {
    bgGradient = 'from-[#7f1d1d]/90 to-[#450a0a]/90';
    borderGlow = 'rgba(239, 68, 68, 0.4)';
    icon = 'error';
    iconColor = 'text-red-400';
  } else if (type === 'warning') {
    bgGradient = 'from-[#78350f]/90 to-[#451a03]/90';
    borderGlow = 'rgba(245, 158, 11, 0.4)';
    icon = 'warning';
    iconColor = 'text-amber-400';
  }

  toast.className = `flex items-center gap-sm p-md rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl pointer-events-auto bg-gradient-to-r ${bgGradient} transition-all duration-300`;
  toast.style.boxShadow = `0 10px 25px -5px rgba(0,0,0,0.5), 0 0 15px ${borderGlow}`;

  toast.innerHTML = `
    <span class="material-symbols-outlined ${iconColor} text-[24px]">${icon}</span>
    <div class="flex-1 font-body-sm text-on-surface leading-snug font-medium text-xs">${message}</div>
    <button class="text-outline hover:text-white transition-colors" onclick="this.parentElement.parentElement.remove()">
      <span class="material-symbols-outlined text-[18px]">close</span>
    </button>
  `;

  container.appendChild(toast);
  document.body.appendChild(container);

  // Add styles dynamically if not loaded
  if (!document.getElementById('vx-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'vx-toast-styles';
    style.innerHTML = `
      @keyframes slideIn {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-slide-in {
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `;
    document.head.appendChild(style);
  }

  // Auto dismiss
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => container.remove(), 300);
  }, 4000);
};

// Check Session & Bootstrap dynamic data
async function checkSession() {
  const currentPage = window.location.pathname.split('/').pop() || 'emerald_obsidian_edition.html';
  const isProtected = PROTECTED_PAGES.some(page => currentPage.includes(page));

  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      currentUser = await response.json();
      console.log('Authenticated user:', currentUser.name);

      if (
        currentPage.includes('secure_web_login.html') || 
        currentPage.includes('secure_web_registration.html') ||
        currentPage.includes('secure_password_recovery.html') ||
        currentPage.includes('secure_password_reset.html')
      ) {
        window.location.href = 'professional_trading_terminal.html';
        return;
      }

      // Populate UI with authentic user details
      updateDynamicUI(currentUser);
    } else {
      if (isProtected) {
        console.warn('Unauthorized access to protected page. Redirecting to login.');
        window.location.href = 'secure_web_login.html';
      }
    }
  } catch (error) {
    console.error('Session validation error:', error);
    if (isProtected) {
      window.location.href = 'secure_web_login.html';
    }
  }
}

// Update DOM elements with real database details
function updateDynamicUI(user) {
  document.addEventListener('DOMContentLoaded', () => {
    applyUserDOM(user);
    setupPremiumInteractions(user);
  });
  // Execute immediately if DOM is already loaded
  applyUserDOM(user);
  setupPremiumInteractions(user);
}

function applyUserDOM(user) {
  if (!user) return;

  // Update landing page login/register buttons to Dashboard if logged in
  const landingBtns = document.querySelectorAll('button, a');
  landingBtns.forEach(btn => {
    const text = btn.textContent.trim().toLowerCase();
    if (text === 'login') {
      btn.textContent = 'Dashboard';
      btn.onclick = (e) => {
        e.preventDefault();
        window.location.href = 'professional_trading_terminal.html';
      };
    } else if (text === 'start trading' || text.includes('start trading')) {
      btn.innerHTML = 'Go to Dashboard <span class="material-symbols-outlined">trending_up</span>';
      btn.onclick = (e) => {
        e.preventDefault();
        window.location.href = 'professional_trading_terminal.html';
      };
    }
  });

  // Replace names (Case insensitive replacements of placeholders)
  const elements = document.body.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    
    // Check if the element contains text node directly
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
      const text = el.textContent.trim();
      
      if (text === 'Ajmir Trader') {
        el.textContent = user.name;
      } else if (text === 'ajmir.trader@veltrixafx.io') {
        el.textContent = user.email;
      } else if (text === 'VX48291') {
        el.textContent = `VX${10000 + user.id}`;
      } else if (text === '$10,000.00' || text === '$10,000' || text === '$10,000 USD') {
        el.textContent = `$${parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
      }
    }
  }

  // Update specific known header elements
  const userGreeting = document.querySelector('h2.text-display-sm');
  if (userGreeting && userGreeting.textContent.includes('Ajmir')) {
    userGreeting.innerHTML = `${user.name} <span class="bg-secondary-container/20 text-secondary-fixed-dim text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-secondary/20 neon-glow-cyan">${user.tier}</span>`;
  }

  // Update user tier badges
  const tierBadges = document.querySelectorAll('.neon-glow-cyan, .text-secondary-fixed-dim');
  tierBadges.forEach(badge => {
    if (badge.textContent.trim() === 'Premium' || badge.textContent.trim() === 'Bronze') {
      badge.textContent = user.tier;
    }
  });

  // Inject Wallet Balances
  const balanceDisplays = document.querySelectorAll('[data-balance], .balance-display');
  balanceDisplays.forEach(el => {
    el.textContent = `$${parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  // Inject Profile Form fields if on profile pages
  const nameInput = document.querySelector('input[value="Ajmir Trader"]');
  if (nameInput) {
    nameInput.value = user.name;
    nameInput.defaultValue = user.name;
  }
  const emailInput = document.querySelector('input[value="ajmir.trader@veltrixafx.io"]');
  if (emailInput) {
    emailInput.value = user.email;
    emailInput.defaultValue = user.email;
  }
  const phoneInput = document.querySelector('input[value="+44 7700 900123"]');
  if (phoneInput) {
    phoneInput.value = user.phone || '';
    phoneInput.defaultValue = user.phone || '';
  }
  const countrySelect = document.querySelector('select');
  if (countrySelect && user.country) {
    for (let i = 0; i < countrySelect.options.length; i++) {
      if (countrySelect.options[i].text === user.country) {
        countrySelect.selectedIndex = i;
        break;
      }
    }
  }

  // Inject API Key display
  const apiKeyBox = document.querySelector('.font-data-mono');
  if (apiKeyBox && apiKeyBox.textContent.includes('vx_live_ak_')) {
    apiKeyBox.innerHTML = `<span>${user.apiKey || 'No API key generated.'}</span>
    <div class="flex gap-sm">
      <span onclick="navigator.clipboard.writeText('${user.apiKey || ''}'); showToast('API Key copied to clipboard!')" class="text-secondary-fixed-dim cursor-pointer material-symbols-outlined text-[18px]" data-icon="content_copy">content_copy</span>
      <span id="rotate-api-btn" class="text-secondary cursor-pointer material-symbols-outlined text-[18px]" data-icon="refresh">refresh</span>
    </div>`;
    
    // Bind API rotation click handler
    const rotateBtn = document.getElementById('rotate-api-btn');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/profile/api-key/rotate', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            showToast('API Key successfully rotated!');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            showToast('Failed to rotate API key.', 'error');
          }
        } catch (e) {
          console.error(e);
          showToast('Network error rotating API key.', 'error');
        }
      });
    }
  }

  // Wire Logout Action on buttons
  const navButtons = document.querySelectorAll('button, a');
  navButtons.forEach(btn => {
    const text = btn.textContent.toLowerCase();
    if (text.includes('logout') || text.includes('sign out')) {
      btn.removeAttribute('href');
      btn.onclick = async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/auth/logout', { method: 'POST' });
          if (res.ok) {
            showToast('Logged out successfully. Redirecting...', 'success');
            setTimeout(() => {
              window.location.href = 'secure_web_login.html';
            }, 1000);
          }
        } catch (error) {
          console.error('Logout failed:', error);
          window.location.href = 'secure_web_login.html';
        }
      };
    }
  });
}

// PREMIUM INTERACTIONS ENGINE (GLOBAL DELEGATION MOUNT)
function setupPremiumInteractions(user) {
  if (window.vxPremiumInitialized) return;
  window.vxPremiumInitialized = true;

  // 1. Inject Styles dynamically in header
  if (!document.getElementById('vx-premium-styles')) {
    const style = document.createElement('style');
    style.id = 'vx-premium-styles';
    style.innerHTML = `
      @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
      }
      .vx-drawer-open {
        animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .vx-drawer-close {
        animation: slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes modalScaleIn {
        from { transform: scale(0.9) translateY(10px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }
      .vx-modal-open {
        animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes dropdownSlideDown {
        from { transform: translateY(-5px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-dropdown {
        animation: dropdownSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes pulseBadge {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 215, 246, 0.7); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(76, 215, 246, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 215, 246, 0); }
      }
      .vx-pulse-badge {
        animation: pulseBadge 2s infinite;
      }
      @keyframes borderFlash {
        0% { border-color: rgba(76, 215, 246, 0.2); box-shadow: 0 0 0 rgba(76, 215, 246, 0); }
        50% { border-color: rgb(76, 215, 246); box-shadow: 0 0 15px rgba(76, 215, 246, 0.4); }
        100% { border-color: rgba(76, 215, 246, 0.2); box-shadow: 0 0 0 rgba(76, 215, 246, 0); }
      }
      .vx-input-flash {
        animation: borderFlash 1.5s ease-in-out infinite !important;
        border-width: 1px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Delegate settings icons/buttons click handlers
  const settingsButtons = document.querySelectorAll('.material-symbols-outlined, button, a');
  settingsButtons.forEach(btn => {
    const text = btn.textContent.trim().toLowerCase();
    if (text === 'settings' || text === 'security' || btn.getAttribute('data-icon') === 'settings') {
      btn.onclick = (e) => {
        e.preventDefault();
        window.location.href = 'institutional_profile_security_settings.html';
      };
    }
  });

  // 3. Bind avatar profile photo click to open profile menu dropdown
  const avatars = document.querySelectorAll('img[alt*="Profile"], img[alt*="avatar"], .rounded-full overflow-hidden border img');
  avatars.forEach(avatar => {
    avatar.style.cursor = 'pointer';
    avatar.onclick = (e) => {
      window.toggleProfileDropdown(e);
    };
  });

  // Also bind greeting name if present
  const userGreeting = document.querySelector('h2.text-display-sm');
  if (userGreeting) {
    userGreeting.style.cursor = 'pointer';
    userGreeting.onclick = (e) => {
      window.location.href = 'user_profile.html';
    };
  }

  // 4. Delegate notification bell clicks & initialize badge count overlay
  const bellElements = document.querySelectorAll('.material-symbols-outlined, button');
  bellElements.forEach(el => {
    if (el.textContent.trim() === 'notifications' || el.getAttribute('data-icon') === 'notifications') {
      el.style.cursor = 'pointer';
      el.onclick = (e) => {
        e.preventDefault();
        window.toggleNotificationsDrawer();
      };
    }
  });
  updateNotificationsBadgeCount();

  // 5. Connect Wallet elements binding
  updateAllWalletButtons();

  // 6. Search Bar Quick Terminal Navigator integration
  setupQuickSearchNavigator();

  // 7. Sidebar "New Order" action binding
  const sidebarOrderBtns = document.querySelectorAll('button, a');
  sidebarOrderBtns.forEach(btn => {
    if (btn.textContent.includes('New Order')) {
      btn.onclick = (e) => {
        e.preventDefault();
        const amountInput = document.getElementById('trade-amount');
        if (amountInput) {
          amountInput.focus();
          amountInput.classList.add('vx-input-flash');
          showToast('Order terminal focused! Please enter amount size.');
          setTimeout(() => {
            amountInput.classList.remove('vx-input-flash');
          }, 3000);
        } else {
          window.location.href = 'professional_trading_terminal.html';
        }
      };
    }
  });
}

// PROFILE DROPDOWN SYSTEM
window.toggleProfileDropdown = function(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  
  let dropdown = document.getElementById('vx-profile-dropdown');
  if (dropdown) {
    dropdown.remove();
    return;
  }
  
  dropdown = document.createElement('div');
  dropdown.id = 'vx-profile-dropdown';
  dropdown.className = 'absolute right-0 mt-2 w-56 bg-[#0b0f19]/95 border border-white/10 rounded-xl shadow-2xl z-[99999] backdrop-blur-2xl p-sm space-y-xs animate-dropdown';
  dropdown.style.boxShadow = '0 10px 30px -5px rgba(0,0,0,0.8), 0 0 15px rgba(76, 215, 246, 0.05)';
  
  const userName = currentUser ? currentUser.name : 'Ajmir Premium';
  const userEmail = currentUser ? currentUser.email : 'ajmir.trader@veltrixafx.io';
  
  dropdown.innerHTML = `
    <div class="px-xs py-2 border-b border-white/5 space-y-[2px]">
      <p class="text-xs text-on-surface font-bold truncate">${userName}</p>
      <p class="text-[10px] text-outline truncate">${userEmail}</p>
    </div>
    <div class="flex flex-col py-xs">
      <a href="user_profile.html" class="flex items-center gap-xs px-xs py-sm rounded hover:bg-white/5 text-xs text-on-surface-variant hover:text-white transition-all">
        <span class="material-symbols-outlined text-[16px]">person</span>
        <span>View Profile</span>
      </a>
      <a href="institutional_profile_security_settings.html" class="flex items-center gap-xs px-xs py-sm rounded hover:bg-white/5 text-xs text-on-surface-variant hover:text-white transition-all">
        <span class="material-symbols-outlined text-[16px]">settings</span>
        <span>Settings & Security</span>
      </a>
      <a href="institutional_support_help_center.html" class="flex items-center gap-xs px-xs py-sm rounded hover:bg-white/5 text-xs text-on-surface-variant hover:text-white transition-all">
        <span class="material-symbols-outlined text-[16px]">help</span>
        <span>Support Center</span>
      </a>
    </div>
    <div class="pt-xs border-t border-white/5">
      <button id="vx-dropdown-logout-btn" class="w-full flex items-center gap-xs px-xs py-sm rounded hover:bg-red-500/10 text-xs text-red-400 transition-all text-left">
        <span class="material-symbols-outlined text-[16px]">logout</span>
        <span>Sign Out Terminal</span>
      </button>
    </div>
  `;
  
  // Append inside the parent of the trigger avatar if possible
  const trigger = e.currentTarget;
  if (trigger && trigger.parentElement) {
    trigger.parentElement.style.position = 'relative';
    trigger.parentElement.appendChild(dropdown);
  } else {
    dropdown.className = 'fixed right-6 top-16 mt-2 ' + dropdown.className.replace('absolute right-0 mt-2 ', '');
    document.body.appendChild(dropdown);
  }
  
  const logoutBtn = document.getElementById('vx-dropdown-logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = async (ev) => {
      ev.preventDefault();
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
          showToast('Logged out successfully. Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'secure_web_login.html';
          }, 1000);
        }
      } catch (error) {
        window.location.href = 'secure_web_login.html';
      }
    };
  }
  
  document.addEventListener('click', closeProfileDropdownAway);
};

function closeProfileDropdownAway(e) {
  const dropdown = document.getElementById('vx-profile-dropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.remove();
    document.removeEventListener('click', closeProfileDropdownAway);
  }
}

// DYNAMIC NOTIFICATIONS DRAWER SYSTEM
window.toggleNotificationsDrawer = function() {
  let drawer = document.getElementById('vx-notifications-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'vx-notifications-drawer';
    drawer.className = 'fixed top-0 right-0 h-screen w-80 md:w-96 bg-[#0b0f19]/95 border-l border-white/10 shadow-2xl z-[99999] backdrop-blur-2xl p-md flex flex-col justify-between transform translate-x-full transition-all duration-300';
    drawer.style.boxShadow = '-10px 0 35px -5px rgba(0,0,0,0.7), 0 0 15px rgba(76, 215, 246, 0.1)';
    document.body.appendChild(drawer);
  }
  
  if (drawer.classList.contains('translate-x-full')) {
    renderNotificationsContent(drawer);
    drawer.classList.remove('translate-x-full');
    drawer.classList.add('vx-drawer-open');
    createBackdropOverlay(window.toggleNotificationsDrawer);
  } else {
    drawer.classList.add('translate-x-full');
    drawer.classList.remove('vx-drawer-open');
    removeBackdropOverlay();
  }
};

function renderNotificationsContent(drawer) {
  const count = notificationList.length;
  let itemsHtml = '';
  
  if (count === 0) {
    itemsHtml = `
      <div class="flex flex-col items-center justify-center h-full text-center space-y-sm py-xl">
        <span class="material-symbols-outlined text-[64px] text-secondary/30 animate-pulse">check_circle</span>
        <h4 class="font-body-sm text-on-surface font-bold text-sm">All Caught Up!</h4>
        <p class="font-body-sm text-outline max-w-[240px] text-xs">You have cleared all active institutional system updates.</p>
      </div>
    `;
  } else {
    notificationList.forEach(item => {
      itemsHtml += `
        <div id="vx-notif-item-${item.id}" class="p-sm rounded-xl border border-white/5 bg-white/[0.01] flex gap-sm hover:border-white/10 transition-all group relative overflow-hidden">
          <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px] ${item.color || 'text-primary'}">${item.icon || 'notifications'}</span>
          </div>
          <div class="flex-1 space-y-[2px]">
            <div class="flex justify-between items-center">
              <h5 class="font-body-sm text-on-surface font-bold text-xs">${item.title}</h5>
              <span class="text-[9px] text-outline">${item.time}</span>
            </div>
            <p class="text-[11px] text-on-surface-variant font-medium leading-relaxed">${item.text}</p>
          </div>
          <button onclick="dismissNotification(${item.id})" class="absolute right-xs top-xs text-outline opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
            <span class="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      `;
    });
  }
  
  drawer.innerHTML = `
    <div class="flex flex-col h-full justify-between">
      <!-- Header -->
      <div class="flex justify-between items-center border-b border-white/10 pb-sm">
        <div class="flex items-center gap-xs">
          <span class="material-symbols-outlined text-secondary">notifications</span>
          <span class="font-body-md text-on-surface font-bold text-sm uppercase tracking-wider">System Alerts</span>
          ${count > 0 ? `<span class="bg-secondary-container/20 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full border border-secondary/20">${count}</span>` : ''}
        </div>
        <div class="flex gap-sm items-center">
          ${count > 0 ? `<button onclick="clearAllNotifications()" class="text-[10px] text-secondary hover:text-white transition-colors font-bold uppercase tracking-wider">Clear All</button>` : ''}
          <button onclick="toggleNotificationsDrawer()" class="text-outline hover:text-white transition-colors flex items-center">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>
      
      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto py-md space-y-sm">
        ${itemsHtml}
      </div>
      
      <!-- Footer -->
      <div class="border-t border-white/10 pt-sm mt-auto text-center">
        <p class="text-[9px] text-outline font-label-caps uppercase tracking-widest">VeltrixaFX Security Engine v4.2</p>
      </div>
    </div>
  `;
}

window.dismissNotification = function(id) {
  const el = document.getElementById(`vx-notif-item-${id}`);
  if (el) {
    el.style.transform = 'translateX(100%)';
    el.style.opacity = '0';
    setTimeout(() => {
      notificationList = notificationList.filter(n => n.id !== id);
      updateNotificationsBadgeCount();
      const drawer = document.getElementById('vx-notifications-drawer');
      if (drawer) renderNotificationsContent(drawer);
    }, 250);
  }
};

window.clearAllNotifications = function() {
  notificationList = [];
  updateNotificationsBadgeCount();
  const drawer = document.getElementById('vx-notifications-drawer');
  if (drawer) renderNotificationsContent(drawer);
  showToast('All notifications cleared.', 'success');
};

function updateNotificationsBadgeCount() {
  const count = notificationList.length;
  const bells = document.querySelectorAll('.material-symbols-outlined');
  
  bells.forEach(el => {
    if (el.textContent.trim() === 'notifications' || el.getAttribute('data-icon') === 'notifications') {
      const parent = el.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        let badge = parent.querySelector('.vx-notif-badge');
        if (count === 0) {
          if (badge) badge.remove();
        } else {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'vx-notif-badge absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-background text-[9px] font-bold flex items-center justify-center vx-pulse-badge';
            parent.appendChild(badge);
          }
          badge.textContent = count;
        }
      }
    }
  });
}

// INTERACTIVE WEB3 WALLET CONNECTION MODAL
window.openConnectWalletModal = function() {
  let modal = document.getElementById('vx-wallet-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'vx-wallet-modal';
    modal.className = 'fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center transition-opacity duration-300 opacity-0';
    document.body.appendChild(modal);
  }
  
  renderWalletModalContent(modal);
  
  modal.offsetHeight; // trigger reflow
  modal.classList.remove('opacity-0');
  modal.classList.add('opacity-100');
  
  const card = modal.querySelector('.vx-modal-card');
  if (card) {
    card.classList.add('vx-modal-open');
  }
};

window.closeConnectWalletModal = function() {
  const modal = document.getElementById('vx-wallet-modal');
  if (modal) {
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.remove(), 300);
  }
};

function renderWalletModalContent(modal, connectingState = null) {
  let innerHtml = '';
  
  if (connectingState) {
    const isSuccess = connectingState.status === 'success';
    innerHtml = `
      <div class="vx-modal-card glass-panel max-w-sm w-full p-lg rounded-2xl border border-white/10 text-center space-y-md shadow-2xl relative overflow-hidden bg-[#0d1222]/95 backdrop-blur-2xl">
        ${isSuccess ? `
          <div class="py-lg space-y-md animate-fade-in">
            <div class="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mx-auto border border-secondary/30">
              <span class="material-symbols-outlined text-[48px] text-secondary">gpp_good</span>
            </div>
            <h3 class="font-body-md text-on-surface font-bold text-sm">Wallet Authenticated</h3>
            <p class="font-body-sm text-outline max-w-[280px] mx-auto text-xs leading-relaxed">Cryptographic link successfully established. Your settlement address is:</p>
            <div class="bg-white/5 border border-white/10 p-sm rounded-lg text-secondary font-data-mono text-[10px] select-all truncate">
              ${connectingState.address}
            </div>
            <p class="text-[9px] text-outline font-label-caps uppercase tracking-widest">Instant Settlements Active</p>
          </div>
        ` : `
          <div class="py-lg space-y-md">
            <div class="w-12 h-12 rounded-full border-t-2 border-r-2 border-secondary animate-spin mx-auto"></div>
            <h3 class="font-body-md text-on-surface font-bold text-sm">Connecting ${connectingState.provider}...</h3>
            <p class="font-body-sm text-outline max-w-[280px] mx-auto text-xs leading-relaxed">Requesting secure cryptographic signature authentication. Please approve in your extension popup.</p>
          </div>
        `}
      </div>
    `;
  } else {
    const isConnected = localStorage.getItem('vx_wallet_connected') === 'true';
    const address = localStorage.getItem('vx_wallet_address') || '';
    
    innerHtml = `
      <div class="vx-modal-card glass-panel max-w-sm w-full p-lg rounded-2xl border border-white/10 space-y-md shadow-2xl relative overflow-hidden bg-[#0d1222]/95 backdrop-blur-2xl">
        <button onclick="closeConnectWalletModal()" class="absolute right-md top-md text-outline hover:text-white transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
        
        <div class="space-y-xs pr-lg">
          <h3 class="font-body-md text-on-surface font-bold text-sm uppercase tracking-wider">Web3 Settlement Wallet</h3>
          <p class="font-body-sm text-outline text-xs">Link your Web3 provider to configure direct ledger withdrawals.</p>
        </div>
        
        ${isConnected ? `
          <div class="p-md rounded-xl border border-secondary/20 bg-secondary/5 space-y-md text-center">
            <span class="material-symbols-outlined text-[32px] text-secondary">account_balance_wallet</span>
            <div>
              <p class="text-[9px] text-outline font-label-caps uppercase tracking-wider">Active Cryptographic Link</p>
              <p class="font-data-mono text-secondary text-xs font-bold truncate">${address}</p>
            </div>
            <button onclick="disconnectWallet()" class="w-full py-sm bg-red-600/20 border border-red-600/40 text-red-400 font-bold rounded-lg hover:bg-red-600/30 active:scale-95 transition-all text-xs uppercase tracking-wider">
              Disconnect Wallet
            </button>
          </div>
        ` : `
          <div class="space-y-sm">
            <button onclick="selectWalletProvider('MetaMask')" class="w-full flex items-center justify-between p-sm rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-secondary/30 transition-all text-left group">
              <div class="flex items-center gap-sm">
                <div class="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                  <span class="material-symbols-outlined text-orange-400 text-[18px]">token</span>
                </div>
                <div>
                  <h4 class="font-body-sm text-on-surface font-bold text-xs">MetaMask Extension</h4>
                  <p class="text-[9px] text-outline">Connect via browser plugin</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-outline group-hover:text-secondary transition-colors text-[18px]">chevron_right</span>
            </button>
            
            <button onclick="selectWalletProvider('WalletConnect')" class="w-full flex items-center justify-between p-sm rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-secondary/30 transition-all text-left group">
              <div class="flex items-center gap-sm">
                <div class="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <span class="material-symbols-outlined text-blue-400 text-[18px]">qr_code</span>
                </div>
                <div>
                  <h4 class="font-body-sm text-on-surface font-bold text-xs">WalletConnect</h4>
                  <p class="text-[9px] text-outline">Scan or secure mobile link</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-outline group-hover:text-secondary transition-colors text-[18px]">chevron_right</span>
            </button>
            
            <button onclick="selectWalletProvider('Coinbase Wallet')" class="w-full flex items-center justify-between p-sm rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-secondary/30 transition-all text-left group">
              <div class="flex items-center gap-sm">
                <div class="w-8 h-8 rounded bg-indigo-600/10 flex items-center justify-center shrink-0 border border-indigo-600/20">
                  <span class="material-symbols-outlined text-indigo-400 text-[18px]">account_balance</span>
                </div>
                <div>
                  <h4 class="font-body-sm text-on-surface font-bold text-xs">Coinbase Wallet</h4>
                  <p class="text-[9px] text-outline">Biometric key integration</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-outline group-hover:text-secondary transition-colors text-[18px]">chevron_right</span>
            </button>
          </div>
        `}
      </div>
    `;
  }
  
  modal.innerHTML = innerHtml;
}

window.selectWalletProvider = function(provider) {
  const modal = document.getElementById('vx-wallet-modal');
  if (!modal) return;
  
  renderWalletModalContent(modal, { provider, status: 'connecting' });
  
  setTimeout(() => {
    const mockAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const shortAddress = mockAddress.substring(0, 6) + '...' + mockAddress.substring(38);
    
    localStorage.setItem('vx_wallet_connected', 'true');
    localStorage.setItem('vx_wallet_address', mockAddress);
    localStorage.setItem('vx_wallet_short_address', shortAddress);
    
    renderWalletModalContent(modal, { provider, status: 'success', address: mockAddress });
    showToast(`Web3 Wallet successfully connected! Payout channels established.`, 'success');
    
    updateAllWalletButtons();
    
    setTimeout(() => {
      window.closeConnectWalletModal();
    }, 2000);
  }, 1500);
};

window.disconnectWallet = function() {
  localStorage.removeItem('vx_wallet_connected');
  localStorage.removeItem('vx_wallet_address');
  localStorage.removeItem('vx_wallet_short_address');
  
  const modal = document.getElementById('vx-wallet-modal');
  if (modal) {
    renderWalletModalContent(modal);
  }
  showToast('Web3 Wallet disconnected.', 'warning');
  updateAllWalletButtons();
};

function updateAllWalletButtons() {
  const isConnected = localStorage.getItem('vx_wallet_connected') === 'true';
  const shortAddress = localStorage.getItem('vx_wallet_short_address') || '';
  
  const buttons = document.querySelectorAll('button, a');
  buttons.forEach(btn => {
    const text = btn.textContent.trim();
    if (text === 'Connect Wallet' || text.includes('Connected [0x') || text.includes('Connected (0x')) {
      if (isConnected) {
        btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-400 inline-block mr-xs animate-pulse"></span> Connected [${shortAddress}]`;
        btn.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.2)';
        btn.onclick = (e) => {
          e.preventDefault();
          window.openConnectWalletModal();
        };
      } else {
        btn.innerHTML = 'Connect Wallet';
        btn.style.boxShadow = '';
        btn.onclick = (e) => {
          e.preventDefault();
          window.openConnectWalletModal();
        };
      }
    }
  });
}

// SEARCH BAR QUICK TERMINAL NAVIGATOR
function setupQuickSearchNavigator() {
  const searchInputs = document.querySelectorAll('input[placeholder*="Search"]');
  
  searchInputs.forEach(input => {
    const parent = input.parentElement;
    if (parent) {
      parent.style.position = 'relative';
    }
    
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let resultsContainer = parent ? parent.querySelector('.vx-search-results') : document.getElementById('vx-search-results-fallback');
      
      if (!q) {
        if (resultsContainer) resultsContainer.remove();
        return;
      }
      
      if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'vx-search-results absolute left-0 right-0 top-full mt-2 bg-[#0b0f19]/95 border border-white/10 rounded-xl shadow-2xl z-[99999] backdrop-blur-2xl p-xs space-y-base overflow-y-auto max-h-48';
        if (parent) {
          parent.appendChild(resultsContainer);
        } else {
          resultsContainer.id = 'vx-search-results-fallback';
          resultsContainer.className = 'fixed left-1/3 top-16 w-80 ' + resultsContainer.className;
          document.body.appendChild(resultsContainer);
        }
      }
      
      const pages = [
        { name: 'Advanced Terminal', href: 'advanced_trading_terminal.html', icon: 'monitoring', tags: 'trade buy sell active mark close btc eth leverage long short order' },
        { name: 'Professional Terminal', href: 'professional_trading_terminal.html', icon: 'swap_horiz', tags: 'trade buy sell active mark close btc eth leverage long short order' },
        { name: 'Copy Trading Strategies', href: 'copy_trading.html', icon: 'group', tags: 'copy social portfolio follow return roi john master algo' },
        { name: 'Wallet & Ledger Management', href: 'institutional_wallet_fund_management.html', icon: 'account_balance_wallet', tags: 'wallet deposit withdraw balance funds transaction history transfer payout connect' },
        { name: 'Affiliate Payout Panel', href: 'affiliate_dashboard.html', icon: 'redeem', tags: 'affiliate refer commission earnings withdraw balance payout invite code link' },
        { name: 'Institutional KYC Verification', href: 'institutional_kyc_verification.html', icon: 'shield_person', tags: 'kyc identity verify tier premium credentials gold check upload docs' },
        { name: 'Help Desk Center Support', href: 'institutional_support_help_center.html', icon: 'support_agent', tags: 'help support ticket chat developer assistance technical inquiry' },
        { name: 'Institutional Profile Settings', href: 'institutional_profile_security_settings.html', icon: 'security', tags: 'settings security profile update email password phone country api key rotate developer tokens credentials' }
      ];
      
      const filtered = pages.filter(p => p.name.toLowerCase().includes(q) || p.tags.includes(q));
      
      if (filtered.length === 0) {
        resultsContainer.innerHTML = `
          <div class="p-sm text-center text-xs text-outline font-body-sm">
            No matching terminal channels found.
          </div>
        `;
      } else {
        let listHtml = '';
        filtered.forEach(p => {
          listHtml += `
            <a href="${p.href}" class="flex items-center gap-xs px-sm py-2 rounded hover:bg-white/5 text-xs text-on-surface hover:text-secondary transition-all font-medium">
              <span class="material-symbols-outlined text-[16px] text-outline">${p.icon}</span>
              <span>${p.name}</span>
            </a>
          `;
        });
        resultsContainer.innerHTML = listHtml;
      }
    });
    
    // Hide dropdown on blur
    input.addEventListener('blur', () => {
      setTimeout(() => {
        const resultsContainer = parent ? parent.querySelector('.vx-search-results') : document.getElementById('vx-search-results-fallback');
        if (resultsContainer) resultsContainer.remove();
      }, 250);
    });
  });
}

// BACKDROP OVERLAY HELPERS
function createBackdropOverlay(onClose) {
  let backdrop = document.getElementById('vx-backdrop-overlay');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'vx-backdrop-overlay';
    backdrop.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] transition-opacity duration-300 opacity-0';
    document.body.appendChild(backdrop);
    backdrop.offsetHeight; // trigger reflow
    backdrop.classList.remove('opacity-0');
    backdrop.classList.add('opacity-100');
    
    backdrop.onclick = () => {
      onClose();
    };
  }
}

function removeBackdropOverlay() {
  const backdrop = document.getElementById('vx-backdrop-overlay');
  if (backdrop) {
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    setTimeout(() => backdrop.remove(), 300);
  }
}

// Automatically trigger session check
checkSession();
