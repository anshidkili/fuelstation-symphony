import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface SalaryResult {
  success: boolean;
  salary: number;
  error?: string;
}

interface MismatchResult {
  success: boolean;
  mismatch: number;
  expected: number;
  actual: number;
  error?: string;
}

interface GenerateReportResult {
  success: boolean;
  reportId?: string;
  error?: string;
}

export interface SalesMismatch {
  id: string;
  shift_id: string;
  expected_amount: number;
  actual_amount: number;
  mismatch_amount: number;
  is_resolved: boolean;
  resolution_note?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  shifts?: {
    profiles?: {
      full_name: string;
    }
  }
}

export interface GetSalesMismatchesResult {
  success: boolean;
  mismatches: SalesMismatch[];
  error?: string;
}

export interface GetSalesMismatchResult {
  success: boolean;
  mismatch?: SalesMismatch;
  error?: string;
}

export interface ResolveMismatchResult {
  success: boolean;
  error?: string;
}

export enum FinancialReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface FinancialReport {
  id: string;
  station_id: string;
  report_type: string;
  report_date: string;
  sales_amount: number;
  expenses_amount: number;
  profit_amount: number;
  created_at: string;
  stations?: {
    name: string;
  }
}

export interface GetFinancialReportsResult {
  success: boolean;
  reports: FinancialReport[];
  error?: string;
}

export const calculateEmployeeSalary = async (
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<SalaryResult> => {
  try {
    // Get the employee's hourly rate
    const { data: employee, error: empError } = await supabase
      .from('profiles')
      .select('hourly_rate')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      return { 
        success: false, 
        salary: 0, 
        error: empError?.message || 'Employee not found' 
      };
    }

    // Calculate total hours worked in the period
    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select('start_time, end_time')
      .eq('employee_id', employeeId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    if (shiftError) {
      return { 
        success: false, 
        salary: 0, 
        error: shiftError.message 
      };
    }

    // Calculate total hours
    let totalHours = 0;
    
    shifts?.forEach(shift => {
      const start = new Date(shift.start_time);
      const end = shift.end_time ? new Date(shift.end_time) : new Date();
      
      // Calculate hours worked in this shift
      const diffMs = end.getTime() - start.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      
      totalHours += diffHrs;
    });
    
    // Calculate salary
    const salary = totalHours * employee.hourly_rate;
    
    return { success: true, salary };
  } catch (error: any) {
    console.error('Error calculating salary:', error);
    return { 
      success: false, 
      salary: 0, 
      error: error.message 
    };
  }
};

export const calculateSalesMismatch = async (
  shiftId: string
): Promise<MismatchResult> => {
  try {
    // Get shift details
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single();
      
    if (shiftError || !shift) {
      return { 
        success: false, 
        mismatch: 0, 
        expected: 0,
        actual: 0,
        error: shiftError?.message || 'Shift not found' 
      };
    }
    
    // Get meter readings for this shift
    const { data: meterReadings, error: mrError } = await supabase
      .from('meter_readings')
      .select('*')
      .eq('shift_id', shiftId);
      
    if (mrError) {
      return { 
        success: false, 
        mismatch: 0, 
        expected: 0,
        actual: 0,
        error: mrError.message 
      };
    }
    
    // Calculate expected sales from meter readings
    let expectedSales = 0;
    
    for (const reading of meterReadings || []) {
      if (reading.end_reading && reading.start_reading) {
        const quantitySold = reading.end_reading - reading.start_reading;
        
        // Get fuel price
        const { data: fuelInventory, error: fiError } = await supabase
          .from('fuel_inventory')
          .select('price_per_liter')
          .eq('fuel_type', reading.fuel_type)
          .eq('station_id', shift.station_id)
          .single();
        
        if (fiError) {
            console.error('Error fetching fuel inventory:', fiError);
            continue;
        }

        if (fuelInventory) {
          expectedSales += quantitySold * fuelInventory.price_per_liter;
        }
      }
    }
    
    // Get actual sales
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('total_amount')
      .eq('shift_id', shiftId);
      
    if (txError) {
      return { 
        success: false, 
        mismatch: 0, 
        expected: 0,
        actual: 0,
        error: txError.message 
      };
    }
    
    const actualSales = transactions?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0;
    
    // Calculate mismatch
    const mismatch = actualSales - expectedSales;
    
    return { 
      success: true, 
      mismatch,
      expected: expectedSales,
      actual: actualSales
    };
  } catch (error: any) {
    console.error('Error calculating sales mismatch:', error);
    return { 
      success: false, 
      mismatch: 0, 
      expected: 0,
      actual: 0,
      error: error.message 
    };
  }
};

export const generateFinancialReport = async (
  stationId: string,
  reportType: string,
  reportDate: Date
): Promise<GenerateReportResult> => {
  try {
    // Validate inputs
    if (!stationId) {
      return {
        success: false,
        error: 'Station ID is required'
      };
    }
    
    if (!['daily', 'monthly', 'yearly'].includes(reportType)) {
      return {
        success: false,
        error: 'Invalid report type'
      };
    }
    
    // Create report record
    const { data, error } = await supabase
      .from('financial_reports')
      .insert({
        station_id: stationId,
        report_type: reportType,
        report_date: format(reportDate, 'yyyy-MM-dd'),
        sales_amount: 0, // Replace with actual calculation
        expenses_amount: 0, // Replace with actual calculation
        profit_amount: 0 // Replace with actual calculation
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      reportId: data?.id
    };
  } catch (error: any) {
    console.error('Error generating financial report:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export const getSalesMismatches = async (
  stationId: string,
  resolved?: boolean
): Promise<GetSalesMismatchesResult> => {
  try {
    let query = supabase
      .from('sales_mismatches')
      .select('*, shifts(*, profiles(full_name))')
      .eq('station_id', stationId);
    
    if (resolved !== undefined) {
      query = query.eq('is_resolved', resolved);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      mismatches: data || []
    };
  } catch (error: any) {
    console.error('Error fetching sales mismatches:', error);
    return {
      success: false,
      mismatches: [],
      error: error.message
    };
  }
};

export const getSalesMismatch = async (id: string): Promise<GetSalesMismatchResult> => {
  try {
    const { data, error } = await supabase
      .from('sales_mismatches')
      .select('*, shifts(*, profiles(full_name))')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      mismatch: data
    };
  } catch (error: any) {
    console.error('Error fetching sales mismatch:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const resolveSalesMismatch = async (
  id: string,
  userId: string,
  resolutionNote: string
): Promise<ResolveMismatchResult> => {
  try {
    const { error } = await supabase
      .from('sales_mismatches')
      .update({
        is_resolved: true,
        resolution_note: resolutionNote,
        resolved_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error resolving sales mismatch:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getFinancialReports = async (
  stationId: string, 
  reportType?: FinancialReportType,
  dateRange?: DateRange
): Promise<GetFinancialReportsResult> => {
  try {
    let query = supabase
      .from('financial_reports')
      .select('*, stations(name)')
      .eq('station_id', stationId);
    
    if (reportType) {
      query = query.eq('report_type', reportType);
    }
    
    if (dateRange?.from) {
      query = query.gte('report_date', format(dateRange.from, 'yyyy-MM-dd'));
      
      if (dateRange.to) {
        query = query.lte('report_date', format(dateRange.to, 'yyyy-MM-dd'));
      }
    }
    
    const { data, error } = await query.order('report_date', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      reports: data || []
    };
  } catch (error: any) {
    console.error('Error fetching financial reports:', error);
    return {
      success: false,
      reports: [],
      error: error.message
    };
  }
};
