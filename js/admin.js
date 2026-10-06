/* ==========================================================================
   TORQWASH PRO - Admin HQ Command Center
   Analytics KPIs, Bookings Operations, Services/Pricing, Providers, Coupons
   ========================================================================== */

class TorqAdmin {
  constructor(store) {
    this.store = store;
    this.currentTab = 'overview';
    this.init();
  }

  init() {
    this.store.subscribe(() => {
      this.refreshAdmin();
    });
  }

  switchAdminTab(tabName, el) {
    this.currentTab = tabName;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (el) el.classList.add('active');

    const panels = ['adminOverview', 'adminBookings', 'adminServices', 'adminProviders', 'adminCoupons', 'adminTickets'];
    panels.forEach(p => {
      const panelEl = document.getElementById(p);
      if (panelEl) {
        panelEl.style.display = (p === 'admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1)) ? 'block' : 'none';
      }
    });

    this.refreshAdmin();
  }

  refreshAdmin() {
    this.renderKPIs();
    this.renderBookingsTable();
    this.renderServicesEditor();
    this.renderProvidersTable();
    this.renderCouponsTable();
    this.renderTicketsTable();
  }

  renderKPIs() {
    const bookings = this.store.state.bookings;
    const totalRev = bookings.reduce((sum, b) => sum + (b.pricing ? b.pricing.totalAmount : 0), 0);
    const completed = bookings.filter(b => b.status === 'completed').length;
    const active = bookings.filter(b => ['confirmed', 'assigned', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)).length;
    const totalProviders = this.store.state.specialists.length;

    const revEl = document.getElementById('kpiTotalRevenue');
    const compEl = document.getElementById('kpiCompletedBookings');
    const actEl = document.getElementById('kpiActiveBookings');
    const provEl = document.getElementById('kpiTotalProviders');

    if (revEl) revEl.innerText = '₹' + totalRev.toLocaleString('en-IN');
    if (compEl) compEl.innerText = completed;
    if (actEl) actEl.innerText = active;
    if (provEl) provEl.innerText = totalProviders;
  }

  renderBookingsTable() {
    const tbody = document.getElementById('adminBookingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.store.state.bookings.map(b => `
      <tr>
        <td><strong>#${b.id}</strong></td>
        <td>
          <div style="font-weight: 600; color: #fff;">${b.vehicle.brand} ${b.vehicle.model}</div>
          <div style="font-size: 11px; color: #94a3b8;">${b.vehicle.regNumber} (${b.vehicle.category})</div>
        </td>
        <td>${b.service.name}</td>
        <td>
          <div>${b.dateTime.date}</div>
          <div style="font-size: 10px; color: #64748b;">${b.dateTime.timeSlot}</div>
        </td>
        <td>${(b.location && b.location.address) ? b.location.address.slice(0, 25) + '...' : 'Doorstep'}</td>
        <td><strong style="color: #38bdf8;">₹${b.pricing ? b.pricing.totalAmount : 0}</strong></td>
        <td>
          <span class="status-pill ${b.status.replace(/_/g, '-')}">${b.status.replace(/_/g, ' ').toUpperCase()}</span>
        </td>
        <td>
          <button class="details-btn" onclick="torqCustomer.openInvoiceModal('${b.id}')"><i class="fa-solid fa-receipt"></i></button>
          <button class="details-btn" onclick="torqAdmin.quickCancel('${b.id}')" style="color: var(--danger);"><i class="fa-solid fa-xmark"></i></button>
        </td>
      </tr>
    `).join('');
  }

  quickCancel(bookingId) {
    if (confirm(`Cancel booking #${bookingId} and issue 100% refund?`)) {
      this.store.updateBookingStatus(bookingId, 'cancelled');
      window.torqCustomer.showToast(`Booking #${bookingId} cancelled and refunded.`, 'info');
    }
  }

  renderServicesEditor() {
    const container = document.getElementById('adminServicesList');
    if (!container) return;

    container.innerHTML = this.store.state.services.map(s => `
      <div class="service-card" style="padding: 14px; margin-bottom: 10px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="${s.image}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" alt="">
          <div>
            <div style="font-weight: 700; color: #fff;">${s.name}</div>
            <div style="font-size: 11px; color: #94a3b8;">${s.duration} • Category: ${s.categoryTag}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div>
            <span style="font-size: 11px; color: #64748b;">Base Price:</span>
            <input type="number" id="basePrice_${s.id}" value="${s.basePrice}" style="width: 80px; background: var(--bg-card-elevated); border: 1px solid var(--border-subtle); color: #fff; padding: 4px 8px; border-radius: 4px;">
          </div>
          <button class="details-btn" onclick="torqAdmin.updateServicePrice('${s.id}')">Update</button>
        </div>
      </div>
    `).join('');
  }

  updateServicePrice(serviceId) {
    const input = document.getElementById(`basePrice_${serviceId}`);
    if (input) {
      const newPrice = parseInt(input.value, 10);
      const s = this.store.state.services.find(item => item.id === serviceId);
      if (s && newPrice > 0) {
        s.basePrice = newPrice;
        this.store.save();
        window.torqCustomer.showToast(`${s.name} price updated to ₹${newPrice}`, 'success');
      }
    }
  }

  renderProvidersTable() {
    const container = document.getElementById('adminProvidersTableBody');
    if (!container) return;

    container.innerHTML = this.store.state.specialists.map(sp => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${sp.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="">
            <div>
              <div style="font-weight: 700; color: #fff;">${sp.name}</div>
              <div style="font-size: 11px; color: #94a3b8;">${sp.vanReg}</div>
            </div>
          </div>
        </td>
        <td>${sp.title}</td>
        <td><span class="spec-badge">Torq Certified</span></td>
        <td><strong style="color: #fbbf24;">${sp.rating} ★</strong> (${sp.totalJobs} jobs)</td>
        <td><span class="status-pill completed">Active</span></td>
        <td>
          <button class="details-btn" style="color: var(--primary-light);">Audit</button>
        </td>
      </tr>
    `).join('');
  }

  renderCouponsTable() {
    const container = document.getElementById('adminCouponsTableBody');
    if (!container) return;

    container.innerHTML = this.store.state.coupons.map(cp => `
      <tr>
        <td><strong style="color: var(--primary-light); font-family: monospace;">${cp.code}</strong></td>
        <td>${cp.desc}</td>
        <td>${cp.discountType.toUpperCase()}: ${cp.discountType === 'flat' ? '₹' + cp.value : cp.value + '%'}</td>
        <td>₹${cp.minOrder}</td>
        <td><span class="status-pill completed">Active</span></td>
      </tr>
    `).join('');
  }

  addNewCoupon() {
    const code = prompt('Enter Coupon Code (e.g. MEGA100):');
    if (!code) return;
    const value = parseInt(prompt('Enter discount amount in ₹ (e.g. 100):'), 10);
    if (!value) return;

    this.store.state.coupons.push({
      code: code.toUpperCase().trim(),
      discountType: 'flat',
      value: value,
      minOrder: 499,
      desc: `₹${value} Flat Off promo coupon`
    });
    this.store.save();
    window.torqCustomer.showToast(`Coupon ${code.toUpperCase()} created!`, 'success');
  }

  renderTicketsTable() {
    const container = document.getElementById('adminTicketsTableBody');
    if (!container) return;

    container.innerHTML = this.store.state.supportTickets.map(t => `
      <tr>
        <td><strong>#${t.id}</strong></td>
        <td>${t.user}</td>
        <td>${t.subject}</td>
        <td><span class="status-pill ${t.status === 'Resolved' ? 'completed' : 'on-way'}">${t.status}</span></td>
        <td>${t.date}</td>
        <td>
          <button class="details-btn" onclick="alert('Ticket: ${t.subject}\\nResponse: ${t.response}')">View</button>
        </td>
      </tr>
    `).join('');
  }

  broadcastPushNotification() {
    const msg = prompt('Enter Push Notification message for all customers & specialists:');
    if (msg) {
      this.store.addNotification({
        title: '📢 TorqWash Broadcast',
        body: msg,
        type: 'info'
      });
      window.torqCustomer.showToast('Push alert broadcasted to 1,248 users!', 'success');
    }
  }
}

// Global instance
window.torqAdmin = new TorqAdmin(window.torqStore);
var torqAdmin = window.torqAdmin;
