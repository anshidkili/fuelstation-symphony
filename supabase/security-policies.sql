
-- This file contains SQL security policies for the Fuel Symphony application

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
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_mismatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

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

-- Create proper policies for dispensers
CREATE POLICY "Admins can manage dispensers at their station" 
ON public.dispensers FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
);

-- Create policies for fuel inventory and products
CREATE POLICY "Admins can manage fuel inventory at their station" 
ON public.fuel_inventory FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
);

CREATE POLICY "Admins can manage products at their station" 
ON public.products FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
);

-- Create policies for shifts and meter readings
CREATE POLICY "Users can manage shifts at their station" 
ON public.shifts FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Employee' AND employee_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Employee' AND employee_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Create proper policies for meter_readings
CREATE POLICY "Admins can manage meter_readings from their station" 
ON public.meter_readings FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND (
        SELECT s.station_id 
        FROM public.shifts s 
        WHERE s.id = shift_id
    ) = get_user_station_id())
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND (
        SELECT s.station_id 
        FROM public.shifts s 
        WHERE s.id = shift_id
    ) = get_user_station_id())
);

-- Create policies for transactions
CREATE POLICY "Users can manage transactions at their station" 
ON public.transactions FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Employee' AND shift_id IN (
        SELECT id FROM shifts WHERE employee_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    ))
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Employee' AND shift_id IN (
        SELECT id FROM shifts WHERE employee_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    ))
);

-- Create proper policies for transaction_items
CREATE POLICY "Admins can manage transaction_items from their station" 
ON public.transaction_items FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND (
        SELECT t.station_id 
        FROM public.transactions t 
        WHERE t.id = transaction_id
    ) = get_user_station_id())
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND (
        SELECT t.station_id 
        FROM public.transactions t 
        WHERE t.id = transaction_id
    ) = get_user_station_id())
);

-- Create policies for vehicles
CREATE POLICY "Admins and customers can manage vehicles" 
ON public.vehicles FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND (
        SELECT p.station_id 
        FROM public.profiles p 
        WHERE p.id = customer_id
    ) = get_user_station_id()) OR
    (get_user_role() = 'Credit Customer' AND customer_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND (
        SELECT p.station_id 
        FROM public.profiles p 
        WHERE p.id = customer_id
    ) = get_user_station_id()) OR
    (get_user_role() = 'Credit Customer' AND customer_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Create policies for invoices
CREATE POLICY "Admins and customers can view invoices" 
ON public.invoices FOR SELECT 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Credit Customer' AND customer_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins can manage invoices at their station" 
ON public.invoices FOR INSERT UPDATE DELETE 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
);

-- Create proper policies for invoice_items
CREATE POLICY "Admins can manage invoice_items from their station" 
ON public.invoice_items FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND (
        SELECT i.station_id 
        FROM public.invoices i 
        WHERE i.id = invoice_id
    ) = get_user_station_id())
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND (
        SELECT i.station_id 
        FROM public.invoices i 
        WHERE i.id = invoice_id
    ) = get_user_station_id())
);

-- Create policies for expenses
CREATE POLICY "Admins can manage expenses at their station" 
ON public.expenses FOR ALL 
TO authenticated 
USING (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
)
WITH CHECK (
    get_user_role() = 'Super Admin' OR
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
);

-- Create policies for financial reports
CREATE POLICY "Super Admin can see all financial reports" 
ON public.financial_reports FOR SELECT 
TO authenticated 
USING (get_user_role() = 'Super Admin');

CREATE POLICY "Admins can see their station financial reports" 
ON public.financial_reports FOR SELECT 
TO authenticated 
USING (
    get_user_role() = 'Admin' AND station_id = get_user_station_id()
);

-- Create policies for sales mismatches
CREATE POLICY "Super Admin can see all sales mismatches" 
ON public.sales_mismatches FOR ALL
TO authenticated 
USING (get_user_role() = 'Super Admin')
WITH CHECK (get_user_role() = 'Super Admin');

CREATE POLICY "Admins can see and manage their station's sales mismatches" 
ON public.sales_mismatches FOR ALL
TO authenticated 
USING (
    get_user_role() = 'Admin' AND 
    (SELECT station_id FROM shifts WHERE id = shift_id) = get_user_station_id()
)
WITH CHECK (
    get_user_role() = 'Admin' AND 
    (SELECT station_id FROM shifts WHERE id = shift_id) = get_user_station_id()
);

CREATE POLICY "Employees can see their own sales mismatches" 
ON public.sales_mismatches FOR SELECT
TO authenticated 
USING (
    get_user_role() = 'Employee' AND 
    (SELECT employee_id FROM shifts WHERE id = shift_id) = 
    (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Create policies for payment reminders
CREATE POLICY "Super Admin can manage all payment reminders" 
ON public.payment_reminders FOR ALL
TO authenticated 
USING (get_user_role() = 'Super Admin')
WITH CHECK (get_user_role() = 'Super Admin');

CREATE POLICY "Admins can manage their station's payment reminders" 
ON public.payment_reminders FOR ALL
TO authenticated 
USING (
    get_user_role() = 'Admin' AND 
    (SELECT station_id FROM invoices WHERE id = invoice_id) = get_user_station_id()
)
WITH CHECK (
    get_user_role() = 'Admin' AND 
    (SELECT station_id FROM invoices WHERE id = invoice_id) = get_user_station_id()
);

CREATE POLICY "Credit Customers can view their payment reminders" 
ON public.payment_reminders FOR SELECT
TO authenticated 
USING (
    get_user_role() = 'Credit Customer' AND customer_id = 
    (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Create policies for activity logs
CREATE POLICY "Super Admin can view all activity logs" 
ON public.activity_logs FOR SELECT
TO authenticated 
USING (get_user_role() = 'Super Admin');

CREATE POLICY "Admins can view their station's activity logs" 
ON public.activity_logs FOR SELECT
TO authenticated 
USING (
    get_user_role() = 'Admin' AND 
    (details->>'station_id')::UUID = get_user_station_id()
);

-- Insert a Super Admin user for testing if no profiles exist yet
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    
    IF profile_count = 0 THEN
        -- Insert sample stations first
        INSERT INTO public.stations (name, address, city, state, zip, phone, email, status)
        VALUES 
        ('Downtown Fuel Station', '123 Main St', 'Cityville', 'State', '12345', '555-1234', 'downtown@fuelsymphony.com', 'active'),
        ('Uptown Fuel Station', '456 High St', 'Townsburg', 'State', '54321', '555-5678', 'uptown@fuelsymphony.com', 'active');
        
        -- Then insert a Super Admin profile
        INSERT INTO public.profiles (id, full_name, role, email, status)
        VALUES (
            uuid_generate_v4(),
            'Super Admin',
            'Super Admin',
            'admin@fuelsymphony.com',
            'active'
        );
    END IF;
END
$$;

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
