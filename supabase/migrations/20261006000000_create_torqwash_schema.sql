-- ==============================================================================
-- TORQWASH PRO - SUPABASE PRODUCTION DATABASE SCHEMA MIGRATION
-- Migration: 20261006000000_create_torqwash_schema.sql
-- Description: Creates all 17 approved tables, relationships, constraints,
--              indexes, and seeds essential pricing/service catalogs.
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE (Users / Customers / Providers / Admins)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT 'Customer',
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'provider', 'admin')),
    referral_code TEXT UNIQUE NOT NULL,
    referrals_count INTEGER NOT NULL DEFAULT 0,
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    language_pref TEXT NOT NULL DEFAULT 'en' CHECK (language_pref IN ('en', 'ta')),
    whatsapp_notifications BOOLEAN NOT NULL DEFAULT true,
    sms_notifications BOOLEAN NOT NULL DEFAULT true,
    promo_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. VEHICLES TABLE (Customer Garage)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    variant TEXT DEFAULT 'Standard',
    category TEXT NOT NULL CHECK (category IN ('Hatchback', 'Sedan', 'SUV', 'Luxury', 'MPV')),
    reg_number TEXT NOT NULL,
    color TEXT DEFAULT 'White',
    year INTEGER DEFAULT 2024,
    is_default BOOLEAN NOT NULL DEFAULT false,
    icon TEXT DEFAULT 'fa-car',
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. ADDRESSES TABLE (Doorstep Saved Locations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag TEXT NOT NULL DEFAULT 'Home' CHECK (tag IN ('Home', 'Work', 'Other')),
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL DEFAULT 12.9716,
    longitude NUMERIC(10, 7) NOT NULL DEFAULT 77.6412,
    parking_notes TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. CATEGORY MULTIPLIERS (Vehicle Size Pricing Matrix)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.category_multipliers (
    category TEXT PRIMARY KEY CHECK (category IN ('Hatchback', 'Sedan', 'SUV', 'Luxury', 'MPV')),
    multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00
);

-- ==============================================================================
-- 5. SERVICES TABLE (Wash & Detailing Service Catalog)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_tag TEXT NOT NULL CHECK (category_tag IN ('Wash', 'Interior', 'Combo', 'Detailing', 'Specialty')),
    base_price NUMERIC(10, 2) NOT NULL,
    duration TEXT NOT NULL,
    image_url TEXT NOT NULL,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    popular BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. ADDONS TABLE (Optional Detailing Add-ons)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.addons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- ==============================================================================
-- 7. SUBSCRIPTION PLANS TABLE (Monthly Wash Packages)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    badge TEXT,
    price NUMERIC(10, 2) NOT NULL,
    period TEXT NOT NULL DEFAULT 'month',
    washes_quota INTEGER NOT NULL,
    spas_quota INTEGER NOT NULL DEFAULT 0,
    savings_label TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- ==============================================================================
-- 8. USER SUBSCRIPTIONS TABLE (Active Customer Memberships)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Cancelled', 'Expired')),
    washes_left INTEGER NOT NULL,
    total_washes INTEGER NOT NULL,
    deep_spas_left INTEGER NOT NULL DEFAULT 0,
    renews_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 9. SPECIALISTS TABLE (Detailing Technicians & Van Fleet)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.specialists (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Master Specialist',
    avatar_url TEXT,
    phone TEXT NOT NULL,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_jobs INTEGER NOT NULL DEFAULT 0,
    van_reg TEXT NOT NULL,
    badge TEXT DEFAULT 'Torq Certified Master',
    status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'busy', 'offline')),
    current_lat NUMERIC(10, 7) NOT NULL DEFAULT 12.9680,
    current_lng NUMERIC(10, 7) NOT NULL DEFAULT 77.6350,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 10. COUPONS TABLE (Promotional Discount Engine)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percent')),
    value NUMERIC(10, 2) NOT NULL,
    min_order NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_discount NUMERIC(10, 2),
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- ==============================================================================
-- 11. BOOKINGS TABLE (Doorstep Care Orders & Appointments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES public.services(id),
    specialist_id TEXT REFERENCES public.specialists(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'assigned', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled')),
    vehicle_snapshot JSONB NOT NULL,
    date_slot TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    address_snapshot JSONB NOT NULL,
    service_price NUMERIC(10, 2) NOT NULL,
    addons_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    coupon_code TEXT REFERENCES public.coupons(code) ON DELETE SET NULL,
    coupon_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'UPI (Google Pay)',
    payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'REFUNDED')),
    invoice_number TEXT UNIQUE NOT NULL,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    before_photo TEXT,
    after_photo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 12. BOOKING ADDONS TABLE (Line-item selected add-ons)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.booking_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    addon_id TEXT NOT NULL REFERENCES public.addons(id),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

