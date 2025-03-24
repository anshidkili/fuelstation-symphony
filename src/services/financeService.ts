
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from './api';

export type FinancialReportType = 'daily' | 'monthly' | 'yearly';

export const generateFinancialReport = async (
  stationId: string,
  reportType: FinancialReportType,
  reportDate: Date
) => {
  try {
    const { data, error } = await supabase.rpc('generate_financial_report', {
      p_station_id: stationId,
      p_report_type: reportType,
      p_report_date: reportDate.toISOString().split('T')[0]
    });

    if (error) throw error;

    await logActivity({
      action: 'generate',
      entity_type: 'financial_report',
      entity_id: data,
      details: { station_id: stationId, report_type: reportType, report_date: reportDate }
    });

    toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully`);
    return { success: true, reportId: data };
  } catch (error: any) {
    console.error('Error generating financial report:', error);
    toast.error(error.message || 'Failed to generate financial report');
    return { success: false, error: error.message };
  }
};

export const getFinancialReports = async (stationId: string, reportType?: FinancialReportType) => {
  try {
    let query = supabase
      .from('financial_reports')
      .select('*')
      .eq('station_id', stationId)
      .order('report_date', { ascending: false });
      
    if (reportType) {
      query = query.eq('report_type', reportType);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return { success: true, reports: data };
  } catch (error: any) {
    console.error('Error fetching financial reports:', error);
    toast.error(error.message || 'Failed to fetch financial reports');
    return { success: false, error: error.message };
  }
};

export const getAllStationsFinancialSummary = async (reportType: FinancialReportType, dateRange?: { start: Date, end: Date }) => {
  try {
    let query = supabase
      .from('financial_reports')
      .select(`
        id, 
        report_type, 
        report_date, 
        sales_amount, 
        expenses_amount, 
        profit_amount,
        stations(id, name)
      `)
      .eq('report_type', reportType)
      .order('report_date', { ascending: false });
      
    if (dateRange) {
      query = query.gte('report_date', dateRange.start.toISOString().split('T')[0])
                   .lte('report_date', dateRange.end.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return { success: true, reports: data };
  } catch (error: any) {
    console.error('Error fetching stations financial summary:', error);
    toast.error(error.message || 'Failed to fetch stations financial summary');
    return { success: false, error: error.message };
  }
};

export const checkForInventoryAlerts = async (stationId: string) => {
  try {
    // Check fuel inventory for low stock
    const { data: fuelData, error: fuelError } = await supabase
      .from('fuel_inventory')
      .select('*')
      .eq('station_id', stationId)
      .lt('current_stock', supabase.raw('alert_threshold'));
      
    if (fuelError) throw fuelError;
    
    // Check products for low stock
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('station_id', stationId)
      .lt('current_stock', supabase.raw('alert_threshold'));
      
    if (productError) throw productError;
    
    return { 
      success: true, 
      alerts: {
        fuel: fuelData || [],
        products: productData || []
      }
    };
  } catch (error: any) {
    console.error('Error checking inventory alerts:', error);
    toast.error(error.message || 'Failed to check inventory alerts');
    return { success: false, error: error.message };
  }
};

// Expense Management
export const addExpense = async (expenseData: any) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'create',
      entity_type: 'expense',
      entity_id: data.id,
      details: { station_id: expenseData.station_id, amount: expenseData.amount }
    });

    toast.success('Expense recorded successfully');
    return { success: true, expense: data };
  } catch (error: any) {
    console.error('Error recording expense:', error);
    toast.error(error.message || 'Failed to record expense');
    return { success: false, error: error.message };
  }
};

export const getExpenses = async (stationId: string, dateRange?: { start: Date, end: Date }) => {
  try {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('station_id', stationId)
      .order('date', { ascending: false });
      
    if (dateRange) {
      query = query.gte('date', dateRange.start.toISOString().split('T')[0])
                   .lte('date', dateRange.end.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return { success: true, expenses: data };
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    toast.error(error.message || 'Failed to fetch expenses');
    return { success: false, error: error.message };
  }
};

// Sales Mismatch Management
export const checkSalesMismatch = async (shiftId: string) => {
  try {
    const { data, error } = await supabase.rpc('calculate_sales_mismatch', {
      p_shift_id: shiftId
    });

    if (error) throw error;

    // If there's a significant mismatch (more than $1), record it
    if (Math.abs(data) > 1) {
      // Get expected and actual sales amounts
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .select(`
          id,
          station_id,
          meter_readings(dispenser_id, fuel_type, start_reading, end_reading),
          transactions(total_amount)
        `)
        .eq('id', shiftId)
        .single();
        
      if (shiftError) throw shiftError;
      
      // Calculate expected sales based on meter readings
      const expectedSales = shiftData.meter_readings.reduce((total: number, reading: any) => {
        if (reading.end_reading) {
          const { data: fuelData } = supabase
            .from('fuel_inventory')
            .select('price_per_liter')
            .eq('station_id', shiftData.station_id)
            .eq('fuel_type', reading.fuel_type)
            .single();
            
          if (fuelData) {
            const volumeSold = reading.end_reading - reading.start_reading;
            return total + (volumeSold * fuelData.price_per_liter);
          }
        }
        return total;
      }, 0);
      
      // Calculate actual sales from transactions
      const actualSales = shiftData.transactions.reduce((total: number, transaction: any) => {
        return total + transaction.total_amount;
      }, 0);
      
      // Record mismatch
      await supabase
        .from('sales_mismatches')
        .insert({
          shift_id: shiftId,
          expected_amount: expectedSales,
          actual_amount: actualSales,
          mismatch_amount: data
        });
        
      await logActivity({
        action: 'detect',
        entity_type: 'sales_mismatch',
        entity_id: shiftId,
        details: { expected: expectedSales, actual: actualSales, mismatch: data }
      });
      
      toast.warning(`Sales mismatch detected: ${data > 0 ? 'Surplus' : 'Deficit'} of $${Math.abs(data).toFixed(2)}`);
    }

    return { success: true, mismatch: data };
  } catch (error: any) {
    console.error('Error checking sales mismatch:', error);
    toast.error(error.message || 'Failed to check sales mismatch');
    return { success: false, error: error.message };
  }
};

export const getSalesMismatches = async (stationId: string, resolved?: boolean) => {
  try {
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id')
      .eq('station_id', stationId);
      
    if (shiftsError) throw shiftsError;
    
    const shiftIds = shifts.map((shift) => shift.id);
    
    let query = supabase
      .from('sales_mismatches')
      .select(`
        id,
        shift_id,
        expected_amount,
        actual_amount,
        mismatch_amount,
        is_resolved,
        resolution_notes,
        created_at,
        shifts(
          id,
          start_time,
          end_time,
          profiles(id, full_name)
        )
      `)
      .in('shift_id', shiftIds)
      .order('created_at', { ascending: false });
      
    if (resolved !== undefined) {
      query = query.eq('is_resolved', resolved);
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return { success: true, mismatches: data };
  } catch (error: any) {
    console.error('Error fetching sales mismatches:', error);
    toast.error(error.message || 'Failed to fetch sales mismatches');
    return { success: false, error: error.message };
  }
};

export const resolveSalesMismatch = async (mismatchId: string, resolutionNotes: string) => {
  try {
    const { data, error } = await supabase
      .from('sales_mismatches')
      .update({
        is_resolved: true,
        resolution_notes: resolutionNotes
      })
      .eq('id', mismatchId)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      action: 'resolve',
      entity_type: 'sales_mismatch',
      entity_id: mismatchId,
      details: { resolution_notes: resolutionNotes }
    });

    toast.success('Sales mismatch marked as resolved');
    return { success: true, mismatch: data };
  } catch (error: any) {
    console.error('Error resolving sales mismatch:', error);
    toast.error(error.message || 'Failed to resolve sales mismatch');
    return { success: false, error: error.message };
  }
};

// Function to calculate employee salary
export const calculateEmployeeSalary = async (employeeId: string, startDate: Date, endDate: Date) => {
  try {
    const { data, error } = await supabase.rpc('calculate_employee_salary', {
      p_employee_id: employeeId,
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0]
    });

    if (error) throw error;

    return { success: true, salary: data };
  } catch (error: any) {
    console.error('Error calculating employee salary:', error);
    toast.error(error.message || 'Failed to calculate employee salary');
    return { success: false, error: error.message };
  }
};
