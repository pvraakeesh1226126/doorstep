/* ==========================================================================
   TORQWASH PRO - Reactive State & Store Management
   Handles Customers, Garage, Services, Providers, Bookings & Invoices
   ========================================================================== */

class TorqStore {
  constructor() {
    this.STORAGE_KEY = 'torqwash_pro_v4';
    this.listeners = [];
    this.init();
  }

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        this.verifyAssets();
        return;
      } catch (e) {
        console.warn('Failed to parse local storage, resetting to default state', e);
      }
    }
    this.state = this.getDefaultState();
    this.save();
  }

  verifyAssets() {
    const defaults = this.getDefaultState();
    if (!this.state || typeof this.state !== 'object') {
      this.state = defaults;
      return;
    }
    // Ensure critical arrays and user exist
    if (!this.state.subscriptions || !Array.isArray(this.state.subscriptions) || this.state.subscriptions.length === 0) {
      this.state.subscriptions = defaults.subscriptions;
    }
    if (!this.state.complaints || !Array.isArray(this.state.complaints)) {
      this.state.complaints = defaults.complaints;
    }
    if (!this.state.feedbacks || !Array.isArray(this.state.feedbacks)) {
      this.state.feedbacks = defaults.feedbacks;
    }
    if (!this.state.vehicles || !Array.isArray(this.state.vehicles) || this.state.vehicles.length === 0) {
      this.state.vehicles = defaults.vehicles;
    }
    if (!this.state.currentUser) {
      this.state.currentUser = defaults.currentUser;
    } else if (!this.state.currentUser.activeSubscription) {
      this.state.currentUser.activeSubscription = defaults.currentUser.activeSubscription;
    }
    if (!this.state.services || !Array.isArray(this.state.services)) {
      this.state.services = defaults.services;
    } else {
      this.state.services.forEach(s => {
        if (!s.image) s.image = 'assets/images/tata_safari_foam.jpg';
      });
    }
    if (!this.state.bookings || !Array.isArray(this.state.bookings)) {
      this.state.bookings = defaults.bookings;
    }
    this.save();
  }

  getDefaultState() {
    return {
      currentUser: {
        id: 'usr_001',
        name: 'Alex Sharma',
        phone: '+91 98450 12345',
        email: 'alex.sharma@torqwash.in',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        referralCode: 'TORQ-ALEX-99',
        referralsCount: 4,
        rewardsBalance: 200,
        activeSubscription: {
          planId: 'sub_gold',
          name: 'Torq Gold Signature Pass',
          price: 1399,
          washesLeft: 3,
          totalWashes: 4,
          deepSpasLeft: 1,
          renewDate: 'Nov 05, 2026',
          status: 'Active'
        },
        currentLocation: {
          tag: 'Home',
          label: 'Indiranagar 100ft Road',
          address: '402, Prestige Zenith, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
          lat: 12.9716,
          lng: 77.6412,
          parkingNotes: 'Basement 2, Pillar B-18. Security gate pass code: 4902. RO water tap available nearby.'
        },
        savedAddresses: [
          { id: 'addr_1', tag: 'Home', title: 'Home Villa', address: '402, Prestige Zenith, 100 Feet Rd, Indiranagar, Bengaluru', lat: 12.9716, lng: 77.6412, notes: 'Basement 2, Pillar B-18' },
          { id: 'addr_2', tag: 'Work', title: 'Tech Hub Office', address: 'Torq Tower, Outer Ring Rd, Bellandur, Bengaluru', lat: 12.9260, lng: 77.6762, notes: 'Visitor parking slots 12-15' },
          { id: 'addr_3', tag: 'Other', title: 'Parents House', address: '24, 4th Cross, Koramangala 4th Block, Bengaluru', lat: 12.9345, lng: 77.6245, notes: 'Driveway porch' }
        ]
      },

      subscriptions: [
        {
          id: 'sub_silver',
          name: 'Torq Silver Pass',
          badge: 'Popular',
          price: 699,
          period: 'month',
          washes: '2 Exterior Foam Washes / Month',
          deepSpas: '0 Interior Spas',
          savings: 'Save 25%',
          features: [
            '2 Doorstep High-Gloss Snow Foam Washes',
            'Alloy wheel de-ironizer scrub & tire gloss',
            'Priority weekend slot booking',
            'Unused washes roll over to next month',
            'Self-powered van (Zero home power needed)'
          ]
        },
        {
          id: 'sub_gold',
          name: 'Torq Gold Signature',
          badge: 'Best Value',
          price: 1399,
          period: 'month',
          washes: '4 Exterior Foam Washes / Month',
          deepSpas: '1 Full Interior Steam Spa / Month',
          savings: 'Save 45%',
          features: [
            '4 Doorstep High-Gloss Snow Foam Washes (Weekly)',
            '1 Complete 140°C Interior Steam Spa & Sanitization',
            'Rain-X Windshield Hydrophobic Shield Included',
            'Complimentary Leather Condition & Odor Detox',
            'Dedicated Master Specialist assigned',
            'Cancel or pause anytime with 1 click'
          ]
        },
        {
          id: 'sub_platinum',
          name: 'Torq Platinum Club',
          badge: 'VIP Ultimate',
          price: 2799,
          period: 'month',
          washes: 'Unlimited Foam Washes / Month',
          deepSpas: '2 Dual Glow Spas + 1 Engine Bay Spa',
          savings: 'Save 60%',
          features: [
            'Unlimited Doorstep Eco Snow Foam Washes',
            '2 Complete Exterior + Interior Dual Signature Spas',
            '1 Engine Bay Steam Degrease & Dressing',
            'Free 3M Brazilian Carnauba Machine Buff',
            'Covers up to 2 vehicles in family garage',
            'Instant 2-hour priority express dispatch'
          ]
        }
      ],

      complaints: [
        {
          id: 'CMP-7712',
          userId: 'usr_001',
          bookingId: 'TQ-81042',
          category: 'Service Quality',
          subject: 'Water spots on panoramic sunroof',
          description: 'Noticed minor water droplet stains on the sunroof after drying.',
          status: 'Resolved',
          date: 'Oct 01, 2026',
          resolution: 'Specialist visited and buffed glass with hydrophobic polish at zero charge.'
        }
      ],

      feedbacks: [
        {
          id: 'FDB-301',
          userId: 'usr_001',
          rating: 5,
          category: 'Doorstep Convenience',
          comment: 'Super fast doorstep wash for my Thar. Zero hassle with apartment security. Water pressure was great.',
          date: 'Oct 03, 2026'
        }
      ],

      vehicles: [
        {
          id: 'veh_001',
          brand: 'Tata',
          model: 'Safari Dark Edition',
          variant: 'Accomplished+ 6S AT',
          category: 'Luxury',
          regNumber: 'KA-01-SF-9920',
          color: 'Oberon Black',
          year: 2024,
          isDefault: true,
          icon: 'fa-truck-monster',
          photo: 'assets/images/tata_safari_foam.jpg'
        },
        {
          id: 'veh_002',
          brand: 'Mahindra',
          model: 'Thar 4x4',
          variant: 'LX Hard Top Diesel AT',
          category: 'SUV',
          regNumber: 'KA-05-TH-4499',
          color: 'Red Rage',
          year: 2024,
          isDefault: false,
          icon: 'fa-truck-monster',
          photo: 'assets/images/mahindra_thar.jpg'
        },
        {
          id: 'veh_003',
          brand: 'Tata',
          model: 'Nexon EV',
          variant: 'Empowered Plus',
          category: 'SUV',
          regNumber: 'KA-03-EV-8821',
          color: 'Intense Teal',
          year: 2024,
          isDefault: false,
          icon: 'fa-truck-monster',
          photo: 'assets/images/tata_nexon.jpg'
        },
        {
          id: 'veh_004',
          brand: 'Mahindra',
          model: 'XUV700',
          variant: 'AX7 Luxury Pack AWD',
          category: 'SUV',
          regNumber: 'KA-04-XU-7700',
          color: 'Midnight Black',
          year: 2024,
          isDefault: false,
          icon: 'fa-truck-monster',
          photo: 'assets/images/mahindra_xuv700.png'
        },
        {
          id: 'veh_005',
          brand: 'Hyundai',
          model: 'Creta 2024',
          variant: 'SX(O) Turbo DCT',
          category: 'SUV',
          regNumber: 'KA-02-CR-1122',
          color: 'Ranger Khaki',
          year: 2024,
          isDefault: false,
          icon: 'fa-car-side',
          photo: 'assets/images/hyundai_creta.png'
        }
      ],

      categoryMultipliers: {
        'Hatchback': 1.0,
        'Sedan': 1.15,
        'SUV': 1.30,
        'Luxury': 1.55,
        'MPV': 1.40
      },

      services: [
        {
          id: 'srv_1',
          name: 'Express Exterior Eco Wash',
          categoryTag: 'Wash',
          popular: false,
          basePrice: 399,
          duration: '35 Mins',
          image: 'assets/images/tata_nexon.jpg',
          rating: 4.85,
          reviewsCount: 1240,
          description: 'Quick scratch-free high pressure exterior wash using pH-neutral polymers, microfiber towel dry, tire dressing and glass streak-free polish.',
          inclusions: [
            'High pressure touchless pre-rinse',
            'pH neutral snow foam application',
            'Two-bucket scratch-safe hand wash',
            'Wheel faces & tire scrub & satin dress',
            'Exterior glass & mirror streak-free dry',
            'Door jambs quick wipedown'
          ]
        },
        {
          id: 'srv_2',
          name: 'Torq Hydro Foam & Wheel Detailing',
          categoryTag: 'Wash',
          popular: true,
          basePrice: 599,
          duration: '50 Mins',
          image: 'assets/images/tata_safari_foam.jpg',
          rating: 4.96,
          reviewsCount: 2890,
          description: 'Our signature thick snow foam cannon wash with brake dust fallout removal, tire gloss conditioning, and hydrophobic spray sealant for lasting showroom shine.',
          inclusions: [
            'Heavy dense snow foam cannon blast',
            'Iron fallout wheel de-ironizer wash',
            'Wheel wells & barrel deep agitation',
            'Plush microfiber 1200 GSM towel dry',
            'Hydrophobic ceramic spray gloss sealant',
            'Tire dressing with UV barrier protection',
            'All glass crystal-clear polish'
          ]
        },
        {
          id: 'srv_3',
          name: 'Interior Steam Spa & Sanitization',
          categoryTag: 'Interior',
          popular: false,
          basePrice: 899,
          duration: '75 Mins',
          image: 'assets/images/interior_detailing.jpg',
          rating: 4.91,
          reviewsCount: 1640,
          description: 'Deep therapeutic cabin detox. 140°C pressurized dry steam sanitization kills 99.9% bacteria, deep HEPA vacuum, leather conditioning and AC duct flush.',
          inclusions: [
            'Complete cabin dry HEPA deep vacuuming',
            'Seat fabric / leather extraction steam clean',
            'Dashboard, console & door card scrub & UV matte dress',
            '140°C thermal steam vent disinfection',
            'Odor neutralizer & pleasant luxury fragrance',
            'Trunk carpet deep vacuum & wipe',
            'Internal glass smear-free crystal polish'
          ]
        },
        {
          id: 'srv_4',
          name: 'Exterior Glow + Interior Dual Spa',
          categoryTag: 'Combo',
          popular: true,
          basePrice: 1199,
          duration: '90 Mins',
          image: 'assets/images/mahindra_xuv700.png',
          rating: 4.97,
          reviewsCount: 3410,
          description: 'The ultimate 360° doorstep transformation. Full foam wash, wheel detailing, paint spray sealant combined with deep interior steam spa.',
          inclusions: [
            'All inclusions from Torq Hydro Foam wash',
            'All inclusions from Interior Steam Spa',
            'Clay mitt light surface decontamination',
            'Foot pedals & mat high-pressure wash',
            'Hydrophobic windshield water repellent',
            'Leather conditioner with matte non-greasy feel'
          ]
        },
        {
          id: 'srv_5',
          name: '3M Machine Polish & Carnauba Wax',
          categoryTag: 'Detailing',
          popular: false,
          basePrice: 1499,
          duration: '120 Mins',
          image: 'assets/images/mahindra_thar.jpg',
          rating: 4.94,
          reviewsCount: 980,
          description: 'Single-stage dual action machine buffing eliminates micro-swirls and light oxidation, topped with Brazilian Carnauba wax for deep wet-look reflections.',
          inclusions: [
            'Decontamination chemical & clay treatment',
            'Dual action machine swirl-reducing buff',
            '3M Premium compound gloss enhancement',
            'Hand-buffed Brazilian Carnauba wax coat',
            'Trim restoration with hydrophobic dressing',
            'Wheel rim polymer sealant coating'
          ]
        },
        {
          id: 'srv_6',
          name: '9H Nano-Ceramic Shield Coat',
          categoryTag: 'Detailing',
          popular: false,
          basePrice: 4999,
          duration: '180 Mins',
          image: 'assets/images/ceramic_coating.jpg',
          rating: 4.99,
          reviewsCount: 520,
          description: 'True ultra-hard 9H ceramic quartz crystal coating applied right at your doorstep. Provides extreme hydrophobic water-beading and 2-year warranty.',
          inclusions: [
            'Two-stage paint correction & swirl removal',
            'IPA surface prep to remove all oils',
            'Multi-layer 9H ceramic coating on all painted panels',
            'Ceramic wheel face protective barrier',
            'Windshield ceramic hydrophobic treatment',
            'Includes 2-year warranty card & maintenance kit'
          ]
        },
        {
          id: 'srv_7',
          name: 'Engine Bay Eco-Steam & Degrease',
          categoryTag: 'Specialty',
          popular: false,
          basePrice: 499,
          duration: '40 Mins',
          image: 'assets/images/before_after.jpg',
          rating: 4.88,
          reviewsCount: 740,
          description: 'Safely removes accumulated grease, grime and road dust using low-moisture steam and electronic component protection, dressed with OEM satin sheen.',
          inclusions: [
            'Battery & alternator sensor moisture wrap',
            'Biodegradable citrus degreaser soak',
            'Controlled dry vapor steam agitation',
            'Hot air blow dry of all wiring & crevices',
            'Non-silicone anti-static hose & plastic dressing'
          ]
        },
        {
          id: 'srv_8',
          name: 'AC Evaporator Foam & Ozone Detox',
          categoryTag: 'Specialty',
          popular: false,
          basePrice: 349,
          duration: '30 Mins',
          image: 'assets/images/hyundai_creta.png',
          rating: 4.87,
          reviewsCount: 1110,
          description: 'Eliminates musty mildew smells and allergens from AC duct coils with antibacterial expanding foam and medical-grade active ozone treatment.',
          inclusions: [
            'Cabin AC filter dust blow & check',
            'Direct evaporator coil expanding disinfectant foam',
            'Ozone O3 generator shock treatment in closed cabin',
            'Eliminates mold spores, smoke and pet odors'
          ]
        }
      ],

      addons: [
        { id: 'add_1', name: 'Rain-X Windshield Hydrophobic Shield', price: 199, desc: 'Water sheets off cleanly at 45+ km/h without wipers' },
        { id: 'add_2', name: 'Alloy Wheel Iron Fallout Decon', price: 249, desc: 'Dissolves stubborn baked-on brake dust from German wheels' },
        { id: 'add_3', name: 'Nappa Leather Deep Nourish Balm', price: 299, desc: 'Prevents cracking and keeps leather soft and supple' },
        { id: 'add_4', name: 'Pet Hair & Embedded Fiber Extraction', price: 199, desc: 'Deep mechanical bristle rake for pet lovers' },
        { id: 'add_5', name: 'Headlight UV Polish & Anti-Yellowing', price: 349, desc: 'Restores cloudy yellow headlights to crystal clear clarity' }
      ],

      coupons: [
        { code: 'FIRSTWASH', discountType: 'flat', value: 150, minOrder: 399, desc: '₹150 Flat Off on your 1st doorstep booking' },
        { code: 'SPARKLE50', discountType: 'percent', value: 50, maxDiscount: 250, minOrder: 499, desc: '50% Off up to ₹250 on premium washes' },
        { code: 'CERAMIC500', discountType: 'flat', value: 500, minOrder: 2500, desc: '₹500 Off on Machine Polish & 9H Ceramic Coating' },
        { code: 'TORQVIP', discountType: 'percent', value: 20, maxDiscount: 350, minOrder: 799, desc: '20% Off for Club Members' },
        { code: 'FESTIVE200', discountType: 'flat', value: 200, minOrder: 999, desc: 'Festival Special ₹200 Off on Dual Combo Spa' }
      ],

      specialists: [
        {
          id: 'spec_01',
          name: 'Mark Jenkins',
          title: 'Master Detailing Specialist',
          avatar: 'assets/images/technician_mark.jpg',
          phone: '+91 99120 44331',
          rating: 4.96,
          totalJobs: 342,
          vanReg: 'KA-05-MD-1192',
          badge: 'Torq Certified Master',
          status: 'online',
          lat: 12.9680,
          lng: 77.6350
        },
        {
          id: 'spec_02',
          name: 'Rajesh Kumar',
          title: 'Senior Detailing Tech',
          avatar: 'assets/images/technician_mark.jpg',
          phone: '+91 98840 77123',
          rating: 4.89,
          totalJobs: 218,
          vanReg: 'KA-01-WQ-8819',
          badge: 'Ceramic Expert',
          status: 'online',
          lat: 12.9340,
          lng: 77.6180
        }
      ],

      bookings: [
        {
          id: 'TQ-84920',
          userId: 'usr_001',
          status: 'on_the_way', // confirmed, assigned, on_the_way, arrived, in_progress, completed, cancelled
          vehicle: {
            brand: 'Tata',
            model: 'Safari Dark Edition',
            category: 'Luxury',
            regNumber: 'KA-01-SF-9920'
          },
          service: {
            id: 'srv_2',
            name: 'Torq Hydro Foam & Wheel Detailing',
            basePrice: 599,
            finalPrice: 928 // 599 * 1.55 = 928
          },
          addons: [
            { id: 'add_1', name: 'Rain-X Windshield Hydrophobic Shield', price: 199 }
          ],
          dateTime: {
            date: 'Today, Oct 5',
            timeSlot: '04:30 PM - 05:30 PM'
          },
          location: {
            tag: 'Home',
            title: 'Home Villa',
            address: '402, Prestige Zenith, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, 560038',
            lat: 12.9716,
            lng: 77.6412,
            notes: 'Basement 2, Pillar B-18. Security gate passcode 4902.'
          },
          pricing: {
            servicePrice: 928,
            addonsPrice: 199,
            couponDiscount: 150,
            couponCode: 'FIRSTWASH',
            cgst: 88,
            sgst: 88,
            totalAmount: 1053,
            paymentMethod: 'UPI (Google Pay)',
            paymentStatus: 'PAID'
          },
          specialist: {
            id: 'spec_01',
            name: 'Mark Jenkins',
            title: 'Master Detailing Specialist',
            avatar: 'assets/images/technician_mark.jpg',
            phone: '+91 99120 44331',
            rating: 4.96,
            vanReg: 'KA-05-MD-1192',
            currentLat: 12.9660,
            currentLng: 77.6360,
            etaMins: 12
          },
          timeline: [
            { step: 'confirmed', title: 'Booking Confirmed', time: '15:20', done: true, desc: 'Service slot locked with high-pressure eco van' },
            { step: 'assigned', title: 'Professional Assigned', time: '15:22', done: true, desc: 'Master specialist Mark Jenkins assigned' },
            { step: 'on_the_way', title: 'Specialist On The Way', time: '15:35', done: true, desc: 'Mobile detailing van en route (ETA 12 mins)' },
            { step: 'arrived', title: 'Arrived at Doorstep', time: '--', done: false, desc: 'Vehicle pre-inspection & parking setup' },
            { step: 'in_progress', title: 'Detailing In Progress', time: '--', done: false, desc: 'Foam wash, deep scrub & drying stages' },
            { step: 'completed', title: 'Service Completed', time: '--', done: false, desc: 'Final inspection & digital signoff' }
          ],
          invoiceNumber: 'INV-2026-TQ84920',
          createdTimestamp: Date.now() - 3600000,
          beforeAfterPhotos: {
            before: 'assets/images/before_after.jpg',
            after: 'assets/images/foam_wash.jpg'
          }
        },
        {
          id: 'TQ-81042',
          userId: 'usr_001',
          status: 'completed',
          vehicle: {
            brand: 'Tata',
            model: 'Nexon EV',
            category: 'SUV',
            regNumber: 'KA-03-EV-8821'
          },
          service: {
            id: 'srv_4',
            name: 'Exterior Glow + Interior Dual Spa',
            basePrice: 1199,
            finalPrice: 1558
          },
          addons: [],
          dateTime: {
            date: 'Sep 28, 2026',
            timeSlot: '11:00 AM - 12:30 PM'
          },
          location: {
            tag: 'Work',
            title: 'Tech Hub Office',
            address: 'Torq Tower, Outer Ring Rd, Bellandur, Bengaluru',
            lat: 12.9260,
            lng: 77.6762,
            notes: 'Visitor parking slots 12-15'
          },
          pricing: {
            servicePrice: 1558,
            addonsPrice: 0,
            couponDiscount: 200,
            couponCode: 'FESTIVE200',
            cgst: 122,
            sgst: 122,
            totalAmount: 1602,
            paymentMethod: 'Credit Card (Visa •••• 4242)',
            paymentStatus: 'PAID'
          },
          specialist: {
            id: 'spec_01',
            name: 'Mark Jenkins',
            title: 'Master Detailing Specialist',
            avatar: 'assets/images/technician_mark.jpg',
            phone: '+91 99120 44331',
            rating: 5.0,
            vanReg: 'KA-05-MD-1192'
          },
          timeline: [
            { step: 'confirmed', title: 'Confirmed', time: '10:45', done: true },
            { step: 'completed', title: 'Completed', time: '12:35', done: true }
          ],
          review: {
            stars: 5,
            comment: 'Mark was so punctual and polite! Car looks factory fresh. The steam smell is amazing.',
            date: 'Sep 28, 2026'
          },
          invoiceNumber: 'INV-2026-TQ81042',
          createdTimestamp: Date.now() - 604800000
        }
      ],

      notifications: [
        { id: 'notif_1', title: 'Specialist On The Way!', body: 'Mark Jenkins is 12 mins away in mobile detailing van #KA-05-MD-1192.', time: '5m ago', read: false, type: 'status' },
        { id: 'notif_2', title: 'Booking Confirmed #TQ-84920', body: 'Your Hydro Foam wash for BMW 330i is locked for Today.', time: '45m ago', read: false, type: 'booking' },
        { id: 'notif_3', title: 'Weekend Flash Offer ⚡️', body: 'Use code FESTIVE200 for ₹200 off on any Dual Signature Spa!', time: '3h ago', read: true, type: 'promo' },
        { id: 'notif_4', title: 'Referral Bonus Earned! 🎉', body: 'Rohan signed up with your code. ₹100 credited to wallet.', time: '1d ago', read: true, type: 'wallet' }
      ],

      supportTickets: [
        { id: 'TCK-1092', user: 'Alex Sharma', subject: 'Water supply confirmation', status: 'Resolved', date: 'Oct 04, 2026', response: 'Our mobile van carries self-sufficient 250L softened water and silence generators.' },
        { id: 'TCK-1088', user: 'Sunita Reddy', subject: 'Add ceramic coating top-up', status: 'In Review', date: 'Oct 05, 2026', response: 'Specialist notified for inspection.' }
      ],

      providerEarnings: {
        today: 2850,
        thisWeek: 16420,
        pendingPayout: 8200,
        completedJobsToday: 3,
        rating: 4.96,
        acceptanceRate: '98.5%'
      }
    };
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Listener error in store:', err);
      }
    });
  }

  // --- Vehicle Management ---
  getDefaultVehicle() {
    return this.state.vehicles.find(v => v.isDefault) || this.state.vehicles[0];
  }

  setDefaultVehicle(vehicleId) {
    this.state.vehicles.forEach(v => {
      v.isDefault = (v.id === vehicleId);
    });
    this.save();
  }

  addVehicle(vehicleData) {
    const newVeh = {
      id: 'veh_' + Date.now().toString().slice(-4),
      brand: vehicleData.brand,
      model: vehicleData.model,
      variant: vehicleData.variant || 'Standard',
      category: vehicleData.category || 'Sedan',
      regNumber: vehicleData.regNumber.toUpperCase(),
      color: vehicleData.color || 'Alpine White',
      year: parseInt(vehicleData.year, 10) || 2024,
      isDefault: this.state.vehicles.length === 0,
      icon: vehicleData.category === 'SUV' ? 'fa-truck-monster' : 'fa-car'
    };
    this.state.vehicles.push(newVeh);
    this.save();
    return newVeh;
  }

  removeVehicle(vehicleId) {
    this.state.vehicles = this.state.vehicles.filter(v => v.id !== vehicleId);
    if (this.state.vehicles.length > 0 && !this.state.vehicles.some(v => v.isDefault)) {
      this.state.vehicles[0].isDefault = true;
    }
    this.save();
  }

  // --- Pricing Calculation Engine ---
  getCalculatedPrice(service, category = 'Sedan') {
    const multiplier = this.state.categoryMultipliers[category] || 1.15;
    return Math.round(service.basePrice * multiplier);
  }

  // --- Coupon Logic ---
  validateCoupon(code, subtotal) {
    const cleanCode = (code || '').trim().toUpperCase();
    const coupon = this.state.coupons.find(c => c.code === cleanCode);
    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code. Try FIRSTWASH or SPARKLE50.' };
    }
    if (subtotal < coupon.minOrder) {
      return { valid: false, error: `Minimum order of ₹${coupon.minOrder} required for this code.` };
    }

    let discount = 0;
    if (coupon.discountType === 'flat') {
      discount = coupon.value;
    } else if (coupon.discountType === 'percent') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    return {
      valid: true,
      coupon,
      discount: Math.min(discount, subtotal)
    };
  }

  // --- Booking Creation & Dispatch ---
  createBooking(bookingData) {
    const id = 'TQ-' + Math.floor(10000 + Math.random() * 90000);
    const invNum = 'INV-2026-' + id;
    
    // Assign provider
    const specialist = this.state.specialists[0];

    const newBooking = {
      id,
      userId: this.state.currentUser.id,
      status: 'confirmed',
      vehicle: bookingData.vehicle,
      service: bookingData.service,
      addons: bookingData.addons || [],
      dateTime: bookingData.dateTime,
      location: bookingData.location,
      pricing: bookingData.pricing,
      specialist: {
        id: specialist.id,
        name: specialist.name,
        title: specialist.title,
        avatar: specialist.avatar,
        phone: specialist.phone,
        rating: specialist.rating,
        vanReg: specialist.vanReg,
        currentLat: specialist.lat,
        currentLng: specialist.lng,
        etaMins: 25
      },
      timeline: [
        { step: 'confirmed', title: 'Booking Confirmed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true, desc: 'Doorstep appointment confirmed' },
        { step: 'assigned', title: 'Specialist Assigned', time: '--', done: false, desc: 'Detailing specialist preparing gear' },
        { step: 'on_the_way', title: 'Specialist On The Way', time: '--', done: false, desc: 'Mobile wash van en route' },
        { step: 'arrived', title: 'Arrived at Location', time: '--', done: false, desc: 'Inspection & vehicle wash setup' },
        { step: 'in_progress', title: 'Detailing Started', time: '--', done: false, desc: 'High pressure foam, scrub & deep clean' },
        { step: 'completed', title: 'Service Completed', time: '--', done: false, desc: 'Final inspection & signoff' }
      ],
      invoiceNumber: invNum,
      createdTimestamp: Date.now(),
      beforeAfterPhotos: {
        before: 'assets/images/before_after.jpg',
        after: 'assets/images/foam_wash.jpg'
      }
    };

    this.state.bookings.unshift(newBooking);

    // Push notification
    this.addNotification({
      title: `Booking Confirmed #${id}`,
      body: `Your ${newBooking.service.name} for ${newBooking.vehicle.brand} ${newBooking.vehicle.model} is scheduled!`,
      type: 'booking'
    });

    this.save();
    return newBooking;
  }

  // --- Real-Time Status Updates (Synchronized across Customer, Provider & Admin) ---
  updateBookingStatus(bookingId, newStatus, extraData = {}) {
    const booking = this.state.bookings.find(b => b.id === bookingId);
    if (!booking) return false;

    booking.status = newStatus;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update timeline steps
    const stepOrder = ['confirmed', 'assigned', 'on_the_way', 'arrived', 'in_progress', 'completed'];
    const targetIdx = stepOrder.indexOf(newStatus);

    booking.timeline.forEach(step => {
      const idx = stepOrder.indexOf(step.step);
      if (idx <= targetIdx) {
        step.done = true;
        if (step.time === '--') step.time = nowTime;
      }
    });

    if (newStatus === 'on_the_way' && booking.specialist) {
      booking.specialist.etaMins = extraData.eta || 14;
    }

    if (newStatus === 'completed') {
      booking.completedAt = Date.now();
      if (extraData.beforePhoto) booking.beforeAfterPhotos.before = extraData.beforePhoto;
      if (extraData.afterPhoto) booking.beforeAfterPhotos.after = extraData.afterPhoto;
      
      // Credit earnings
      this.state.providerEarnings.today += booking.pricing.totalAmount;
      this.state.providerEarnings.completedJobsToday += 1;
    }

    // Add status notification
    const statusTitles = {
      'assigned': 'Professional Assigned 👨‍🔧',
      'on_the_way': 'Specialist is On The Way! 🚐',
      'arrived': 'Specialist Has Arrived! 📍',
      'in_progress': 'Car Wash & Detailing Started 🧼',
      'completed': 'Service Completed! ✨',
      'cancelled': 'Booking Cancelled ❌'
    };

    if (statusTitles[newStatus]) {
      this.addNotification({
        title: statusTitles[newStatus],
        body: `Order #${booking.id} (${booking.vehicle.brand} ${booking.vehicle.model}) status is now ${newStatus.replace(/_/g, ' ')}.`,
        type: 'status'
      });
    }

    this.save();
    return booking;
  }

  // --- Reviews & Ratings ---
  submitReview(bookingId, rating, comment) {
    const booking = this.state.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.review = {
        stars: rating,
        comment,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      this.save();
      return true;
    }
    return false;
  }

  // --- Notifications ---
  addNotification(notif) {
    this.state.notifications.unshift({
      id: 'notif_' + Date.now(),
      title: notif.title,
      body: notif.body,
      time: 'Just now',
      read: false,
      type: notif.type || 'info'
    });
    this.save();
  }

  markAllNotificationsRead() {
    this.state.notifications.forEach(n => n.read = true);
    this.save();
  }

  // --- Saved Addresses ---
  addAddress(addressObj) {
    const newAddr = {
      id: 'addr_' + Date.now(),
      tag: addressObj.tag || 'Home',
      title: addressObj.title || 'Saved Location',
      address: addressObj.address,
      lat: addressObj.lat || 12.9716,
      lng: addressObj.lng || 77.6412,
      notes: addressObj.notes || ''
    };
    this.state.currentUser.savedAddresses.push(newAddr);
    this.save();
    return newAddr;
  }

  // --- Subscriptions ---
  subscribeToPlan(planId) {
    const plan = this.state.subscriptions.find(s => s.id === planId);
    if (!plan) return false;

    const renewDate = new Date();
    renewDate.setDate(renewDate.getDate() + 30);
    const renewStr = renewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const totalWashes = plan.id === 'sub_silver' ? 2 : plan.id === 'sub_gold' ? 4 : 999;
    const deepSpas = plan.id === 'sub_silver' ? 0 : plan.id === 'sub_gold' ? 1 : 2;

    this.state.currentUser.activeSubscription = {
      planId: plan.id,
      name: plan.name,
      price: plan.price,
      washesLeft: totalWashes,
      totalWashes: totalWashes,
      deepSpasLeft: deepSpas,
      renewDate: renewStr,
      status: 'Active'
    };

    this.addNotification({
      title: `Subscribed to ${plan.name}! 🌟`,
      body: `Your monthly doorstep wash membership is active with ${plan.washes}.`,
      type: 'booking'
    });

    this.save();
    return true;
  }

  cancelSubscription() {
    if (this.state.currentUser.activeSubscription) {
      const name = this.state.currentUser.activeSubscription.name;
      this.state.currentUser.activeSubscription.status = 'Cancelled';
      this.addNotification({
        title: 'Subscription Cancelled',
        body: `Your ${name} has been paused/cancelled. Benefits remain active until billing end.`,
        type: 'info'
      });
      this.save();
      return true;
    }
    return false;
  }

  // --- Complaints ---
  fileComplaint(data) {
    const newComplaint = {
      id: 'CMP-' + Math.floor(1000 + Math.random() * 9000),
      userId: this.state.currentUser.id,
      bookingId: data.bookingId || 'TQ-84920',
      category: data.category || 'Service Quality',
      subject: data.subject || 'Doorstep Wash Issue',
      description: data.description || '',
      status: 'In Investigation',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      resolution: 'Our operations manager has been assigned. You will receive an update in 2 hours.'
    };

    if (!this.state.complaints) this.state.complaints = [];
    this.state.complaints.unshift(newComplaint);

    this.addNotification({
      title: `Complaint #${newComplaint.id} Registered`,
      body: `Ticket received for ${newComplaint.subject}. Specialist and lead supervisor notified.`,
      type: 'warning'
    });

    this.save();
    return newComplaint;
  }

  // --- Feedback ---
  addFeedback(data) {
    const newFdb = {
      id: 'FDB-' + Math.floor(100 + Math.random() * 900),
      userId: this.state.currentUser.id,
      rating: data.rating || 5,
      category: data.category || 'General',
      comment: data.comment || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    if (!this.state.feedbacks) this.state.feedbacks = [];
    this.state.feedbacks.unshift(newFdb);

    // Reward customer with ₹50 credit
    this.state.currentUser.rewardsBalance = (this.state.currentUser.rewardsBalance || 0) + 50;

    this.addNotification({
      title: 'Feedback Received! 🎉',
      body: 'Thank you for your valuable feedback. ₹50 credits added to your TorqWash wallet!',
      type: 'wallet'
    });

    this.save();
    return newFdb;
  }
}

// Global instance
window.torqStore = new TorqStore();
var torqStore = window.torqStore;