-- ==============================================================================
-- 13. REVIEWS TABLE (Post-service Customer Ratings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialist_id TEXT REFERENCES public.specialists(id) ON DELETE SET NULL,
    stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 14. COMPLAINTS TABLE (Issue Resolution Desk)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'In Review' CHECK (status IN ('In Review', 'Resolved', 'Investigating')),
    resolution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 15. FEEDBACKS TABLE (General App Feedback & Reward Ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    category TEXT NOT NULL,
    comment TEXT NOT NULL,
    reward_credited NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 16. NOTIFICATIONS TABLE (In-app Alerts Drawer)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'status' CHECK (type IN ('status', 'booking', 'promo', 'wallet')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 17. SUPPORT TICKETS TABLE (Admin Operations Desk)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'In Review' CHECK (status IN ('In Review', 'Resolved', 'Closed')),
    response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- HIGH-PERFORMANCE DATABASE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_specialist_id ON public.bookings(specialist_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking_id ON public.booking_addons(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_booking_id ON public.complaints(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- ==============================================================================
-- SEED ESSENTIAL DATA (Catalogs & Pricing Matrix)
-- ==============================================================================
INSERT INTO public.category_multipliers (category, multiplier) VALUES
('Hatchback', 1.00),
('Sedan', 1.15),
('SUV', 1.30),
('Luxury', 1.55),
('MPV', 1.40)
ON CONFLICT (category) DO NOTHING;

INSERT INTO public.services (id, name, category_tag, base_price, duration, image_url, rating, reviews_count, description, inclusions, popular, is_active) VALUES
('srv_1', 'Express Exterior Eco Wash', 'Wash', 399, '35 Mins', 'assets/images/tata_nexon.jpg', 4.85, 1240, 'Quick scratch-free high pressure exterior wash using pH-neutral polymers, microfiber towel dry, tire dressing and glass streak-free polish.', '["High pressure touchless pre-rinse", "pH neutral snow foam application", "Two-bucket scratch-safe hand wash", "Wheel faces & tire scrub & satin dress", "Exterior glass & mirror streak-free dry", "Door jambs quick wipedown"]'::jsonb, false, true),
('srv_2', 'Torq Hydro Foam & Wheel Detailing', 'Wash', 599, '50 Mins', 'assets/images/tata_safari_foam.jpg', 4.96, 2890, 'Our signature thick snow foam cannon wash with brake dust fallout removal, tire gloss conditioning, and hydrophobic spray sealant for lasting showroom shine.', '["Heavy dense snow foam cannon blast", "Iron fallout wheel de-ironizer wash", "Wheel wells & barrel deep agitation", "Plush microfiber 1200 GSM towel dry", "Hydrophobic ceramic spray gloss sealant", "Tire dressing with UV barrier protection", "All glass crystal-clear polish"]'::jsonb, true, true),
('srv_3', 'Interior Steam Spa & Sanitization', 'Interior', 899, '75 Mins', 'assets/images/interior_detailing.jpg', 4.91, 1640, 'Deep therapeutic cabin detox. 140°C pressurized dry steam sanitization kills 99.9% bacteria, deep HEPA vacuum, leather conditioning and AC duct flush.', '["Complete cabin dry HEPA deep vacuuming", "Seat fabric / leather extraction steam clean", "Dashboard, console & door card scrub & UV matte dress", "140°C thermal steam vent disinfection", "Odor neutralizer & pleasant luxury fragrance", "Trunk carpet deep vacuum & wipe", "Internal glass smear-free crystal polish"]'::jsonb, false, true),
('srv_4', 'Exterior Glow + Interior Dual Spa', 'Combo', 1199, '90 Mins', 'assets/images/mahindra_xuv700.png', 4.97, 3410, 'The ultimate 360° doorstep transformation. Full foam wash, wheel detailing, paint spray sealant combined with deep interior steam spa.', '["All inclusions from Torq Hydro Foam wash", "All inclusions from Interior Steam Spa", "Clay mitt light surface decontamination", "Foot pedals & mat high-pressure wash", "Hydrophobic windshield water repellent", "Leather conditioner with matte non-greasy feel"]'::jsonb, true, true),
('srv_5', '3M Machine Polish & Carnauba Wax', 'Detailing', 1499, '120 Mins', 'assets/images/mahindra_thar.jpg', 4.94, 980, 'Single-stage dual action machine buffing eliminates micro-swirls and light oxidation, topped with Brazilian Carnauba wax for deep wet-look reflections.', '["Decontamination chemical & clay treatment", "Dual action machine swirl-reducing buff", "3M Premium compound gloss enhancement", "Hand-buffed Brazilian Carnauba wax coat", "Trim restoration with hydrophobic dressing", "Wheel rim polymer sealant coating"]'::jsonb, false, true),
('srv_6', '9H Nano-Ceramic Shield Coat', 'Detailing', 4999, '180 Mins', 'assets/images/ceramic_coating.jpg', 4.99, 520, 'True ultra-hard 9H ceramic quartz crystal coating applied right at your doorstep. Provides extreme hydrophobic water-beading and 2-year warranty.', '["Two-stage paint correction & swirl removal", "IPA surface prep to remove all oils", "Multi-layer 9H ceramic coating on all painted panels", "Ceramic wheel face protective barrier", "Windshield ceramic hydrophobic treatment", "Includes 2-year warranty card & maintenance kit"]'::jsonb, false, true),
('srv_7', 'Engine Bay Eco-Steam & Degrease', 'Specialty', 499, '40 Mins', 'assets/images/before_after.jpg', 4.88, 740, 'Safely removes accumulated grease, grime and road dust using low-moisture steam and electronic component protection, dressed with OEM satin sheen.', '["Battery & alternator sensor moisture wrap", "Biodegradable citrus degreaser soak", "Controlled dry vapor steam agitation", "Hot air blow dry of all wiring & crevices", "Non-silicone anti-static hose & plastic dressing"]'::jsonb, false, true),
('srv_8', 'AC Evaporator Foam & Ozone Detox', 'Specialty', 349, '30 Mins', 'assets/images/hyundai_creta.png', 4.87, 1110, 'Eliminates musty mildew smells and allergens from AC duct coils with antibacterial expanding foam and medical-grade active ozone treatment.', '["Cabin AC filter dust blow & check", "Direct evaporator coil expanding disinfectant foam", "Ozone O3 generator shock treatment in closed cabin", "Eliminates mold spores, smoke and pet odors"]'::jsonb, false, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.addons (id, name, price, description, is_active) VALUES
('add_1', 'Rain-X Windshield Hydrophobic Shield', 199, 'Water sheets off cleanly at 45+ km/h without wipers', true),
('add_2', 'Alloy Wheel Iron Fallout Decon', 249, 'Dissolves stubborn baked-on brake dust from German wheels', true),
('add_3', 'Nappa Leather Deep Nourish Balm', 299, 'Prevents cracking and keeps leather soft and supple', true),
('add_4', 'Pet Hair & Embedded Fiber Extraction', 199, 'Deep mechanical bristle rake for pet lovers', true),
('add_5', 'Headlight UV Polish & Anti-Yellowing', 349, 'Restores cloudy yellow headlights to crystal clear clarity', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscription_plans (id, name, badge, price, period, washes_quota, spas_quota, savings_label, features, is_active) VALUES
('sub_silver', 'Torq Silver Pass', 'Popular', 699, 'month', 2, 0, 'Save 25%', '["2 Doorstep High-Gloss Snow Foam Washes", "Alloy wheel de-ironizer scrub & tire gloss", "Priority weekend slot booking", "Unused washes roll over to next month", "Self-powered van (Zero home power needed)"]'::jsonb, true),
('sub_gold', 'Torq Gold Signature', 'Best Value', 1399, 'month', 4, 1, 'Save 45%', '["4 Doorstep High-Gloss Snow Foam Washes (Weekly)", "1 Complete 140°C Interior Steam Spa & Sanitization", "Rain-X Windshield Hydrophobic Shield Included", "Complimentary Leather Condition & Odor Detox", "Dedicated Master Specialist assigned", "Cancel or pause anytime with 1 click"]'::jsonb, true),
('sub_platinum', 'Torq Platinum Club', 'VIP Ultimate', 2799, 'month', 99, 2, 'Save 60%', '["Unlimited Doorstep Eco Snow Foam Washes", "2 Complete Exterior + Interior Dual Signature Spas", "1 Engine Bay Steam Degrease & Dressing", "Free 3M Brazilian Carnauba Machine Buff", "Covers up to 2 vehicles in family garage", "Instant 2-hour priority express dispatch"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.coupons (code, discount_type, value, min_order, max_discount, description, is_active) VALUES
('FIRSTWASH', 'flat', 150, 399, NULL, '₹150 Flat Off on your 1st doorstep booking', true),
('SPARKLE50', 'percent', 50, 499, 250, '50% Off up to ₹250 on premium washes', true),
('CERAMIC500', 'flat', 500, 2500, NULL, '₹500 Off on Machine Polish & 9H Ceramic Coating', true),
('TORQVIP', 'percent', 20, 799, 350, '20% Off for Club Members', true),
('FESTIVE200', 'flat', 200, 999, NULL, 'Festival Special ₹200 Off on Dual Combo Spa', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.specialists (id, name, title, avatar_url, phone, rating, total_jobs, van_reg, badge, status, current_lat, current_lng) VALUES
('spec_01', 'Mark Jenkins', 'Master Detailing Specialist', 'assets/images/technician_mark.jpg', '+91 99120 44331', 4.96, 342, 'KA-05-MD-1192', 'Torq Certified Master', 'online', 12.9680, 77.6350)
ON CONFLICT (id) DO NOTHING;
