/* ==========================================================================
   TORQWASH PRO - Main Application Router & Controller
   Role Switching, View Modes (Mobile/Desktop), Tabs, Auth & Notifications
   ========================================================================== */

class TorqApp {
  constructor() {
    this.currentRole = 'customer'; // customer, provider, admin
    this.currentViewMode = 'mobile'; // mobile, desktop
    this.activeCustomerTab = 'homeTab';
    this.init();
  }

  init() {
    this.updateNotificationBadge();
    this.setupTimeClock();
  }

  setupTimeClock() {
    const updateTime = () => {
      const el = document.getElementById('statusBarTime');
      if (el) {
        const now = new Date();
        el.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  // --- Role Switcher (Customer | Provider | Admin) ---
  switchRole(role) {
    this.currentRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => {
      if (btn.dataset.role === role) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const custView = document.getElementById('customerAppContainer');
    const provView = document.getElementById('providerAppContainer');
    const adminView = document.getElementById('adminAppContainer');

    if (custView) custView.style.display = (role === 'customer') ? 'block' : 'none';
    if (provView) provView.style.display = (role === 'provider') ? 'block' : 'none';
    if (adminView) adminView.style.display = (role === 'admin') ? 'block' : 'none';

    window.torqCustomer.showToast(`Switched to ${role.toUpperCase()} View`, 'info');

    // Invalidate map sizes if switching
    if (role === 'customer' && window.torqCustomer.trackingMap) {
      setTimeout(() => window.torqCustomer.trackingMap.invalidateSize(), 200);
    }
  }

  // --- Device View Toggle (Mobile Mockup vs Full Desktop Web) ---
  toggleViewMode(mode) {
    this.currentViewMode = mode;
    const container = document.getElementById('mainAppContainer');
    const mobBtn = document.getElementById('viewModeMobileBtn');
    const deskBtn = document.getElementById('viewModeDesktopBtn');

    if (mode === 'desktop') {
      container.classList.remove('mobile-mode');
      container.classList.add('desktop-mode');
      if (mobBtn) mobBtn.classList.remove('active');
      if (deskBtn) deskBtn.classList.add('active');
    } else {
      container.classList.remove('desktop-mode');
      container.classList.add('mobile-mode');
      if (mobBtn) mobBtn.classList.add('active');
      if (deskBtn) deskBtn.classList.remove('active');
    }

    if (window.torqCustomer.bookingMap) window.torqCustomer.bookingMap.invalidateSize();
    if (window.torqCustomer.trackingMap) window.torqCustomer.trackingMap.invalidateSize();
  }

  // --- Customer Main Navigation Tabs ---
  switchCustomerTab(tabId) {
    this.activeCustomerTab = tabId;

    // Update nav items (both mobile bottom nav and top desktop nav)
    document.querySelectorAll('[data-tab]').forEach(item => {
      if (item.dataset.tab === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Panels
    const panels = ['homeTab', 'servicesTab', 'subscriptionsTab', 'bookingsTab', 'complaintsTab', 'offersTab', 'profileTab', 'trackerTab', 'settingsTab'];
    panels.forEach(p => {
      const el = document.getElementById(p);
      if (el) {
        if (p === tabId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    // Scroll to top of viewport
    const viewport = document.querySelector('.app-viewport');
    if (viewport) viewport.scrollTop = 0;

    // Refresh components if needed
    if (tabId === 'servicesTab') window.torqCustomer.renderServicesGrid();
    if (tabId === 'bookingsTab') window.torqCustomer.renderBookingsHistory();
    if (tabId === 'subscriptionsTab') window.torqCustomer.renderSubscriptionsTab();
    if (tabId === 'complaintsTab') window.torqCustomer.renderComplaintsTab();
    if (tabId === 'trackerTab') window.torqCustomer.renderActiveTracker();
  }

  // --- Notifications Drawer ---
  openNotifications() {
    const modal = document.getElementById('notificationsModal');
    const list = document.getElementById('notifModalList');
    if (!modal || !list) return;

    list.innerHTML = window.torqStore.state.notifications.map(n => `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 8px; display: flex; gap: 10px;">
        <div style="color: var(--primary-light); font-size: 16px;"><i class="fa-solid fa-bell"></i></div>
        <div style="flex: 1;">
          <div style="font-weight: 700; color: #fff; font-size: 13px;">${n.title}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${n.body}</div>
          <div style="font-size: 9px; color: var(--text-dim); margin-top: 4px;">${n.time}</div>
        </div>
      </div>
    `).join('');

    window.torqStore.markAllNotificationsRead();
    this.updateNotificationBadge();
    modal.classList.add('active');
  }

  closeNotifications() {
    const modal = document.getElementById('notificationsModal');
    if (modal) modal.classList.remove('active');
  }

  updateNotificationBadge() {
    const unread = window.torqStore.state.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('headerNotifBadge');
    if (badge) {
      if (unread > 0) {
        badge.innerText = unread;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // --- Auth & Profile Modal Simulation ---
  openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('active');
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  }

  requestOtp() {
    const phone = document.getElementById('authPhoneInput').value;
    if (!phone || phone.length < 10) {
      window.torqCustomer.showToast('Please enter a valid 10-digit mobile number', 'danger');
      return;
    }

    document.getElementById('authPhoneStep').style.display = 'none';
    document.getElementById('authOtpStep').style.display = 'block';
    window.torqCustomer.showToast('Demo OTP 8844 sent to ' + phone, 'info');

    // Auto-fill demo OTP after 1s
    setTimeout(() => {
      const otpInput = document.getElementById('authOtpInput');
      if (otpInput) otpInput.value = '8844';
    }, 1200);
  }

  verifyOtp() {
    const otp = document.getElementById('authOtpInput').value;
    if (otp === '8844' || otp.length === 4) {
      this.closeAuthModal();
      window.torqCustomer.showToast('Signed in successfully as Alex Sharma', 'success');
    } else {
      window.torqCustomer.showToast('Invalid OTP. Use demo code 8844', 'danger');
    }
  }
}

// Global functions for inline HTML calls
window.switchMainTab = (tabId) => {
  if (window.torqApp) {
    window.torqApp.switchCustomerTab(tabId);
  }
};
window.switchRole = (role) => window.torqApp && window.torqApp.switchRole(role);
window.toggleViewMode = (mode) => window.torqApp && window.torqApp.toggleViewMode(mode);

// Initialize immediately so torqApp is globally available
window.torqApp = new TorqApp();
var torqApp = window.torqApp;

// On DOM ready, notify store and sync views
document.addEventListener('DOMContentLoaded', () => {
  if (!window.torqApp) {
    window.torqApp = new TorqApp();
    window.torqApp = window.torqApp;
  }
  if (window.torqStore) {
    window.torqStore.notify();
  }
});
