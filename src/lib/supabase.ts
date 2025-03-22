
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return { error: error.message || 'An unexpected error occurred' };
};

// Type for database tables
export type Station = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  station_id: string | null;
  created_at: string;
  updated_at: string;
  hourly_rate?: number;
  contact_number?: string;
  email?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending';
};

export type Dispenser = {
  id: string;
  station_id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  fuel_types: string[];
  created_at: string;
  updated_at: string;
};

export type FuelInventory = {
  id: string;
  station_id: string;
  fuel_type: string;
  current_stock: number;
  capacity: number;
  alert_threshold: number;
  price_per_liter: number;
  cost_per_liter: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  station_id: string;
  name: string;
  category: string;
  current_stock: number;
  alert_threshold: number;
  price: number;
  cost: number;
  created_at: string;
  updated_at: string;
};

export type Shift = {
  id: string;
  station_id: string;
  employee_id: string;
  start_time: string;
  end_time: string | null;
  dispensers: string[];
  starting_cash: number;
  ending_cash: number | null;
  notes: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type MeterReading = {
  id: string;
  shift_id: string;
  dispenser_id: string;
  fuel_type: string;
  start_reading: number;
  end_reading: number | null;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  station_id: string;
  shift_id: string;
  customer_id: string | null;
  transaction_type: 'sale' | 'refund' | 'credit';
  payment_method: 'cash' | 'card' | 'credit';
  total_amount: number;
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type TransactionItem = {
  id: string;
  transaction_id: string;
  item_type: 'fuel' | 'product';
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
};

export type Vehicle = {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  fuel_type: string;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  customer_id: string;
  station_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  discount: number;
  tax: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partially_paid';
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  station_id: string;
  expense_type: string;
  amount: number;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
};
