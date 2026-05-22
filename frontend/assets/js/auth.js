/**
 * VeltrixaFX - Client Authentication & UI Orchestration Utility
 * Handles session protection, dynamic UI updates, API operations, and premium toast messaging.
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

// Premium Toast Notification System
window.showToast = function(message, type = 'success') {
  // Remove existing toasts if any
  const existing = document.getElementById('vx-toast-container');
  if (existing) existing.remove();

  // Create container
  const container = document.createElement('div');
  container.id = 'vx-toast-container';
  container.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none animate-slide-in';

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
    <div class="flex-1 font-body-sm text-on-surface leading-snug font-medium">${message}</div>
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
    // 1. Re-run after content loads just in case
    applyUserDOM(user);
  });
  // Execute immediately if DOM is already loaded
  applyUserDOM(user);
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

// Automatically trigger session check
checkSession();
