/*
  # Real Estate Platform Database Schema

  1. New Tables
    - `profiles` - Extended user profiles with role management
    - `land_plots` - Property listings with detailed information
    - `cart_items` - Shopping cart functionality
    - `orders` - Order management and tracking
    - `notifications` - System notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure admin and master admin operations

  3. Features
    - User role management (user, admin, master_admin)
    - Property status tracking (available, reserved, sold)
    - Order workflow management
    - Partner application system
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'master_admin');
CREATE TYPE partner_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE land_usage AS ENUM ('economic', 'business', 'residential', 'mixed');
CREATE TYPE plot_status AS ENUM ('available', 'reserved', 'sold');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text,
  role user_role DEFAULT 'user',
  is_partner boolean DEFAULT false,
  partner_status partner_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Land plots table
CREATE TABLE IF NOT EXISTS land_plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  area numeric NOT NULL CHECK (area > 0),
  price numeric NOT NULL CHECK (price > 0),
  region text NOT NULL,
  district text NOT NULL,
  council text NOT NULL,
  coordinates jsonb,
  width numeric NOT NULL CHECK (width > 0),
  length numeric NOT NULL CHECK (length > 0),
  usage land_usage NOT NULL,
  status plot_status DEFAULT 'available',
  images text[] DEFAULT '{}',
  features text[] DEFAULT '{}',
  documents text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  plot_id uuid REFERENCES land_plots(id) ON DELETE CASCADE,
  reserved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plot_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  plot_id uuid REFERENCES land_plots(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
    )
  );

-- Land plots policies
CREATE POLICY "Anyone can read available plots"
  ON land_plots
  FOR SELECT
  TO authenticated
  USING (status = 'available');

CREATE POLICY "Admins can manage all plots"
  ON land_plots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
    )
  );

-- Cart items policies
CREATE POLICY "Users can manage own cart"
  ON cart_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'master_admin')
    )
  );

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_land_plots_status ON land_plots(status);
CREATE INDEX IF NOT EXISTS idx_land_plots_region ON land_plots(region);
CREATE INDEX IF NOT EXISTS idx_land_plots_usage ON land_plots(usage);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Insert default master admin (will be created via Supabase Auth)
-- This is a placeholder - actual user creation happens through Supabase Auth
INSERT INTO profiles (id, first_name, last_name, phone_number, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Master', 'Admin', '+255123456789', 'master_admin'),
  ('00000000-0000-0000-0000-000000000002', 'System', 'Admin', '+255123456790', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Insert sample land plots
INSERT INTO land_plots (title, description, area, price, region, district, council, width, length, usage, images, features)
VALUES 
  (
    'Premium Commercial Plot - Dar es Salaam',
    'Strategic commercial plot perfect for business development in the heart of Dar es Salaam',
    2000,
    450000000,
    'Dar es Salaam',
    'Kinondoni',
    'Kinondoni Municipal',
    40,
    50,
    'business',
    ARRAY['https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg'],
    ARRAY['Title Deed', 'Road Access', 'Electricity', 'Water Supply', 'Commercial Zone']
  ),
  (
    'Residential Plot - Arusha City',
    'Perfect residential plot in a growing neighborhood with excellent infrastructure',
    1200,
    180000000,
    'Arusha',
    'Arusha City',
    'Arusha City Council',
    30,
    40,
    'residential',
    ARRAY['https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg'],
    ARRAY['Clean Title', 'Surveyed', 'Accessible Road', 'Residential Zone']
  ),
  (
    'Agricultural Land - Morogoro',
    'Fertile agricultural land with water access, perfect for farming activities',
    5000,
    250000000,
    'Morogoro',
    'Morogoro Rural',
    'Morogoro District Council',
    100,
    50,
    'economic',
    ARRAY['https://images.pexels.com/photos/2132173/pexels-photo-2132173.jpeg'],
    ARRAY['River Access', 'Fertile Soil', 'Clear Boundaries', 'Agricultural Zone']
  ),
  (
    'Mixed Use Plot - Mwanza',
    'Versatile plot suitable for both residential and commercial development',
    1800,
    320000000,
    'Mwanza',
    'Nyamagana',
    'Nyamagana Municipal',
    45,
    40,
    'mixed',
    ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'],
    ARRAY['Mixed Zone', 'Title Deed', 'Infrastructure Ready', 'Prime Location']
  ),
  (
    'Business Plot - Dodoma',
    'Strategic business plot in the capital city with excellent growth potential',
    1500,
    280000000,
    'Dodoma',
    'Dodoma Urban',
    'Dodoma City Council',
    30,
    50,
    'business',
    ARRAY['https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg'],
    ARRAY['Business Zone', 'Government Area', 'Infrastructure', 'Investment Opportunity']
  ),
  (
    'Residential Estate Plot - Mbeya',
    'Premium residential plot in planned estate development',
    1000,
    150000000,
    'Mbeya',
    'Mbeya City',
    'Mbeya City Council',
    25,
    40,
    'residential',
    ARRAY['https://images.pexels.com/photos/1642125/pexels-photo-1642125.jpeg'],
    ARRAY['Gated Community', 'Security', 'Modern Infrastructure', 'Family Friendly']
  );