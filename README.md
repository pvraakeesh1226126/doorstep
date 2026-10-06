# TorqWash Pro 🚗✨
### Modern Doorstep Car Wash & Detailing Mobile & Web Platform

**TorqWash Pro** is an on-demand, automotive doorstep detailing platform designed for luxury and standard vehicles. It connects car owners with certified mobile detailing specialists equipped with self-powered vans (onboard RO water, silent power generators, and scratch-safe foam cannons).

---

## 🌟 Key Highlights & Features

### 1. Dual Device Experience
- **Mobile App Mode**: iPhone frame emulation with status bar (WiFi, Signal, Battery), camera notch / dynamic island, and responsive bottom bar.
- **Desktop Web Mode**: Fluid responsive full-screen dashboard suitable for monitors, tablets, and wide screens.

### 2. Multi-Role Ecosystem
- **Customer App**:
  - **Garage Management**: Multi-car garage (BMW 330i M Sport, Tata Nexon EV, Hyundai i20 N Line) with vehicle category pricing (Hatchback, Sedan, SUV, Luxury, MPV).
  - **Interactive Before & After Slider**: Real-time slider comparing heavily mud-soiled side panels to deep gloss ceramic reflection.
  - **8-Step Booking Process**:
    1. Select vehicle (from garage or quick add)
    2. Choose service & multi-select add-on treatments
    3. Date & Time slot picker with remaining capacity indicators
    4. Location selector with GPS geolocation, Leaflet map with draggable pin, and parking instructions (e.g. basement, pillar #, security gate code)
    5. Booking summary review & itemized cost breakdown
    6. Coupon engine with validation (`FIRSTWASH`, `SPARKLE50`, `CERAMIC500`, `FESTIVE200`)
    7. Payment simulation (UPI QR Code, Credit/Debit Cards, Cash/Card on completion)
    8. Instant booking confirmation with digital invoice link & live tracker CTA
  - **Live GPS Specialist Tracking**:
    - Leaflet map displaying customer's doorstep pin and specialist van's moving GPS location.
    - Live countdown ETA.
    - Specialist profile card (Mark Jenkins, Certified Specialist, 4.9★, 340+ washes).
    - Canned quick chat ("In basement 2", "Keys with security") and phone call actions.
    - Interactive Stage Progression: *Confirmed → Specialist Assigned → On The Way → Arrived at Gate → Detailing In Progress → Completed*.
    - Simulation controller to manually or automatically advance stages for live demonstration.
  - **Digital GST Tax Invoice**:
    - Itemized breakdown with SAC code (998714), CGST (9%), SGST (9%), discounts, and printable layout.
  - **Referral System**:
    - Unique referral code (`TORQ-ALEX-99`) with copyable link and ₹100 credit rewards ladder.
  - **Customer Reviews**:
    - 5-star rating submission with feedback and tags.

- **Service Provider Partner Panel ("TorqPro")**:
  - Specialist online/offline toggle switch.
  - Today's earnings counter (₹2,850), weekly summary, and completed job counts.
  - Incoming job radar with distance, payout estimation, and Accept/Decline countdown.
  - Active job execution workflow: Navigate to customer, advance status, before/after photo proof upload.

- **Admin Command Center ("TorqHQ")**:
  - Executive KPIs: Gross Revenue, Completed Bookings, Active Dispatches, Fleet size.
  - Live bookings table with cancel/refund capabilities.
  - Dynamic service pricing engine to adjust base rates per package.
  - Provider directory & background audit badges.
  - Coupon management (create new promo codes).
  - Customer support ticketing desk.
  - System-wide push notification broadcast engine.

---

## 🎨 Automotive Design System
- **Palette**: Midnight Obsidian (`#050811`), Slate Navy (`#0A101D`, `#0F172A`), Electric Sapphire (`#2563EB`), Cyan Glow (`#38BDF8`), Emerald (`#10B981`), Amber (`#F59E0B`).
- **Typography**: Google Fonts `Inter` (UI elements) and `Outfit` (automotive headers).
- **Icons**: FontAwesome 6 Pro CDN.
- **Maps**: Leaflet.js with CartoDB high-contrast cartography.

---

## 🚀 How to Run Locally

The application runs entirely client-side with a local HTTP server:

```bash
# Using Ruby (built-in on macOS):
ruby -run -e httpd . -p 8000
```

Then visit:
```
http://localhost:8000
```
