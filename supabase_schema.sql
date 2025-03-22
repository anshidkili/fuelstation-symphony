
-- SCHEMA DEFINITION FOR FUEL STATION MANAGEMENT SYSTEM

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

-- Create functions for reports
CREATE OR REPLACE FUNCTION get_sales_report(
    p_station_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_group_by TEXT
)
RETURNS TABLE (
    date_group TEXT,
    total_sales DECIMAL(10, 2),
    transaction_count BIGINT
) AS $$
BEGIN
    IF p_group_by = 'day' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(t.created_at, 'YYYY-MM-DD') as date_group,
            SUM(t.total_amount) as total_sales,
            COUNT(*) as transaction_count
        FROM public.transactions t
        WHERE t.station_id = p_station_id
        AND t.created_at BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
        GROUP BY TO_CHAR(t.created_at, 'YYYY-MM-DD')
        ORDER BY date_group;
    ELSIF p_group_by = 'month' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(t.created_at, 'YYYY-MM') as date_group,
            SUM(t.total_amount) as total_sales,
            COUNT(*) as transaction_count
        FROM public.transactions t
        WHERE t.station_id = p_station_id
        AND t.created_at BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
        GROUP BY TO_CHAR(t.created_at, 'YYYY-MM')
        ORDER BY date_group;
    ELSE -- year
        RETURN QUERY
        SELECT 
            TO_CHAR(t.created_at, 'YYYY') as date_group,
            SUM(t.total_amount) as total_sales,
            COUNT(*) as transaction_count
        FROM public.transactions t
        WHERE t.station_id = p_station_id
        AND t.created_at BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
        GROUP BY TO_CHAR(t.created_at, 'YYYY')
        ORDER BY date_group;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_fuel_sales_breakdown(
    p_station_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    fuel_type TEXT,
    total_quantity DECIMAL(10, 2),
    total_sales DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fi.fuel_type,
        SUM(ti.quantity) as total_quantity,
        SUM(ti.total_price) as total_sales
    FROM public.transaction_items ti
    JOIN public.transactions t ON ti.transaction_id = t.id
    JOIN public.fuel_inventory fi ON ti.item_id = fi.id AND ti.item_type = 'fuel'
    WHERE t.station_id = p_station_id
    AND t.created_at BETWEEN p_start_date AND p_end_date
    AND t.status = 'completed'
    GROUP BY fi.fuel_type
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_product_sales_breakdown(
    p_station_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    product_name TEXT,
    product_category TEXT,
    total_quantity DECIMAL(10, 2),
    total_sales DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as product_name,
        p.category as product_category,
        SUM(ti.quantity) as total_quantity,
        SUM(ti.total_price) as total_sales
    FROM public.transaction_items ti
    JOIN public.transactions t ON ti.transaction_id = t.id
    JOIN public.products p ON ti.item_id = p.id AND ti.item_type = 'product'
    WHERE t.station_id = p_station_id
    AND t.created_at BETWEEN p_start_date AND p_end_date
    AND t.status = 'completed'
    GROUP BY p.name, p.category
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_station_comparison(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    station_id UUID,
    station_name TEXT,
    total_sales DECIMAL(10, 2),
    transaction_count BIGINT,
    fuel_sales DECIMAL(10, 2),
    product_sales DECIMAL(10, 2),
    expenses DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH station_transactions AS (
        SELECT 
            s.id as sid,
            s.name as sname,
            COALESCE(SUM(t.total_amount), 0) as sales,
            COUNT(t.id) as tx_count
        FROM public.stations s
        LEFT JOIN public.transactions t 
            ON s.id = t.station_id 
            AND t.created_at BETWEEN p_start_date AND p_end_date
            AND t.status = 'completed'
        GROUP BY s.id, s.name
    ),
    fuel_sales AS (
        SELECT
            t.station_id as sid,
            COALESCE(SUM(ti.total_price), 0) as fuel_sales
        FROM public.transaction_items ti
        JOIN public.transactions t ON ti.transaction_id = t.id
        WHERE ti.item_type = 'fuel'
        AND t.created_at BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
        GROUP BY t.station_id
    ),
    product_sales AS (
        SELECT
            t.station_id as sid,
            COALESCE(SUM(ti.total_price), 0) as product_sales
        FROM public.transaction_items ti
        JOIN public.transactions t ON ti.transaction_id = t.id
        WHERE ti.item_type = 'product'
        AND t.created_at BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
        GROUP BY t.station_id
    ),
    station_expenses AS (
        SELECT
            e.station_id as sid,
            COALESCE(SUM(e.amount), 0) as expenses
        FROM public.expenses e
        WHERE e.date BETWEEN p_start_date::DATE AND p_end_date::DATE
        GROUP BY e.station_id
    )
    SELECT 
        st.sid as station_id,
        st.sname as station_name,
        st.sales as total_sales,
        st.tx_count as transaction_count,
        COALESCE(fs.fuel_sales, 0) as fuel_sales,
        COALESCE(ps.product_sales, 0) as product_sales,
        COALESCE(se.expenses, 0) as expenses
    FROM station_transactions st
    LEFT JOIN fuel_sales fs ON st.sid = fs.sid
    LEFT JOIN product_sales ps ON st.sid = ps.sid
    LEFT JOIN station_expenses se ON st.sid = se.sid
    ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_financial_summary(
    p_station_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    total_sales DECIMAL(10, 2),
    product_sales DECIMAL(10, 2),
    fuel_sales DECIMAL(10, 2),
    expenses DECIMAL(10, 2),
    profit DECIMAL(10, 2),
    profit_margin DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH sales AS (
        SELECT 
            COALESCE(SUM(t.total_amount), 0) as total_sales
        FROM public.transactions t
        WHERE t.station_id = p_station_id
        AND t.created_at BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
    ),
    fuel AS (
        SELECT
            COALESCE(SUM(ti.total_price), 0) as fuel_sales
        FROM public.transaction_items ti
        JOIN public.transactions t ON ti.transaction_id = t.id
        WHERE t.station_id = p_station_id
        AND ti.item_type = 'fuel'
        AND t.created_at BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
    ),
    products AS (
        SELECT
            COALESCE(SUM(ti.total_price), 0) as product_sales
        FROM public.transaction_items ti
        JOIN public.transactions t ON ti.transaction_id = t.id
        WHERE t.station_id = p_station_id
        AND ti.item_type = 'product'
        AND t.created_at BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
    ),
    station_expenses AS (
        SELECT
            COALESCE(SUM(e.amount), 0) as expenses
        FROM public.expenses e
        WHERE e.station_id = p_station_id
        AND e.date BETWEEN p_start_date::DATE AND p_end_date::DATE
    )
    SELECT 
        s.total_sales,
        p.product_sales,
        f.fuel_sales,
        e.expenses,
        (s.total_sales - e.expenses) as profit,
        CASE 
            WHEN s.total_sales = 0 THEN 0
            ELSE ROUND(((s.total_sales - e.expenses) / s.total_sales) * 100, 2)
        END as profit_margin
    FROM sales s, products p, fuel f, station_expenses e;
END;
$$ LANGUAGE plpgsql;

-- Create Row Level Security (RLS) policies
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

-- Common helper function to get user role
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

-- Super Admin policies (can see and do everything)
CREATE POLICY "Super Admin can do everything on stations" 
ON public.stations FOR ALL 
TO authenticated 
USING (get_user_role() = 'Super Admin')
WITH CHECK (get_user_role() = 'Super Admin');

-- Allow Super Admin to manage admin profiles
CREATE POLICY "Super Admin can manage admin profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (get_user_role() = 'Super Admin' OR user_id = auth.uid())
WITH CHECK (get_user_role() = 'Super Admin' OR user_id = auth.uid());

-- Admin policies (can see and manage their own station)
CREATE POLICY "Admins can view their own station" 
ON public.stations FOR SELECT 
TO authenticated 
USING (id = get_user_station_id());

CREATE POLICY "Admins can manage dispensers at their station" 
ON public.dispensers FOR ALL 
TO authenticated 
USING (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
)
WITH CHECK (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
);

CREATE POLICY "Admins can manage inventory at their station" 
ON public.fuel_inventory FOR ALL 
TO authenticated 
USING (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
)
WITH CHECK (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
);

CREATE POLICY "Admins can manage products at their station" 
ON public.products FOR ALL 
TO authenticated 
USING (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
)
WITH CHECK (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id())
);

-- Employee policies
CREATE POLICY "Employees can view dispensers at their station" 
ON public.dispensers FOR SELECT 
TO authenticated 
USING (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Employee' AND station_id = get_user_station_id())
);

CREATE POLICY "Employees can manage their own shifts" 
ON public.shifts FOR ALL 
TO authenticated 
USING (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Employee' AND (employee_id = auth.uid() OR station_id = get_user_station_id()))
)
WITH CHECK (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Employee' AND employee_id = auth.uid() AND station_id = get_user_station_id())
);

-- Customer policies
CREATE POLICY "Customers can view their own vehicles" 
ON public.vehicles FOR SELECT 
TO authenticated 
USING (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Credit Customer' AND customer_id = auth.uid())
);

CREATE POLICY "Customers can manage their own vehicles" 
ON public.vehicles FOR INSERT, UPDATE, DELETE 
TO authenticated 
USING (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Credit Customer' AND customer_id = auth.uid())
)
WITH CHECK (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Credit Customer' AND customer_id = auth.uid())
);

CREATE POLICY "Customers can view their own invoices" 
ON public.invoices FOR SELECT 
TO authenticated 
USING (
    (get_user_role() = 'Super Admin') OR 
    (get_user_role() = 'Admin' AND station_id = get_user_station_id()) OR
    (get_user_role() = 'Credit Customer' AND customer_id = auth.uid())
);

-- Insert sample data
INSERT INTO public.stations (id, name, address, city, state, zip, phone, email, status)
VALUES 
(uuid_generate_v4(), 'Downtown Fuel Station', '123 Main St', 'Cityville', 'State', '12345', '555-1234', 'downtown@fuelstation.com', 'active'),
(uuid_generate_v4(), 'Uptown Fuel Station', '456 High St', 'Townsburg', 'State', '54321', '555-5678', 'uptown@fuelstation.com', 'active'),
(uuid_generate_v4(), 'Highway Fuel Station', '789 Route 66', 'Roadsville', 'State', '67890', '555-9012', 'highway@fuelstation.com', 'active');

-- Sample user profiles will be created when users register
