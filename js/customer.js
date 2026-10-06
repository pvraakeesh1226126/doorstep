/* ==========================================================================
   TORQWASH PRO - Customer Experience Engine
   Manages Home, Garage, 8-Step Booking Flow, Live GPS Tracking, Invoicing
   ========================================================================== */

class TorqCustomer {
  constructor(store) {
    this.store = store;
    this.activeServiceForModal = null;
    this.activeBookingProcess = {
      step: 1,
      vehicle: null,
      service: null,
      addons: [],
      dateTime: {
        date: 'Today, Oct 5',
        timeSlot: '04:30 PM - 05:30 PM'
      },
      location: null,
      pricing: {
        servicePrice: 0,
        addonsPrice: 0,
        couponDiscount: 0,
        couponCode: null,
        cgst: 0,
        sgst: 0,
        totalAmount: 0,
        paymentMethod: 'UPI (Google Pay)',
        paymentStatus: 'PAID'
      }
    };

    this.bookingMap = null;
    this.bookingMarker = null;
    this.trackingMap = null;
    this.trackingMarker = null;
    this.trackingRoute = null;
    this.simInterval = null;

    this.init();
  }

  init() {
    this.store.subscribe((state) => {
      try { this.renderHomeBanner(); } catch(e) { console.error(e); }
      try { this.renderActiveVehicle(); } catch(e) { console.error(e); }
      try { this.renderServicesGrid(); } catch(e) { console.error(e); }
      try { this.renderBookingsHistory(); } catch(e) { console.error(e); }
      try { this.renderActiveTracker(); } catch(e) { console.error(e); }
      try { this.renderOffersTab(); } catch(e) { console.error(e); }
      try { this.renderSubscriptionsTab(); } catch(e) { console.error(e); }
      try { this.renderComplaintsTab(); } catch(e) { console.error(e); }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Before/After comparison slider interaction
    document.addEventListener('input', (e) => {
      if (e.target.id === 'baSlider') {
        const val = e.target.value;
        const overlay = document.querySelector('.ba-overlay');
        const handle = document.querySelector('.ba-slider-handle');
        if (overlay) overlay.style.width = val + '%';
        if (handle) handle.style.left = val + '%';
      }
    });
  }

  // --- Active Vehicle Header & Switcher ---
  renderActiveVehicle() {
    const currentVeh = this.store.getDefaultVehicle();
    const el = document.getElementById('activeCarCard');
    if (!el || !currentVeh) return;

    el.innerHTML = `
      <div class="active-car-details">
        <div class="car-type-badge" style="overflow: hidden; padding: 0;">
          ${currentVeh.photo ? `<img src="${currentVeh.photo}" alt="${currentVeh.model}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid ${currentVeh.icon || 'fa-car-side'}"></i>`}
        </div>
        <div class="car-info-text">
          <div class="car-title">
            ${currentVeh.brand} ${currentVeh.model}
            <span class="brand-tag">${currentVeh.category}</span>
          </div>
          <div class="car-sub">
            <span class="car-plate">${currentVeh.regNumber}</span>
            <span>• ${currentVeh.color}</span>
          </div>
        </div>
      </div>
      <button class="switch-car-btn" onclick="torqCustomer.openGarageModal()">
        <i class="fa-solid fa-repeat"></i> Switch
      </button>
    `;
  }

  // --- Home Screen Banner & Active Alert ---
  renderHomeBanner() {
    const activeBooking = this.store.state.bookings.find(b => 
      ['confirmed', 'assigned', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)
    );

    const alertContainer = document.getElementById('activeBookingAlertContainer');
    if (!alertContainer) return;

    if (activeBooking) {
      const statusLabels = {
        'confirmed': 'Booking Confirmed',
        'assigned': 'Specialist Assigned',
        'on_the_way': 'Specialist En Route (ETA 12m)',
        'arrived': 'Specialist Arrived at Gate',
        'in_progress': 'Service in Progress'
      };

      alertContainer.innerHTML = `
        <div class="active-booking-alert">
          <div class="alert-content">
            <div class="alert-icon-ring">
              <i class="fa-solid fa-car-sparkle"></i>
            </div>
            <div class="alert-text">
              <div class="alert-title">${statusLabels[activeBooking.status] || 'Active Booking'}</div>
              <div class="alert-subtitle">${activeBooking.service.name} • ${activeBooking.vehicle.brand} ${activeBooking.vehicle.model}</div>
            </div>
          </div>
          <button class="alert-track-btn" onclick="torqCustomer.viewLiveTracker('${activeBooking.id}')">
            Track Live <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      `;
      alertContainer.style.display = 'block';
    } else {
      alertContainer.innerHTML = '';
      alertContainer.style.display = 'none';
    }
  }

  // --- Services Catalog Render with Dynamic Pricing by Vehicle Category ---
  renderServicesGrid(categoryFilter = 'All') {
    const grid = document.getElementById('servicesCardsGrid');
    const fullGrid = document.getElementById('fullServicesListGrid');
    if (!grid && !fullGrid) return;

    const currentVeh = this.store.getDefaultVehicle();
    const category = currentVeh ? currentVeh.category : 'Sedan';

    let services = this.store.state.services;
    if (categoryFilter !== 'All') {
      services = services.filter(s => s.categoryTag.toLowerCase() === categoryFilter.toLowerCase());
    }

    const htmlContent = services.map(srv => {
      const calculatedPrice = this.store.getCalculatedPrice(srv, category);
      return `
        <div class="service-card">
          <div class="service-card-media">
            <img src="${srv.image}" alt="${srv.name}" loading="lazy">
            ${srv.popular ? `<span class="service-badge-popular"><i class="fa-solid fa-fire"></i> Most Popular</span>` : ''}
            <span class="service-duration-badge"><i class="fa-regular fa-clock"></i> ${srv.duration}</span>
          </div>
          <div class="service-card-content">
            <div class="service-card-title">${srv.name}</div>
            <div class="service-card-desc">${srv.description}</div>
            <div class="service-features-list">
              ${srv.inclusions.slice(0, 3).map(inc => `
                <div class="feature-item"><i class="fa-solid fa-check"></i> ${inc}</div>
              `).join('')}
            </div>
            <div class="service-card-footer">
              <div class="service-price-block">
                <span class="price-sub">${category} Tier</span>
                <div class="price-val"><span class="currency">₹</span>${calculatedPrice}</div>
              </div>
              <div class="card-action-btns">
                <button class="details-btn" onclick="torqCustomer.openServiceDetails('${srv.id}')">Details</button>
                <button class="book-btn" onclick="torqCustomer.startBookingWizard('${srv.id}')">
                  Book <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (grid) grid.innerHTML = htmlContent;
    if (fullGrid) fullGrid.innerHTML = htmlContent;
  }

  renderOffersTab() {
    const container = document.getElementById('step6CouponListPromo');
    if (!container) return;

    container.innerHTML = this.store.state.coupons.map(cp => `
      <div class="offer-card" style="width: 100%; margin-bottom: 12px; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="offer-tag">${cp.code}</div>
            <div style="font-size: 14px; font-weight: 700; color: #fff; margin: 2px 0;">${cp.desc}</div>
            <div style="font-size: 11px; color: var(--text-muted);">Min Order: ₹${cp.minOrder}</div>
          </div>
          <button class="copy-code-btn" onclick="navigator.clipboard.writeText('${cp.code}'); torqCustomer.showToast('Code ${cp.code} copied to clipboard!', 'success');">
            Copy
          </button>
        </div>
      </div>
    `).join('');
  }

  filterServices(category, element) {
    document.querySelectorAll('.category-pill').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    this.renderServicesGrid(category);
  }

  // --- Service Details Modal ---
  openServiceDetails(serviceId) {
    const srv = this.store.state.services.find(s => s.id === serviceId);
    if (!srv) return;

    this.activeServiceForModal = srv;
    const currentVeh = this.store.getDefaultVehicle();
    const price = this.store.getCalculatedPrice(srv, currentVeh ? currentVeh.category : 'Sedan');

    const modal = document.getElementById('serviceDetailModal');
    if (!modal) return;

    document.getElementById('srvModalTitle').innerText = srv.name;
    document.getElementById('srvModalDesc').innerText = srv.description;
    document.getElementById('srvModalDuration').innerText = srv.duration;
    document.getElementById('srvModalPrice').innerText = '₹' + price;
    document.getElementById('srvModalRating').innerHTML = `<i class="fa-solid fa-star"></i> ${srv.rating} (${srv.reviewsCount} reviews)`;
    document.getElementById('srvModalImg').src = srv.image;

    const incList = document.getElementById('srvModalInclusions');
    incList.innerHTML = srv.inclusions.map(i => `
      <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px; font-size: 13px;">
        <i class="fa-solid fa-circle-check" style="color: var(--primary-light);"></i> ${i}
      </li>
    `).join('');

    modal.classList.add('active');
  }

  closeServiceDetails() {
    const modal = document.getElementById('serviceDetailModal');
    if (modal) modal.classList.remove('active');
  }

  bookCurrentDetailService() {
    this.closeServiceDetails();
    if (this.activeServiceForModal) {
      this.startBookingWizard(this.activeServiceForModal.id);
    }
  }

  // ==========================================================================
  // 8-STEP BOOKING WIZARD
  // ==========================================================================
  startBookingWizard(serviceId) {
    const srv = this.store.state.services.find(s => s.id === serviceId) || this.store.state.services[1];
    const defaultVeh = this.store.getDefaultVehicle();

    this.activeBookingProcess = {
      step: 1,
      vehicle: defaultVeh,
      service: srv,
      addons: [],
      dateTime: {
        date: 'Today, Oct 5',
        timeSlot: '04:30 PM - 05:30 PM'
      },
      location: { ...this.store.state.currentUser.currentLocation },
      pricing: {
        servicePrice: this.store.getCalculatedPrice(srv, defaultVeh ? defaultVeh.category : 'Sedan'),
        addonsPrice: 0,
        couponDiscount: 0,
        couponCode: null,
        cgst: 0,
        sgst: 0,
        totalAmount: 0,
        paymentMethod: 'UPI (Google Pay)',
        paymentStatus: 'PAID'
      }
    };

    this.recalculatePrices();
    this.openBookingModal();
    this.renderWizardStep();
  }

  openBookingModal() {
    const modal = document.getElementById('bookingWizardModal');
    if (modal) {
      modal.classList.add('active');
      if (document.body) document.body.style.overflow = 'hidden';
    }
  }

  closeBookingModal() {
    const modal = document.getElementById('bookingWizardModal');
    if (modal) {
      modal.classList.remove('active');
      if (document.body) document.body.style.overflow = '';
    }
  }

  goToWizardStep(stepNum) {
    if (stepNum < 1 || stepNum > 8) return;
    this.activeBookingProcess.step = stepNum;
    this.renderWizardStep();
  }

  nextWizardStep() {
    if (this.activeBookingProcess.step === 7) {
      // Step 7 to 8 is Confirm & Pay
      this.finalizeBooking();
      return;
    }
    this.goToWizardStep(this.activeBookingProcess.step + 1);
  }

  prevWizardStep() {
    this.goToWizardStep(this.activeBookingProcess.step - 1);
  }

  renderWizardStep() {
    const step = this.activeBookingProcess.step;

    // Update Counter & Progress Bar
    const counterEl = document.getElementById('wizardStepCounter');
    if (counterEl) counterEl.innerText = `Step ${step} of 8`;

    const progressFill = document.getElementById('wizardProgressFill');
    if (progressFill) progressFill.style.width = `${(step / 8) * 100}%`;

    // Hide all steps, show current
    document.querySelectorAll('.wizard-step').forEach((el, idx) => {
      if (idx + 1 === step) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Step-specific renders
    if (step === 1) this.renderStep1Vehicles();
    if (step === 2) this.renderStep2Addons();
    if (step === 3) this.renderStep3DateTime();
    if (step === 4) this.renderStep4Location();
    if (step === 5) this.renderStep5Review();
    if (step === 6) this.renderStep6Coupons();
    if (step === 7) this.renderStep7Payment();

    // Wizard action buttons
    const prevBtn = document.getElementById('wizardPrevBtn');
    const nextBtn = document.getElementById('wizardNextBtn');

    if (prevBtn) {
      prevBtn.style.visibility = (step === 1 || step === 8) ? 'hidden' : 'visible';
    }

    if (nextBtn) {
      if (step === 7) {
        nextBtn.innerHTML = `Pay ₹${this.activeBookingProcess.pricing.totalAmount} <i class="fa-solid fa-lock"></i>`;
      } else if (step === 8) {
        nextBtn.innerHTML = `Track Live <i class="fa-solid fa-location-dot"></i>`;
        nextBtn.onclick = () => {
          this.closeBookingModal();
          this.viewLiveTracker(this.lastCreatedBookingId);
        };
      } else {
        nextBtn.innerHTML = `Continue <i class="fa-solid fa-arrow-right"></i>`;
        nextBtn.onclick = () => this.nextWizardStep();
      }
    }
  }

  // --- Step 1: Vehicle Selection ---
  renderStep1Vehicles() {
    const container = document.getElementById('step1VehicleList');
    if (!container) return;

    container.innerHTML = this.store.state.vehicles.map(v => {
      const isSelected = this.activeBookingProcess.vehicle && this.activeBookingProcess.vehicle.id === v.id;
      return `
        <div class="vehicle-select-item ${isSelected ? 'selected' : ''}" onclick="torqCustomer.selectBookingVehicle('${v.id}')">
          <div class="vehicle-select-left">
            <div class="car-icon-box"><i class="fa-solid ${v.icon || 'fa-car-side'}"></i></div>
            <div>
              <div style="font-weight: 700; color: #fff;">${v.brand} ${v.model}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${v.category} • ${v.regNumber}</div>
            </div>
          </div>
          <div class="radio-check"></div>
        </div>
      `;
    }).join('');
  }

  selectBookingVehicle(vehicleId) {
    const v = this.store.state.vehicles.find(item => item.id === vehicleId);
    if (v) {
      this.activeBookingProcess.vehicle = v;
      this.recalculatePrices();
      this.renderStep1Vehicles();
    }
  }

  // --- Step 2: Add-ons Multi-Select ---
  renderStep2Addons() {
    const container = document.getElementById('step2AddonsList');
    const headerEl = document.getElementById('step2ServiceHeader');
    if (!container) return;

    const srv = this.activeBookingProcess.service;
    const veh = this.activeBookingProcess.vehicle;
    const basePrice = this.store.getCalculatedPrice(srv, veh ? veh.category : 'Sedan');

    if (headerEl) {
      const srvName = srv ? srv.name : 'Doorstep Wash';
      const srvDur = srv ? srv.duration : '45 Mins';
      const vehName = veh ? `${veh.brand} ${veh.model}` : 'Selected Vehicle';
      headerEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 14px;">
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 15px;">${srvName}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${srvDur} • For ${vehName}</div>
          </div>
          <div style="font-size: 18px; font-weight: 800; color: var(--primary-light);">₹${basePrice}</div>
        </div>
      `;
    }

    container.innerHTML = this.store.state.addons.map(addon => {
      const isChecked = this.activeBookingProcess.addons.some(a => a.id === addon.id);
      return `
        <div class="addon-row ${isChecked ? 'checked' : ''}" onclick="torqCustomer.toggleAddon('${addon.id}')">
          <div class="addon-left">
            <div class="addon-checkbox"></div>
            <div>
              <div class="addon-name">${addon.name}</div>
              <div class="addon-desc">${addon.desc}</div>
            </div>
          </div>
          <div class="addon-price">+₹${addon.price}</div>
        </div>
      `;
    }).join('');
  }

  toggleAddon(addonId) {
    const addon = this.store.state.addons.find(a => a.id === addonId);
    if (!addon) return;

    const idx = this.activeBookingProcess.addons.findIndex(a => a.id === addonId);
    if (idx >= 0) {
      this.activeBookingProcess.addons.splice(idx, 1);
    } else {
      this.activeBookingProcess.addons.push(addon);
    }
    this.recalculatePrices();
    this.renderStep2Addons();
  }

  // --- Step 3: Date & Time Picker ---
  renderStep3DateTime() {
    const dateRow = document.getElementById('step3DateRow');
    if (!dateRow) return;

    const dates = [
      { day: 'TODAY', num: '05', full: 'Today, Oct 5' },
      { day: 'TUE', num: '06', full: 'Tomorrow, Oct 6' },
      { day: 'WED', num: '07', full: 'Wed, Oct 7' },
      { day: 'THU', num: '08', full: 'Thu, Oct 8' }
    ];

    dateRow.innerHTML = dates.map(d => {
      const isSelected = this.activeBookingProcess.dateTime.date === d.full;
      return `
        <div class="date-pill ${isSelected ? 'selected' : ''}" onclick="torqCustomer.selectDate('${d.full}')">
          <span class="day-name">${d.day}</span>
          <span class="day-num">${d.num}</span>
        </div>
      `;
    }).join('');

    const timeContainer = document.getElementById('step3TimeSlots');
    if (!timeContainer) return;

    const slots = [
      { time: '08:30 AM - 09:30 AM', slots: '2 slots left' },
      { time: '11:00 AM - 12:00 PM', slots: 'Fastest eco van' },
      { time: '02:00 PM - 03:00 PM', slots: '3 slots left' },
      { time: '04:30 PM - 05:30 PM', slots: 'Popular time' },
      { time: '06:30 PM - 07:30 PM', slots: 'Evening slot' }
    ];

    timeContainer.innerHTML = slots.map(s => {
      const isSelected = this.activeBookingProcess.dateTime.timeSlot === s.time;
      return `
        <div class="time-slot-btn ${isSelected ? 'selected' : ''}" onclick="torqCustomer.selectTimeSlot('${s.time}')">
          <div class="slot-time">${s.time}</div>
          <div class="slot-avail"><i class="fa-solid fa-bolt"></i> ${s.slots}</div>
        </div>
      `;
    }).join('');
  }

  selectDate(fullDate) {
    this.activeBookingProcess.dateTime.date = fullDate;
    this.renderStep3DateTime();
  }

  selectTimeSlot(slot) {
    this.activeBookingProcess.dateTime.timeSlot = slot;
    this.renderStep3DateTime();
  }

  // --- Step 4: Location & Map ---
  renderStep4Location() {
    const savedPills = document.getElementById('step4SavedPills');
    if (savedPills) {
      savedPills.innerHTML = this.store.state.currentUser.savedAddresses.map(addr => {
        const isSelected = this.activeBookingProcess.location.tag === addr.tag;
        return `
          <div class="address-type-pill ${isSelected ? 'selected' : ''}" onclick="torqCustomer.selectAddressPreset('${addr.id}')">
            <i class="fa-solid ${addr.tag === 'Home' ? 'fa-house' : addr.tag === 'Work' ? 'fa-briefcase' : 'fa-location-dot'}"></i> ${addr.tag}
          </div>
        `;
      }).join('');
    }

    const addrInput = document.getElementById('step4AddressInput');
    const notesInput = document.getElementById('step4NotesInput');
    if (addrInput) addrInput.value = this.activeBookingProcess.location.address || '';
    if (notesInput) notesInput.value = this.activeBookingProcess.location.notes || '';

    // Initialize or refresh Leaflet map
    setTimeout(() => {
      this.initBookingMap();
    }, 150);
  }

  initBookingMap() {
    const mapEl = document.getElementById('bookingMapPicker');
    if (!mapEl || typeof L === 'undefined') return;

    const lat = this.activeBookingProcess.location.lat || 12.9716;
    const lng = this.activeBookingProcess.location.lng || 77.6412;

    if (!this.bookingMap) {
      this.bookingMap = L.map('bookingMapPicker', { zoomControl: false }).setView([lat, lng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.bookingMap);

      const customIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `<div style="background: #2563eb; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"><i class="fa-solid fa-car"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      this.bookingMarker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(this.bookingMap);

      this.bookingMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        this.activeBookingProcess.location.lat = pos.lat;
        this.activeBookingProcess.location.lng = pos.lng;
        this.showToast('Location Pin Dropped', 'info');
      });
    } else {
      this.bookingMap.invalidateSize();
      this.bookingMap.setView([lat, lng], 15);
      if (this.bookingMarker) this.bookingMarker.setLatLng([lat, lng]);
    }
  }

  locateGPS() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.activeBookingProcess.location.lat = lat;
          this.activeBookingProcess.location.lng = lng;
          if (this.bookingMap && this.bookingMarker) {
            this.bookingMap.setView([lat, lng], 16);
            this.bookingMarker.setLatLng([lat, lng]);
          }
          this.showToast('GPS Location Detected!', 'success');
        },
        () => {
          this.showToast('Using default Bengaluru location pin', 'info');
        }
      );
    }
  }

  selectAddressPreset(addrId) {
    const addr = this.store.state.currentUser.savedAddresses.find(a => a.id === addrId);
    if (addr) {
      this.activeBookingProcess.location = { ...addr };
      this.renderStep4Location();
      if (this.bookingMap && this.bookingMarker) {
        this.bookingMap.setView([addr.lat, addr.lng], 15);
        this.bookingMarker.setLatLng([addr.lat, addr.lng]);
      }
    }
  }

  // --- Step 5: Review & Cost Breakdown ---
  renderStep5Review() {
    const container = document.getElementById('step5ReviewSummary');
    if (!container) return;

    this.recalculatePrices();
    const p = this.activeBookingProcess.pricing;
    const b = this.activeBookingProcess;

    const vehName = (b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.category})` : 'Selected Vehicle');
    const locName = (b.location ? (b.location.title || b.location.tag || b.location.address || 'Doorstep Location') : 'Doorstep Location');
    const locSnippet = (b.location && b.location.address) ? b.location.address.slice(0, 35) + '...' : 'Doorstep Address';

    container.innerHTML = `
      <div class="review-summary-card">
        <div style="font-weight: 700; color: #fff; margin-bottom: 10px; font-size: 15px;">Appointment Details</div>
        <div class="summary-row"><span>Vehicle:</span> <strong style="color: #fff;">${vehName}</strong></div>
        <div class="summary-row"><span>Slot:</span> <strong style="color: #fff;">${b.dateTime.date} • ${b.dateTime.timeSlot}</strong></div>
        <div class="summary-row"><span>Location:</span> <strong style="color: #fff;">${locName} (${locSnippet})</strong></div>
      </div>

      <div class="review-summary-card">
        <div style="font-weight: 700; color: #fff; margin-bottom: 10px; font-size: 15px;">Cost Breakdown</div>
        <div class="summary-row">
          <span>${b.service.name}</span>
          <span>₹${p.servicePrice}</span>
        </div>
        ${b.addons.map(a => `
          <div class="summary-row">
            <span>+ ${a.name}</span>
            <span>₹${a.price}</span>
          </div>
        `).join('')}
        ${p.couponDiscount > 0 ? `
          <div class="summary-row" style="color: var(--success);">
            <span>Coupon Discount (${p.couponCode})</span>
            <span>- ₹${p.couponDiscount}</span>
          </div>
        ` : ''}
        <div class="summary-row">
          <span>CGST (9%)</span>
          <span>₹${p.cgst}</span>
        </div>
        <div class="summary-row">
          <span>SGST (9%)</span>
          <span>₹${p.sgst}</span>
        </div>
        <div class="summary-row bold">
          <span>Total Payable</span>
          <span style="color: var(--primary-light); font-size: 18px;">₹${p.totalAmount}</span>
        </div>
      </div>
    `;
  }

  // --- Step 6: Coupons ---
  renderStep6Coupons() {
    const list = document.getElementById('step6CouponList');
    if (!list) return;

    list.innerHTML = this.store.state.coupons.map(cp => {
      const isApplied = this.activeBookingProcess.pricing.couponCode === cp.code;
      return `
        <div class="offer-card" style="width: 100%; margin-bottom: 10px; padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="offer-tag">${cp.code}</div>
              <div style="font-size: 13px; font-weight: 700; color: #fff;">${cp.desc}</div>
            </div>
            <button class="copy-code-btn" onclick="torqCustomer.applyCouponCode('${cp.code}')">
              ${isApplied ? 'Applied ✓' : 'Apply'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  applyCouponCode(codeToApply) {
    const code = codeToApply || (document.getElementById('step6InputCode') ? document.getElementById('step6InputCode').value : '');
    const subtotal = this.activeBookingProcess.pricing.servicePrice + this.activeBookingProcess.pricing.addonsPrice;
    
    const result = this.store.validateCoupon(code, subtotal);
    if (result.valid) {
      this.activeBookingProcess.pricing.couponCode = result.coupon.code;
      this.activeBookingProcess.pricing.couponDiscount = result.discount;
      this.recalculatePrices();
      this.showToast(`Coupon ${result.coupon.code} applied! Saved ₹${result.discount}`, 'success');
      this.renderStep6Coupons();
    } else {
      this.showToast(result.error, 'danger');
    }
  }

  // --- Step 7: Payment Options ---
  renderStep7Payment() {
    const amountEl = document.getElementById('step7PayAmount');
    if (amountEl) amountEl.innerText = '₹' + this.activeBookingProcess.pricing.totalAmount;

    // Default UPI tab
    this.selectPaymentMethod('UPI (Google Pay)');
  }

  selectPaymentMethod(method) {
    this.activeBookingProcess.pricing.paymentMethod = method;
    document.querySelectorAll('.payment-option-row').forEach(row => {
      if (row.dataset.method === method) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });

    const qrBlock = document.getElementById('upiQrSection');
    if (qrBlock) {
      qrBlock.style.display = method.includes('UPI') ? 'flex' : 'none';
    }
  }

  // --- Price Math Engine ---
  recalculatePrices() {
    const b = this.activeBookingProcess;
    if (!b.service || !b.vehicle) return;

    b.pricing.servicePrice = this.store.getCalculatedPrice(b.service, b.vehicle.category);
    b.pricing.addonsPrice = b.addons.reduce((sum, a) => sum + a.price, 0);

    const subtotal = b.pricing.servicePrice + b.pricing.addonsPrice;
    const taxableAmount = Math.max(0, subtotal - (b.pricing.couponDiscount || 0));

    // 18% GST (9% CGST + 9% SGST)
    b.pricing.cgst = Math.round(taxableAmount * 0.09);
    b.pricing.sgst = Math.round(taxableAmount * 0.09);
    b.pricing.totalAmount = taxableAmount + b.pricing.cgst + b.pricing.sgst;
  }

  // --- Finalize & Create Booking ---
  finalizeBooking() {
    // Read final inputs from Step 4 if modified
    const addrInput = document.getElementById('step4AddressInput');
    const notesInput = document.getElementById('step4NotesInput');
    if (addrInput && addrInput.value) this.activeBookingProcess.location.address = addrInput.value;
    if (notesInput && notesInput.value) this.activeBookingProcess.location.notes = notesInput.value;

    this.recalculatePrices();

    const created = this.store.createBooking(this.activeBookingProcess);
    this.lastCreatedBookingId = created.id;

    // Advance to Step 8 (Confirmation)
    this.goToWizardStep(8);

    // Render Step 8 Confirmation Card
    const confCard = document.getElementById('step8ConfirmCard');
    if (confCard) {
      confCard.innerHTML = `
        <div style="text-align: center; padding: 20px 10px;">
          <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); border: 2px solid var(--success); color: var(--success); font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <i class="fa-solid fa-check"></i>
          </div>
          <h2 style="color: #fff; font-size: 22px; margin-bottom: 6px;">Booking Confirmed!</h2>
          <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 18px;">
            Order <strong style="color: #fff;">#${created.id}</strong> has been assigned to our mobile detailing specialist.
          </p>

          <div class="review-summary-card" style="text-align: left; margin-bottom: 18px;">
            <div class="summary-row"><span>Service:</span> <strong>${created.service.name}</strong></div>
            <div class="summary-row"><span>Vehicle:</span> <strong>${created.vehicle.brand} ${created.vehicle.model} (${created.vehicle.regNumber})</strong></div>
            <div class="summary-row"><span>Time Slot:</span> <strong>${created.dateTime.date} • ${created.dateTime.timeSlot}</strong></div>
            <div class="summary-row"><span>Specialist:</span> <strong>${created.specialist.name} (Torq Certified)</strong></div>
            <div class="summary-row bold"><span>Amount Paid:</span> <strong>₹${created.pricing.totalAmount}</strong></div>
          </div>

          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="details-btn" onclick="torqCustomer.openInvoiceModal('${created.id}')">
              <i class="fa-solid fa-file-invoice"></i> View Tax Invoice
            </button>
            <button class="hero-cta-btn" onclick="torqCustomer.closeBookingModal(); torqCustomer.viewLiveTracker('${created.id}')">
              <i class="fa-solid fa-location-crosshairs"></i> Track Live Specialist
            </button>
          </div>
        </div>
      `;
    }

    this.showToast(`Booking #${created.id} confirmed!`, 'success');
  }

  // ==========================================================================
  // LIVE TRACKING EXPERIENCE (Leaflet GPS Map & Stage Progression)
  // ==========================================================================
  viewLiveTracker(bookingId) {
    const booking = this.store.state.bookings.find(b => b.id === bookingId) || this.store.state.bookings[0];
    if (!booking) return;

    this.currentTrackedBooking = booking;

    // Switch view to tracker panel
    window.switchMainTab('trackerTab');

    this.renderActiveTracker();
  }

  renderActiveTracker() {
    const booking = this.currentTrackedBooking || this.store.state.bookings[0];
    if (!booking) return;

    const el = document.getElementById('liveTrackerContent');
    if (!el) return;

    const spec = booking.specialist;

    el.innerHTML = `
      <!-- Map Header -->
      <div class="tracker-map-view">
        <div id="liveTrackingMap"></div>
        <div class="live-eta-overlay">
          <div class="pulse-dot"></div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Live ETA</div>
            <div class="eta-time-val" id="liveEtaText">${spec.etaMins || 12} MINS</div>
          </div>
        </div>
      </div>

      <!-- Specialist Card -->
      <div class="specialist-card">
        <div class="specialist-left">
          <div class="spec-avatar">
            <img src="${spec.avatar || 'assets/images/technician_mark.jpg'}" alt="${spec.name}">
          </div>
          <div>
            <div class="spec-name">
              ${spec.name} <span class="spec-badge">PRO</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              ${spec.vanReg} • Mobile Detailing Lab
            </div>
            <div class="spec-rating">
              <i class="fa-solid fa-star"></i> ${spec.rating} (340+ Washes)
            </div>
          </div>
        </div>
        <div class="specialist-actions">
          <a href="tel:${spec.phone}" class="contact-btn" title="Call Specialist">
            <i class="fa-solid fa-phone"></i>
          </a>
          <button class="contact-btn" onclick="torqCustomer.openChatModal()" title="In-App Chat">
            <i class="fa-solid fa-comment-dots"></i>
          </button>
        </div>
      </div>

      <!-- Timeline Step Progression -->
      <div class="tracking-timeline-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-weight: 700; color: #fff; font-size: 14px;">Service Status Tracker</div>
          <span class="brand-tag">Order #${booking.id}</span>
        </div>
        <div class="timeline-steps">
          ${booking.timeline.map(step => {
            const isDone = step.done;
            const isActive = booking.status === step.step;
            return `
              <div class="timeline-step ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}">
                <div class="timeline-dot">
                  ${isDone ? '<i class="fa-solid fa-check"></i>' : ''}
                </div>
                <div class="step-label">${step.title}</div>
                <div class="step-desc">${step.desc || ''} ${step.time !== '--' ? `(${step.time})` : ''}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Interactive Simulation Control (Allows instant testing of all stages) -->
      <div class="simulation-controller">
        <div class="sim-text">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Demo Simulator: Advance booking stage
        </div>
        <button class="sim-advance-btn" onclick="torqCustomer.advanceSimulationStage('${booking.id}')">
          Advance Stage <i class="fa-solid fa-forward-step"></i>
        </button>
      </div>

      <!-- Action Footer -->
      <div style="display: flex; gap: 10px; margin-top: 14px;">
        <button class="details-btn" style="flex: 1;" onclick="torqCustomer.openInvoiceModal('${booking.id}')">
          <i class="fa-solid fa-file-invoice"></i> View Invoice
        </button>
        ${booking.status === 'completed' ? `
          <button class="book-btn" style="flex: 1;" onclick="torqCustomer.openReviewModal('${booking.id}')">
            <i class="fa-solid fa-star"></i> Leave Review
          </button>
        ` : ''}
      </div>
    `;

    setTimeout(() => {
      this.initTrackingMap(booking);
    }, 200);
  }

  initTrackingMap(booking) {
    const mapEl = document.getElementById('liveTrackingMap');
    if (!mapEl || typeof L === 'undefined') return;

    const customerLat = booking.location.lat || 12.9716;
    const customerLng = booking.location.lng || 77.6412;
    const specLat = booking.specialist.currentLat || 12.9660;
    const specLng = booking.specialist.currentLng || 77.6360;

    if (this.trackingMap) {
      this.trackingMap.remove();
      this.trackingMap = null;
    }

    this.trackingMap = L.map('liveTrackingMap', { zoomControl: false }).setView([customerLat, customerLng], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.trackingMap);

    // Customer Marker
    const custIcon = L.divIcon({
      className: 'cust-pin',
      html: `<div style="background: #10b981; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.5);"><i class="fa-solid fa-house"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([customerLat, customerLng], { icon: custIcon }).addTo(this.trackingMap).bindPopup('Your Doorstep');

    // Specialist Van Marker
    const vanIcon = L.divIcon({
      className: 'van-pin',
      html: `<div style="background: #2563eb; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; box-shadow: 0 0 15px rgba(37, 99, 235, 0.8); animation: pulse 2s infinite;"><i class="fa-solid fa-van-shuttle"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    this.trackingMarker = L.marker([specLat, specLng], { icon: vanIcon }).addTo(this.trackingMap).bindPopup('Mark Jenkins (Mobile Detailing Van)');

    // Route line
    this.trackingRoute = L.polyline([[specLat, specLng], [customerLat, customerLng]], {
      color: '#2563eb',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.8
    }).addTo(this.trackingMap);

    this.trackingMap.fitBounds(this.trackingRoute.getBounds(), { padding: [40, 40] });
  }

  advanceSimulationStage(bookingId) {
    const booking = this.store.state.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const stages = ['confirmed', 'assigned', 'on_the_way', 'arrived', 'in_progress', 'completed'];
    const currIdx = stages.indexOf(booking.status);
    const nextIdx = (currIdx + 1) % stages.length;
    const nextStage = stages[nextIdx];

    this.store.updateBookingStatus(bookingId, nextStage);
    this.currentTrackedBooking = this.store.state.bookings.find(b => b.id === bookingId);
    this.renderActiveTracker();
    this.showToast(`Stage updated to: ${nextStage.replace(/_/g, ' ').toUpperCase()}`, 'info');
  }

  // ==========================================================================
  // GST TAX INVOICE GENERATOR & MODAL
  // ==========================================================================
  openInvoiceModal(bookingId) {
    const booking = this.store.state.bookings.find(b => b.id === bookingId) || this.store.state.bookings[0];
    if (!booking) return;

    const modal = document.getElementById('taxInvoiceModal');
    const container = document.getElementById('invoicePrintContainer');
    if (!modal || !container) return;

    const p = booking.pricing;
    const dateFormatted = new Date(booking.createdTimestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

      const billedAddr = (booking.location && booking.location.address) ? booking.location.address : 'Indiranagar, Bengaluru';
      const vehDisplay = booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : 'Doorstep Vehicle';
      const vehReg = booking.vehicle ? booking.vehicle.regNumber : 'KA-01-MD-0000';
      const vehCat = booking.vehicle ? booking.vehicle.category : 'SUV';

      container.innerHTML = `
      <div class="invoice-header">
        <div>
          <div class="inv-brand">TORQWASH PRO</div>
          <div style="font-size: 11px; color: #64748b;">
            TorqWash Technologies Pvt Ltd<br>
            GSTIN: 29AAACT9824P1Z4 • PAN: AAACT9824P<br>
            100 Feet Rd, Indiranagar, Bengaluru - 560038
          </div>
        </div>
        <div class="inv-meta">
          <div style="font-size: 16px; font-weight: 800; color: #0f172a;">TAX INVOICE</div>
          <div><strong>Invoice #:</strong> ${booking.invoiceNumber}</div>
          <div><strong>Date:</strong> ${dateFormatted}</div>
          <div><strong>Order Ref:</strong> #${booking.id}</div>
          <div><strong>Payment:</strong> <span style="color: #10b981; font-weight: 700;">${p.paymentStatus} (${p.paymentMethod})</span></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; background: #f8fafc; padding: 12px; border-radius: 6px;">
        <div>
          <strong>Billed To:</strong><br>
          ${this.store.state.currentUser.name}<br>
          ${billedAddr}<br>
          Phone: ${this.store.state.currentUser.phone}
        </div>
        <div>
          <strong>Service Vehicle:</strong><br>
          ${vehDisplay}<br>
          Registration: <strong>${vehReg}</strong><br>
          Category: ${vehCat}
        </div>
      </div>

      <table class="inv-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>SAC Code</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${booking.service.name}</strong><br>
              <span style="font-size: 11px; color: #64748b;">Doorstep automotive cleaning & detailing</span>
            </td>
            <td>998714</td>
            <td>1</td>
            <td>₹${p.servicePrice}</td>
            <td>₹${p.servicePrice}</td>
          </tr>
          ${booking.addons.map(a => `
            <tr>
              <td>+ ${a.name}</td>
              <td>998714</td>
              <td>1</td>
              <td>₹${a.price}</td>
              <td>₹${a.price}</td>
            </tr>
          `).join('')}
          ${p.couponDiscount > 0 ? `
            <tr style="color: #10b981;">
              <td>Discount Applied (${p.couponCode})</td>
              <td>--</td>
              <td>1</td>
              <td>-₹${p.couponDiscount}</td>
              <td>-₹${p.couponDiscount}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="inv-total-section">
        <div class="inv-total-box">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;">
            <span>CGST (9%):</span>
            <span>₹${p.cgst}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;">
            <span>SGST (9%):</span>
            <span>₹${p.sgst}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: 800; font-size: 16px; border-top: 2px solid #0f172a; margin-top: 4px;">
            <span>Grand Total:</span>
            <span>₹${p.totalAmount}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;">
        <div>Thank you for choosing TorqWash Pro Doorstep Care!</div>
        <button class="details-btn" onclick="window.print()" style="background: #0f172a; color: #fff;">
          <i class="fa-solid fa-print"></i> Print / Download PDF
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  closeInvoiceModal() {
    const modal = document.getElementById('taxInvoiceModal');
    if (modal) modal.classList.remove('active');
  }

  // ==========================================================================
  // CUSTOMER BOOKING HISTORY & REBOOK
  // ==========================================================================
  renderBookingsHistory(filter = 'All') {
    const list = document.getElementById('bookingsHistoryList');
    if (!list) return;

    let bookings = this.store.state.bookings;
    if (filter === 'Active') {
      bookings = bookings.filter(b => ['confirmed', 'assigned', 'on_the_way', 'arrived', 'in_progress'].includes(b.status));
    } else if (filter === 'Completed') {
      bookings = bookings.filter(b => b.status === 'completed');
    }

    if (bookings.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-dim);">
          <i class="fa-solid fa-car-wash" style="font-size: 40px; margin-bottom: 12px; opacity: 0.4;"></i>
          <div>No bookings found in this category</div>
        </div>
      `;
      return;
    }

    list.innerHTML = bookings.map(b => {
      const isActive = ['confirmed', 'assigned', 'on_the_way', 'arrived', 'in_progress'].includes(b.status);
      return `
        <div class="service-card" style="margin-bottom: 14px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="status-pill ${b.status.replace(/_/g, '-')}">${b.status.replace(/_/g, ' ').toUpperCase()}</span>
              <div style="font-size: 15px; font-weight: 700; color: #fff; margin-top: 6px;">${b.service.name}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${b.vehicle.brand} ${b.vehicle.model} • ${b.vehicle.regNumber}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 16px; font-weight: 800; color: #fff;">₹${b.pricing.totalAmount}</div>
              <div style="font-size: 10px; color: var(--text-dim);">${b.dateTime.date}</div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
            ${isActive ? `
              <button class="book-btn" style="flex: 1;" onclick="torqCustomer.viewLiveTracker('${b.id}')">
                <i class="fa-solid fa-location-dot"></i> Live Tracker
              </button>
            ` : `
              <button class="details-btn" style="flex: 1;" onclick="torqCustomer.startBookingWizard('${b.service.id}')">
                <i class="fa-solid fa-arrow-rotate-right"></i> Rebook
              </button>
            `}
            <button class="details-btn" onclick="torqCustomer.openInvoiceModal('${b.id}')">
              <i class="fa-solid fa-receipt"></i> Invoice
            </button>
            ${b.status === 'completed' && !b.review ? `
              <button class="details-btn" onclick="torqCustomer.openReviewModal('${b.id}')">
                <i class="fa-solid fa-star"></i> Rate
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  filterBookings(filter, el) {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    this.renderBookingsHistory(filter);
  }

  // ==========================================================================
  // GARAGE & VEHICLE MANAGEMENT MODAL
  // ==========================================================================
  openGarageModal() {
    const modal = document.getElementById('garageModal');
    if (!modal) return;

    const list = document.getElementById('garageVehiclesList');
    if (list) {
      list.innerHTML = this.store.state.vehicles.map(v => `
        <div class="vehicle-select-item ${v.isDefault ? 'selected' : ''}" style="margin-bottom: 8px;">
          <div class="vehicle-select-left">
            <div class="car-icon-box"><i class="fa-solid ${v.icon || 'fa-car-side'}"></i></div>
            <div>
              <div style="font-weight: 700; color: #fff;">${v.brand} ${v.model} ${v.isDefault ? '<span class="spec-badge">Default</span>' : ''}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${v.category} • ${v.regNumber} • ${v.color}</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            ${!v.isDefault ? `
              <button class="details-btn" onclick="torqCustomer.setDefaultCar('${v.id}')">Set Active</button>
            ` : ''}
            <button class="details-btn" style="color: var(--danger);" onclick="torqCustomer.deleteCar('${v.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `).join('');
    }

    modal.classList.add('active');
  }

  closeGarageModal() {
    const modal = document.getElementById('garageModal');
    if (modal) modal.classList.remove('active');
  }

  setDefaultCar(id) {
    this.store.setDefaultVehicle(id);
    this.openGarageModal();
    this.showToast('Active car updated!', 'success');
  }

  deleteCar(id) {
    if (this.store.state.vehicles.length <= 1) {
      this.showToast('Must keep at least 1 car in garage', 'warning');
      return;
    }
    this.store.removeVehicle(id);
    this.openGarageModal();
    this.showToast('Car removed from garage', 'info');
  }

  openAddVehicleModal() {
    this.closeGarageModal();
    const modal = document.getElementById('addVehicleModal');
    if (modal) modal.classList.add('active');
  }

  closeAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    if (modal) modal.classList.remove('active');
  }

  saveNewVehicle() {
    const brand = document.getElementById('addVehBrand').value;
    const model = document.getElementById('addVehModel').value;
    const regNumber = document.getElementById('addVehReg').value;
    const category = document.getElementById('addVehCategory').value;
    const color = document.getElementById('addVehColor').value;

    if (!brand || !model || !regNumber) {
      this.showToast('Please fill all vehicle details', 'danger');
      return;
    }

    this.store.addVehicle({ brand, model, regNumber, category, color });
    this.closeAddVehicleModal();
    this.showToast(`${brand} ${model} added to your garage!`, 'success');
  }

  // ==========================================================================
  // REVIEW SUBMISSION MODAL
  // ==========================================================================
  openReviewModal(bookingId) {
    this.reviewBookingId = bookingId;
    this.currentSelectedStars = 5;
    const modal = document.getElementById('reviewModal');
    if (modal) modal.classList.add('active');
  }

  closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) modal.classList.remove('active');
  }

  setRatingStars(stars) {
    this.currentSelectedStars = stars;
    const starsEl = document.querySelectorAll('#starRatingInput i');
    starsEl.forEach((s, idx) => {
      if (idx < stars) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  }

  submitRating() {
    const comment = document.getElementById('reviewCommentInput').value;
    this.store.submitReview(this.reviewBookingId, this.currentSelectedStars, comment);
    this.closeReviewModal();
    this.showToast('Thank you! Review submitted.', 'success');
  }

  // --- Canned Quick Chat Modal ---
  openChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) modal.classList.add('active');
  }

  closeChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) modal.classList.remove('active');
  }

  sendQuickChat(msg) {
    const container = document.getElementById('chatMessagesBox');
    if (container) {
      container.innerHTML += `
        <div style="align-self: flex-end; background: var(--primary); color: #fff; padding: 8px 12px; border-radius: 12px; max-width: 80%; font-size: 13px; margin-bottom: 8px;">
          ${msg}
        </div>
      `;
      setTimeout(() => {
        container.innerHTML += `
          <div style="align-self: flex-start; background: var(--bg-card-elevated); color: #fff; padding: 8px 12px; border-radius: 12px; max-width: 80%; font-size: 13px; margin-bottom: 8px;">
            Understood! I'll follow your notes.
          </div>
        `;
        container.scrollTop = container.scrollHeight;
      }, 700);
    }
  }

  // --- Referral Share Helper ---
  copyReferralCode() {
    const code = this.store.state.currentUser.referralCode;
    navigator.clipboard.writeText(code);
    this.showToast(`Referral code ${code} copied to clipboard!`, 'success');
  }

  // ==========================================================================
  // MONTHLY SUBSCRIPTIONS ENGINE
  // ==========================================================================
  renderSubscriptionsTab() {
    const activeSubContainer = document.getElementById('activeSubBannerContainer');
    const plansGrid = document.getElementById('subscriptionsPlansGrid');
    if (!plansGrid) return;

    const sub = this.store.state.currentUser.activeSubscription;

    if (activeSubContainer) {
      if (sub && sub.status === 'Active') {
        activeSubContainer.innerHTML = `
          <div style="background: linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(15,23,42,0.95) 100%); border: 1px solid var(--primary-light); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div>
                <span class="spec-badge" style="background: rgba(16,185,129,0.2); color: #34d399;"><i class="fa-solid fa-circle-check"></i> ACTIVE MEMBERSHIP</span>
                <h3 style="font-size: 18px; color: #fff; margin-top: 4px;">${sub.name}</h3>
                <div style="font-size: 12px; color: var(--text-muted);">Renews on ${sub.renewDate} • ₹${sub.price}/month</div>
              </div>
              <button class="details-btn" style="color: var(--danger); border-color: rgba(239,68,68,0.3);" onclick="torqCustomer.cancelCurrentSubscription()">
                Pause / Cancel
              </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: rgba(0,0,0,0.4); padding: 12px; border-radius: var(--radius-sm); margin-top: 8px;">
              <div>
                <div style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Remaining Washes</div>
                <div style="font-size: 20px; font-weight: 800; color: #38bdf8; font-family: var(--font-display);">${sub.washesLeft} <span style="font-size: 12px; color: var(--text-muted);">/ ${sub.totalWashes}</span></div>
              </div>
              <div>
                <div style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Interior Spas</div>
                <div style="font-size: 20px; font-weight: 800; color: #34d399; font-family: var(--font-display);">${sub.deepSpasLeft} <span style="font-size: 12px; color: var(--text-muted);">Left</span></div>
              </div>
            </div>
          </div>
        `;
        activeSubContainer.style.display = 'block';
      } else {
        activeSubContainer.innerHTML = '';
        activeSubContainer.style.display = 'none';
      }
    }

    plansGrid.innerHTML = this.store.state.subscriptions.map(plan => {
      const isCurrent = sub && sub.planId === plan.id && sub.status === 'Active';
      return `
        <div class="service-card" style="padding: 18px; border: 1px solid ${isCurrent ? 'var(--primary-light)' : 'var(--border-subtle)'}; position: relative; margin-bottom: 16px;">
          ${plan.badge ? `<span class="service-badge-popular">${plan.badge}</span>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: ${plan.badge ? '10px' : '0'}; margin-bottom: 10px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff;">${plan.name}</h3>
              <span class="brand-tag" style="background: rgba(16,185,129,0.2); color: #34d399;">${plan.savings}</span>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 22px; font-weight: 800; color: var(--primary-light); font-family: var(--font-display);">₹${plan.price}</div>
              <div style="font-size: 10px; color: var(--text-dim); text-transform: uppercase;">Per Month</div>
            </div>
          </div>

          <div style="background: var(--bg-card-elevated); padding: 10px; border-radius: var(--radius-sm); margin-bottom: 14px; font-size: 12px; color: #cbd5e1;">
            <div><i class="fa-solid fa-soap" style="color: var(--primary-light);"></i> <strong>${plan.washes}</strong></div>
            <div style="margin-top: 4px;"><i class="fa-solid fa-wind" style="color: #34d399;"></i> <strong>${plan.deepSpas}</strong></div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
            ${plan.features.map(f => `
              <div style="font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-check" style="color: var(--primary-light); font-size: 11px;"></i> ${f}
              </div>
            `).join('')}
          </div>

          <button class="hero-cta-btn" style="width: 100%; justify-content: center;" onclick="torqCustomer.subscribePlan('${plan.id}')">
            ${isCurrent ? 'Active Plan ✓' : `Subscribe Now (₹${plan.price}/mo)`}
          </button>
        </div>
      `;
    }).join('');
  }

  subscribePlan(planId) {
    this.store.subscribeToPlan(planId);
    this.renderSubscriptionsTab();
    this.showToast('Subscription Activated! Enjoy scratch-free monthly washes.', 'success');
  }

  cancelCurrentSubscription() {
    if (confirm('Are you sure you want to pause/cancel your active monthly subscription?')) {
      this.store.cancelSubscription();
      this.renderSubscriptionsTab();
      this.showToast('Subscription cancelled.', 'info');
    }
  }

  // ==========================================================================
  // COMPLAINTS & ISSUES RESOLUTION DESK
  // ==========================================================================
  renderComplaintsTab() {
    const list = document.getElementById('complaintsListContainer');
    if (!list) return;

    const complaints = this.store.state.complaints || [];

    if (complaints.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-dim);">
          <i class="fa-solid fa-clipboard-check" style="font-size: 36px; margin-bottom: 8px; color: var(--success);"></i>
          <div style="font-weight: 700; color: #fff;">No complaints or active disputes</div>
          <div style="font-size: 11px;">All your doorstep washes have been completed smoothly.</div>
        </div>
      `;
      return;
    }

    list.innerHTML = complaints.map(c => `
      <div class="service-card" style="padding: 16px; margin-bottom: 12px; border: 1px solid var(--border-subtle);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <span class="status-pill ${c.status === 'Resolved' ? 'completed' : 'on-way'}">${c.status}</span>
            <span class="brand-tag" style="margin-left: 6px;">${c.category}</span>
            <div style="font-size: 15px; font-weight: 700; color: #fff; margin-top: 6px;">${c.subject}</div>
            <div style="font-size: 11px; color: var(--text-muted);">Ref: Order #${c.bookingId} • Filed on ${c.date}</div>
          </div>
          <span style="font-family: monospace; font-size: 11px; color: var(--text-dim);">${c.id}</span>
        </div>

        <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 10px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px;">
          "${c.description}"
        </p>

        <div style="font-size: 11px; color: #34d399; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); padding: 8px 10px; border-radius: 6px;">
          <i class="fa-solid fa-headset"></i> <strong>Support Resolution:</strong> ${c.resolution}
        </div>
      </div>
    `).join('');
  }

  openComplaintModal() {
    const modal = document.getElementById('complaintModal');
    if (modal) modal.classList.add('active');
  }

  closeComplaintModal() {
    const modal = document.getElementById('complaintModal');
    if (modal) modal.classList.remove('active');
  }

  submitComplaintForm() {
    const bookingId = document.getElementById('complaintBookingSelect').value;
    const category = document.getElementById('complaintCategorySelect').value;
    const subject = document.getElementById('complaintSubjectInput').value;
    const desc = document.getElementById('complaintDescInput').value;

    if (!subject || !desc) {
      this.showToast('Please enter both subject and description', 'danger');
      return;
    }

    const created = this.store.fileComplaint({ bookingId, category, subject, description: desc });
    this.closeComplaintModal();
    this.renderComplaintsTab();
    this.showToast(`Complaint #${created.id} submitted! Support supervisor notified.`, 'warning');
  }

  // ==========================================================================
  // CUSTOMER FEEDBACK & APP REVIEWS
  // ==========================================================================
  openFeedbackModal() {
    const modal = document.getElementById('generalFeedbackModal');
    if (modal) modal.classList.add('active');
  }

  closeFeedbackModal() {
    const modal = document.getElementById('generalFeedbackModal');
    if (modal) modal.classList.remove('active');
  }

  submitFeedbackForm() {
    const category = document.getElementById('feedbackCategorySelect').value;
    const comment = document.getElementById('feedbackCommentInput').value;

    if (!comment) {
      this.showToast('Please share your thoughts or suggestions', 'danger');
      return;
    }

    this.store.addFeedback({ rating: 5, category, comment });
    this.closeFeedbackModal();
    this.showToast('Thank you! ₹50 credits added to your wallet.', 'success');
  }

  // ==========================================================================
  // PROFILE & SETTINGS DESK
  // ==========================================================================
  openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    // Populate current profile data
    const user = this.store.state.currentUser || {};
    const nameInput = document.getElementById('settingNameInput');
    const phoneInput = document.getElementById('settingPhoneInput');
    const emailInput = document.getElementById('settingEmailInput');
    const cityInput = document.getElementById('settingCityInput');

    if (nameInput) nameInput.value = user.name || 'Alex Sharma';
    if (phoneInput) phoneInput.value = user.phone || '+91 98450 12345';
    if (emailInput) emailInput.value = user.email || 'alex.sharma@torqwash.in';
    if (cityInput) cityInput.value = user.savedAddresses?.[0]?.title || 'Indiranagar, Bangalore';

    // Sync Supabase inputs & status
    const sbUrlInput = document.getElementById('supabaseUrlInput');
    const sbKeyInput = document.getElementById('supabaseKeyInput');
    const sbBadge = document.getElementById('supabaseStatusBadge');
    const env = window.__ENV__ || {};

    if (sbUrlInput && env.SUPABASE_URL && env.SUPABASE_URL.indexOf('your-project-id') === -1) {
      sbUrlInput.value = env.SUPABASE_URL;
    }
    if (sbKeyInput && env.SUPABASE_ANON_KEY) {
      sbKeyInput.value = env.SUPABASE_ANON_KEY;
    }
    if (sbBadge) {
      if (window.supabaseClient) {
        sbBadge.className = 'status-pill completed';
        sbBadge.innerText = '🟢 Connected';
      } else {
        sbBadge.className = 'status-pill on-way';
        sbBadge.innerText = 'Awaiting URL';
      }
    }

    modal.classList.add('active');
  }

  closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
  }

  saveSettingsForm() {
    const nameInput = document.getElementById('settingNameInput');
    const phoneInput = document.getElementById('settingPhoneInput');
    const emailInput = document.getElementById('settingEmailInput');

    if (nameInput && this.store.state.currentUser) {
      this.store.state.currentUser.name = nameInput.value.trim() || this.store.state.currentUser.name;
      this.store.state.currentUser.phone = phoneInput ? phoneInput.value.trim() : this.store.state.currentUser.phone;
      this.store.state.currentUser.email = emailInput ? emailInput.value.trim() : this.store.state.currentUser.email;
      this.store.save();
    }

    this.closeSettingsModal();
    this.showToast('Profile & Settings saved successfully!', 'success');

    // Update profile display name if present
    const profileNameEl = document.querySelector('.spec-name');
    if (profileNameEl && this.store.state.currentUser) {
      profileNameEl.innerHTML = `${this.store.state.currentUser.name} <span class="spec-badge">VIP Member</span>`;
    }
  }

  toggleNotificationPref(type) {
    this.showToast(`${type} notification preference updated!`, 'info');
  }

  changeAppLanguage(lang) {
    this.showToast(`Language set to ${lang === 'ta' ? 'தமிழ் (Tamil)' : 'English'}!`, 'success');
  }

  // --- Toast notifications helper ---
  showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'danger' ? 'fa-circle-exclamation' : 'fa-bell'}"></i>
      <span>${msg}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Global instance
window.torqCustomer = new TorqCustomer(window.torqStore);
var torqCustomer = window.torqCustomer;
