/* ==========================================================================
   TORQWASH PRO - Service Provider Partner Panel ("TorqPro")
   Manages Specialist Online Status, Job Radar, Stage Updates & Photo Proofs
   ========================================================================== */

class TorqProvider {
  constructor(store) {
    this.store = store;
    this.isOnline = true;
    this.activeJob = null;
    this.init();
  }

  init() {
    this.store.subscribe((state) => {
      this.refreshProviderView();
    });
  }

  toggleOnlineStatus() {
    this.isOnline = !this.isOnline;
    const toggle = document.getElementById('providerStatusToggle');
    const label = document.getElementById('providerStatusLabel');
    if (toggle) {
      if (this.isOnline) {
        toggle.classList.add('active');
        if (label) label.innerText = 'ONLINE • ACCEPTING JOBS';
        window.torqCustomer.showToast('You are now Online and accepting jobs', 'success');
      } else {
        toggle.classList.remove('active');
        if (label) label.innerText = 'OFFLINE';
        window.torqCustomer.showToast('You are now Offline', 'warning');
      }
    }
  }

  refreshProviderView() {
    this.renderStats();
    this.renderActiveJobs();
    this.renderIncomingRequests();
  }

  renderStats() {
    const earnings = this.store.state.providerEarnings;
    const todayEarnEl = document.getElementById('provEarnToday');
    const weekEarnEl = document.getElementById('provEarnWeek');
    const jobsCountEl = document.getElementById('provJobsCount');
    const ratingEl = document.getElementById('provRatingVal');

    if (todayEarnEl) todayEarnEl.innerText = '₹' + earnings.today;
    if (weekEarnEl) weekEarnEl.innerText = '₹' + earnings.thisWeek;
    if (jobsCountEl) jobsCountEl.innerText = earnings.completedJobsToday;
    if (ratingEl) ratingEl.innerText = `${earnings.rating} ★`;
  }

