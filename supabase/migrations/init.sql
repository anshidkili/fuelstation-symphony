
-- This file contains SQL schema for the Fuel Symphony application
-- It will be executed on the Supabase project to create tables and set up RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE public.stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL,
    station_id UUID REFERENCES public.stations,
    hourly_rate DECIMAL(10, 2),
    contact_number TEXT,
    email TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.dispensers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.stations ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    fuel_types TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.fuel_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.stations ON DELETE CASCADE,
    fuel_type TEXT NOT NULL,
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    capacity DECIMAL(10, 2) NOT NULL,
    alert_threshold DECIMAL(10, 2) NOT NULL,
    price_per_liter DECIMAL(10, 2) NOT NULL,
    cost_per_liter DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (station_id, fuel_type)
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.stations ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    alert_threshold DECIMAL(10, 2) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.stations ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    dispensers UUID[] NOT NULL,
    starting_cash DECIMAL(10, 2) NOT NULL,
    ending_cash DECIMAL(10, 2),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.meter_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES public.shifts ON DELETE CASCADE,
    dispenser_id UUID NOT NULL REFERENCES public.dispensers ON DELETE CASCADE,
    fuel_type TEXT NOT NULL,
    start_reading DECIMAL(10, 2) NOT NULL,
    end_reading DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.stations ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES public.shifts ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles,
    transaction_type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id UUID NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES public.stations ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.stations ON DELETE CASCADE,
    expense_type TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stored procedures for common operations
CREATE OR REPLACE FUNCTION update_fuel_inventory(p_fuel_id UUID, p_quantity DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE public.fuel_inventory
    SET current_stock = current_stock - p_quantity,
        updated_at = NOW()
    WHERE id = p_fuel_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_product_inventory(p_product_id UUID, p_quantity DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET current_stock = current_stock - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's station_id
CREATE OR REPLACE FUNCTION get_user_station_id()
RETURNS UUID AS $$
DECLARE
    station_id UUID;
BEGIN
    SELECT profiles.station_id INTO station_id FROM public.profiles WHERE user_id = auth.uid();
    RETURN station_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on all tables
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Super Admin
CREATE POLICY "Super Admin can do everything on all tables" 
ON public.stations FOR ALL 
TO authenticated 
USING (get_user_role() = 'Super Admin')
WITH CHECK (get_user_role() = 'Super Admin');

-- RLS Policies for Admins (station managers)
CREATE POLICY "Admins can view their own station" 
ON public.stations FOR SELECT 
TO authenticated 
USING (id = get_user_station_id() OR get_user_role() = 'Super Admin');

CREATE POLICY "Admins can manage profiles at their station" 
ON public.profiles FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    user_id = auth.uid()
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    user_id = auth.uid()
);

-- Insert sample data for testing
INSERT INTO public.stations (name, address, city, state, zip, phone, email, status)
VALUES 
('Downtown Fuel Station', '123 Main St', 'Cityville', 'State', '12345', '555-1234', 'downtown@fuelstation.com', 'active'),
('Uptown Fuel Station', '456 High St', 'Townsburg', 'State', '54321', '555-5678', 'uptown@fuelstation.com', 'active');

-- Create trigger to create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Employee'),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
