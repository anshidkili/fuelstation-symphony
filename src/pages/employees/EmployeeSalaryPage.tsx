
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format, addMonths, startOfMonth, endOfMonth, subMonths, differenceInHours, parseISO } from 'date-fns';
import { AlertTriangle, ArrowLeft, Clock, Download, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { calculateEmployeeSalary } from '@/services/financeService';
import { Profile } from '@/lib/supabase';

export default function EmployeeSalaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [periods, setPeriods] = useState<{ label: string; range: { from: Date; to: Date } }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [calculating, setCalculating] = useState(false);
  const [salary, setSalary] = useState<number | null>(null);

  // Set default date range to current month
  useEffect(() => {
    const today = new Date();
    const firstDayCurrentMonth = startOfMonth(today);
    const lastDayCurrentMonth = endOfMonth(today);
    
    // Create common periods
    const periods = [
      {
        label: 'Current Month',
        value: 'current',
        range: { from: firstDayCurrentMonth, to: lastDayCurrentMonth }
      },
      {
        label: 'Previous Month',
        value: 'previous',
        range: { 
          from: startOfMonth(subMonths(today, 1)), 
          to: endOfMonth(subMonths(today, 1))
        }
      },
      {
        label: 'Last 3 Months',
        value: 'last3',
        range: { 
          from: startOfMonth(subMonths(today, 2)), 
          to: lastDayCurrentMonth
        }
      },
      {
        label: 'Custom',
        value: 'custom',
        range: { from: firstDayCurrentMonth, to: lastDayCurrentMonth }
      }
    ];
    
    setPeriods(periods);
    
    // Default to current month
    setDateRange({ from: firstDayCurrentMonth, to: lastDayCurrentMonth });
  }, []);

  useEffect(() => {
    // When period changes, update date range
    if (selectedPeriod !== 'custom') {
      const period = periods.find(p => p.value === selectedPeriod);
      if (period) {
        setDateRange(period.range);
      }
    }
  }, [selectedPeriod, periods]);

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          station:stations(id, name)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      // Get all shifts for this employee in the date range
      let shiftsQuery = supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', id)
        .order('start_time', { ascending: false });
      
      if (dateRange?.from) {
        shiftsQuery = shiftsQuery.gte('start_time', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        shiftsQuery = shiftsQuery.lte('end_time', dateRange.to.toISOString());
      }
      
      const { data: shifts, error: shiftsError } = await shiftsQuery;
      
      if (shiftsError) throw shiftsError;
      
      return {
        ...data,
        shifts: shifts || []
      } as Profile & { shifts: any[], station: any };
    },
    enabled: !!id,
  });

  const handleCalculateSalary = async () => {
    if (!id || !dateRange?.from || !dateRange?.to) {
      toast.error('Please select a valid date range');
      return;
    }
    
    setCalculating(true);
    
    try {
      const result = await calculateEmployeeSalary(id, dateRange.from, dateRange.to);
      
      if (result.success) {
        setSalary(result.salary);
      } else {
        toast.error('Failed to calculate salary');
      }
    } catch (error) {
      console.error('Error calculating salary:', error);
      toast.error('Failed to calculate salary');
    } finally {
      setCalculating(false);
    }
  };

  // Calculate total hours worked manually
  const calculateTotalHours = () => {
    if (!employee?.shifts) return 0;
    
    return employee.shifts.reduce((total, shift) => {
      const startTime = new Date(shift.start_time);
      const endTime = shift.end_time ? new Date(shift.end_time) : new Date();
      
      // Get hours difference
      const hours = differenceInHours(endTime, startTime);
      
      return total + hours;
    }, 0);
  };

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    
    // Reset salary when period changes
    setSalary(null);
  };

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    toast.error('Failed to load employee details');
    console.error('Error loading employee details:', error);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg font-medium">Employee not found</div>
        <p className="text-muted-foreground text-center max-w-md">
          The requested employee could not be found.
        </p>
        <Button onClick={() => navigate('/employees')}>
          Back to Employees
        </Button>
      </div>
    );
  }

  const totalHours = calculateTotalHours();

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/employees')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Salary Calculation</h1>
          <p className="text-muted-foreground">
            Calculate and view salary details for {employee.full_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Salary Details</CardTitle>
            <CardDescription>
              Calculate salary based on hours worked
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Pay Period</label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Date Range</label>
                <DatePickerWithRange
                  value={dateRange}
                  onChange={(range) => {
                    setDateRange(range);
                    setSelectedPeriod('custom');
                    // Reset salary when date range changes
                    setSalary(null);
                  }}
                />
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="text-xl font-medium">
                  ${Number(employee.hourly_rate).toFixed(2)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Hours Worked</p>
                <p className="text-xl font-medium">
                  {totalHours}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Date Range</p>
                <p className="text-sm font-medium">
                  {dateRange ? 
                    `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}` : 
                    'Select dates'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleCalculateSalary} 
                disabled={calculating || !dateRange}
                className="w-full sm:w-auto"
              >
                {calculating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Calculate Salary
              </Button>
            </div>
            
            {salary !== null && (
              <Card className="border-2 border-primary">
                <CardHeader className="bg-primary/5 pb-2">
                  <CardTitle>Calculated Salary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      ${Number(salary).toFixed(2)}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      Based on {totalHours} hours at ${Number(employee.hourly_rate).toFixed(2)}/hour
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardFooter>
              </Card>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{employee.full_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Station</p>
                <p className="font-medium">{employee.station?.name || 'Not assigned'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-medium">{employee.role}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="font-medium">${Number(employee.hourly_rate).toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{employee.status}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Contact Number</p>
                <p className="font-medium">{employee.contact_number || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{employee.email || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shift Records</CardTitle>
          <CardDescription>
            Hours worked during the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!employee.shifts || employee.shifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shifts recorded during this period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employee.shifts.map((shift) => {
                  const startTime = parseISO(shift.start_time);
                  const endTime = shift.end_time ? parseISO(shift.end_time) : new Date();
                  const hours = differenceInHours(endTime, startTime);
                  
                  return (
                    <TableRow key={shift.id}>
                      <TableCell>{format(startTime, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(startTime, 'h:mm a')}</TableCell>
                      <TableCell>
                        {shift.end_time 
                          ? format(parseISO(shift.end_time), 'h:mm a')
                          : 'Not ended'}
                      </TableCell>
                      <TableCell className="text-right">{hours}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${shift.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'}`}>
                          {shift.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