  renderIncomingRequests() {
    const container = document.getElementById('providerIncomingRadar');
    if (!container) return;

    if (!this.isOnline) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-dim);">
          <i class="fa-solid fa-moon" style="font-size: 32px; margin-bottom: 8px;"></i>
          <div>You are currently Offline. Turn toggle on to receive nearby bookings.</div>
        </div>
      `;
      return;
    }

    // Bookings that are confirmed but waiting for acceptance or active
    const unaccepted = this.store.state.bookings.filter(b => b.status === 'confirmed');

    if (unaccepted.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 10px; color: var(--text-dim); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          <i class="fa-solid fa-radar" style="font-size: 28px; margin-bottom: 8px; color: var(--primary-light);"></i>
          <div style="font-size: 13px; font-weight: 600; color: #fff;">Radar Active (Searching within 6.0 km)</div>
          <div style="font-size: 11px;">Listening for new doorstep bookings in Indiranagar & Koramangala...</div>
        </div>
      `;
      return;
    }

    container.innerHTML = unaccepted.map(b => {
      const payout = Math.round(b.pricing.totalAmount * 0.75); // 75% specialist payout
      return `
        <div class="incoming-job-alert">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="brand-tag" style="background: rgba(37,99,235,0.3); color: #fff;">NEW REQUEST • 1.8 KM AWAY</span>
              <div style="font-size: 16px; font-weight: 800; color: #fff; margin-top: 6px;">${b.service.name}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.category}) • ${b.vehicle.regNumber}</div>
            </div>
            <div style="text-align: right;">
              <span class="job-payout-badge">₹${payout}</span>
              <div style="font-size: 10px; color: var(--text-dim);">Estimated Payout</div>
            </div>
          </div>

          <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: var(--radius-sm); margin-bottom: 14px; font-size: 12px;">
            <div style="color: #cbd5e1; margin-bottom: 4px;"><i class="fa-solid fa-location-dot" style="color: var(--primary-light);"></i> ${b.location.address}</div>
            <div style="color: var(--warning);"><i class="fa-solid fa-note-sticky"></i> Note: ${b.location.notes || 'Basement parking'}</div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="details-btn" style="flex: 1; border-color: var(--danger); color: var(--danger);" onclick="torqProvider.declineJob('${b.id}')">
              Decline
            </button>
            <button class="hero-cta-btn" style="flex: 2; padding: 10px;" onclick="torqProvider.acceptJob('${b.id}')">
              <i class="fa-solid fa-check"></i> Accept Job (₹${payout})
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderActiveJobs() {
    const container = document.getElementById('providerActiveJobsList');
    if (!container) return;

    const activeList = this.store.state.bookings.filter(b => 
      ['assigned', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)
    );

    if (activeList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px 10px; color: var(--text-dim);">
          No active jobs in progress.
        </div>
      `;
      return;
    }

    container.innerHTML = activeList.map(b => {
      const nextActions = {
        'assigned': { nextStatus: 'on_the_way', label: 'Start Driving (Mark On The Way)', icon: 'fa-van-shuttle' },
        'on_the_way': { nextStatus: 'arrived', label: 'Mark Arrived at Doorstep', icon: 'fa-location-dot' },
        'arrived': { nextStatus: 'in_progress', label: 'Begin Wash & Detailing', icon: 'fa-soap' },
        'in_progress': { nextStatus: 'completed', label: 'Complete Job & Sign-off', icon: 'fa-flag-checkered' }
      };

      const action = nextActions[b.status];

      return `
        <div class="service-card" style="padding: 16px; margin-bottom: 14px; border: 1px solid var(--border-active);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="status-pill ${b.status.replace(/_/g, '-')}">${b.status.replace(/_/g, ' ').toUpperCase()}</span>
              <div style="font-size: 16px; font-weight: 800; color: #fff; margin-top: 6px;">${b.service.name}</div>
              <div style="font-size: 12px; color: #94a3b8;">${b.vehicle.brand} ${b.vehicle.model} • ${b.vehicle.regNumber}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 16px; font-weight: 800; color: #34d399;">₹${b.pricing.totalAmount}</div>
              <div style="font-size: 10px; color: var(--text-dim);">${b.dateTime.timeSlot}</div>
            </div>
          </div>

          <div style="font-size: 12px; color: #cbd5e1; background: var(--bg-card-elevated); padding: 10px; border-radius: var(--radius-sm); margin-bottom: 14px;">
            <div style="margin-bottom: 4px;"><strong>Customer:</strong> ${this.store.state.currentUser.name} (${this.store.state.currentUser.phone})</div>
            <div style="margin-bottom: 4px;"><strong>Location:</strong> ${b.location.address}</div>
            <div><strong>Instructions:</strong> ${b.location.notes || 'None'}</div>
          </div>

          <!-- Proof of Work Photo Module (Before / After) -->
          <div style="display: flex; gap: 8px; margin-bottom: 14px;">
            <div style="flex: 1; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); padding: 8px; text-align: center; font-size: 11px;">
              <i class="fa-solid fa-camera" style="color: var(--primary-light);"></i>
              <div>Before Photo</div>
              <span style="color: var(--success); font-weight: 700;">Uploaded ✓</span>
            </div>
            <div style="flex: 1; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); padding: 8px; text-align: center; font-size: 11px;">
              <i class="fa-solid fa-camera" style="color: var(--primary-light);"></i>
              <div>After Photo</div>
              <span style="color: var(--primary-light); font-weight: 700;">Take Photo</span>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <a href="tel:${this.store.state.currentUser.phone}" class="details-btn" style="flex: 1; text-align: center;">
              <i class="fa-solid fa-phone"></i> Call
            </a>
            ${action ? `
              <button class="hero-cta-btn" style="flex: 2; padding: 9px;" onclick="torqProvider.advanceJobStage('${b.id}', '${action.nextStatus}')">
                <i class="fa-solid ${action.icon}"></i> ${action.label}
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  acceptJob(bookingId) {
    this.store.updateBookingStatus(bookingId, 'assigned');
    window.torqCustomer.showToast(`Job #${bookingId} Accepted! Drive safely.`, 'success');
  }

  declineJob(bookingId) {
    window.torqCustomer.showToast(`Request #${bookingId} declined. Passed to next nearby van.`, 'info');
  }

  advanceJobStage(bookingId, nextStage) {
    this.store.updateBookingStatus(bookingId, nextStage);
    window.torqCustomer.showToast(`Status updated to ${nextStage.replace(/_/g, ' ').toUpperCase()}`, 'success');
  }
}

// Global instance
window.torqProvider = new TorqProvider(window.torqStore);
var torqProvider = window.torqProvider;
