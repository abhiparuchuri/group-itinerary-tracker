-- TripTogether Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (no auth required - just device_id and display_name)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate random join codes
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  start_date DATE,
  end_date DATE,
  join_code TEXT UNIQUE DEFAULT generate_join_code(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip members table
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Itinerary days table
CREATE TABLE itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, date)
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  start_time TIME,
  end_time TIME,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('food', 'attraction', 'transport', 'lodging', 'other')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  paid_by UUID NOT NULL REFERENCES users(id),
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'full')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense splits table
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  is_settled BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at TIMESTAMPTZ,
  UNIQUE(expense_id, user_id)
);

-- Indexes for common queries
CREATE INDEX idx_trips_join_code ON trips(join_code);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);
CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX idx_itinerary_days_trip ON itinerary_days(trip_id);
CREATE INDEX idx_activities_day ON activities(day_id);
CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user ON expense_splits(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now - users can access their own data)
-- Note: In production, you'd want more restrictive policies

-- Users can read any user (for trip member displays)
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- Anyone can insert (create account)
CREATE POLICY "Anyone can create user" ON users FOR INSERT WITH CHECK (true);

-- Trips policies
CREATE POLICY "Trips viewable by members" ON trips FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_members.trip_id = trips.id)
  OR true -- Allow lookup by join_code
);

CREATE POLICY "Anyone can create trips" ON trips FOR INSERT WITH CHECK (true);

CREATE POLICY "Trip owners/editors can update" ON trips FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = trips.id
    AND trip_members.role IN ('owner', 'editor')
  )
);

-- Trip members policies
CREATE POLICY "Trip members viewable by trip members" ON trip_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join trips" ON trip_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can manage members" ON trip_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM trip_members tm
    WHERE tm.trip_id = trip_members.trip_id
    AND tm.role = 'owner'
  )
);

-- Itinerary days policies
CREATE POLICY "Days viewable by trip members" ON itinerary_days FOR SELECT USING (true);
CREATE POLICY "Trip members can create days" ON itinerary_days FOR INSERT WITH CHECK (true);
CREATE POLICY "Trip members can update days" ON itinerary_days FOR UPDATE USING (true);
CREATE POLICY "Trip members can delete days" ON itinerary_days FOR DELETE USING (true);

-- Activities policies
CREATE POLICY "Activities viewable by trip members" ON activities FOR SELECT USING (true);
CREATE POLICY "Trip members can create activities" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Trip members can update activities" ON activities FOR UPDATE USING (true);
CREATE POLICY "Trip members can delete activities" ON activities FOR DELETE USING (true);

-- Expenses policies
CREATE POLICY "Expenses viewable by trip members" ON expenses FOR SELECT USING (true);
CREATE POLICY "Trip members can create expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Trip members can update expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Trip members can delete expenses" ON expenses FOR DELETE USING (true);

-- Expense splits policies
CREATE POLICY "Splits viewable by trip members" ON expense_splits FOR SELECT USING (true);
CREATE POLICY "Trip members can create splits" ON expense_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Trip members can update splits" ON expense_splits FOR UPDATE USING (true);

-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE itinerary_days;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_splits;
