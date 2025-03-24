
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format, subMonths } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getAllStationsFinancialSummary, FinancialReportType } from '@/services/financeService';

export default function StationComparisonsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [reportType, setReportType] = useState<FinancialReportType>('monthly');
  const [chartType, setChartType] = useState<string>('sales');

  // Set default date range to last 6 months
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    
    setDateRange({
      from: sixMonthsAgo,
      to: today
    });
  }, []);

  const { data: stationReports, isLoading, error, refetch } = useQuery({
    queryKey: ['station-comparison', dateRange, reportType],
    queryFn: async () => {
      if (user?.role !== UserRole.SUPER_ADMIN) {
        toast.error('Only Super Admins can access this page');
        throw new Error('Unauthorized');
      }
      
      const result = await getAllStationsFinancialSummary(reportType, dateRange);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Process the data to be suitable for charts
      // Group by station and then by date
      const stationData: Record<string, any> = {};
      
      result.reports.forEach(report => {
        const stationName = report.stations?.name || 'Unknown';
        const reportDate = format(
          new Date(report.report_date), 
          reportType === 'daily' ? 'MMM d' : reportType === 'monthly' ? 'MMM yyyy' : 'yyyy'
        );
        
        if (!stationData[stationName]) {
          stationData[stationName] = {
            name: stationName,
            stationId: report.stations?.id,
            dates: {}
          };
        }
        
        if (!stationData[stationName].dates[reportDate]) {
          stationData[stationName].dates[reportDate] = {
            sales: 0,
            expenses: 0,
            profit: 0
          };
        }
        
        stationData[stationName].dates[reportDate].sales += Number(report.sales_amount);
        stationData[stationName].dates[reportDate].expenses += Number(report.expenses_amount);
        stationData[stationName].dates[reportDate].profit += Number(report.profit_amount);
      });
      
      return stationData;
    },
    enabled: user?.role === UserRole.SUPER_ADMIN,
  });

  const getStationColors = () => {
    const colors = [
      '#4ade80', // green
      '#60a5fa', // blue
      '#f472b6', // pink
      '#facc15', // yellow
      '#a78bfa', // purple
      '#f87171', // red
      '#38bdf8', // sky
      '#fbbf24', // amber
    ];
    
    const stationColors: Record<string, string> = {};
    
    if (stationReports) {
      Object.keys(stationReports).forEach((station, index) => {
        stationColors[station] = colors[index % colors.length];
      });
    }
    
    return stationColors;
  };

  const getChartData = () => {
    if (!stationReports) return [];
    
    // Get all unique dates across all stations
    const allDates = new Set<string>();
    Object.values(stationReports).forEach(station => {
      Object.keys(station.dates).forEach(date => allDates.add(date));
    });
    
    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    // Create data points for each date
    return sortedDates.map(date => {
      const dataPoint: Record<string, any> = { name: date };
      
      Object.entries(stationReports).forEach(([stationName, stationData]: [string, any]) => {
        if (stationData.dates[date]) {
          dataPoint[`${stationName}_sales`] = stationData.dates[date].sales;
          dataPoint[`${stationName}_expenses`] = stationData.dates[date].expenses;
          dataPoint[`${stationName}_profit`] = stationData.dates[date].profit;
        } else {
          dataPoint[`${stationName}_sales`] = 0;
          dataPoint[`${stationName}_expenses`] = 0;
          dataPoint[`${stationName}_profit`] = 0;
        }
      });
      
      return dataPoint;
    });
  };

  const getTotalsByStation = () => {
    if (!stationReports) return [];
    
    return Object.entries(stationReports).map(([stationName, stationData]: [string, any]) => {
      const totalSales = Object.values(stationData.dates).reduce(
        (sum: number, dateData: any) => sum + dateData.sales, 0
      );
      
      const totalExpenses = Object.values(stationData.dates).reduce(
        (sum: number, dateData: any) => sum + dateData.expenses, 0
      );
      
      const totalProfit = Object.values(stationData.dates).reduce(
        (sum: number, dateData: any) => sum + dateData.profit, 0
      );
      
      return {
        name: stationName,
        sales: Number(totalSales.toFixed(2)),
        expenses: Number(totalExpenses.toFixed(2)),
        profit: Number(totalProfit.toFixed(2)),
      };
    });
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!stationReports || Object.keys(stationReports).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="text-lg font-medium">No data available</div>
          <p className="text-muted-foreground text-center max-w-md">
            No financial data available for comparison. Please generate reports for stations first.
          </p>
        </div>
      );
    }
    
    const chartData = getChartData();
    const totalsByStation = getTotalsByStation();
    const stationColors = getStationColors();
    
    if (chartType === 'summary') {
      return (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totalsByStation}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, '']} />
              <Legend />
              <Bar dataKey="sales" name="Sales" fill="#4ade80" />
              <Bar dataKey="expenses" name="Expenses" fill="#f87171" />
              <Bar dataKey="profit" name="Profit" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    
    if (chartType === 'sales') {
      return (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, '']} />
              <Legend />
              {Object.entries(stationReports).map(([stationName, stationData]: [string, any]) => (
                <Line
                  key={stationName}
                  type="monotone"
                  dataKey={`${stationName}_sales`}
                  name={`${stationName} Sales`}
                  stroke={stationColors[stationName]}
                  activeDot={{ r: 8 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    
    if (chartType === 'expenses') {
      return (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, '']} />
              <Legend />
              {Object.entries(stationReports).map(([stationName, stationData]: [string, any]) => (
                <Line
                  key={stationName}
                  type="monotone"
                  dataKey={`${stationName}_expenses`}
                  name={`${stationName} Expenses`}
                  stroke={stationColors[stationName]}
                  activeDot={{ r: 8 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    
    if (chartType === 'profit') {
      return (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, '']} />
              <Legend />
              {Object.entries(stationReports).map(([stationName, stationData]: [string, any]) => (
                <Line
                  key={stationName}
                  type="monotone"
                  dataKey={`${stationName}_profit`}
                  name={`${stationName} Profit`}
                  stroke={stationColors[stationName]}
                  activeDot={{ r: 8 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }
    
    // Pie chart for overall performance comparison
    if (chartType === 'pie') {
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
      
      return (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={totalsByStation}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey={chartType === 'pie-sales' ? 'sales' : 'profit'}
              >
                {totalsByStation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value}`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }
  };

  if (error) {
    toast.error('Failed to load station comparison data');
    console.error('Error loading station comparison data:', error);
  }

  // Only Super Admin can access this page
  if (user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          Only Super Admins can access the station comparison analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Station Performance</h1>
          <p className="text-muted-foreground">
            Compare financial performance across all stations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Station Comparison</CardTitle>
          <CardDescription>
            Compare financial metrics across all stations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Report Type</label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as FinancialReportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Chart Type</label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Bar Chart</SelectItem>
                  <SelectItem value="sales">Sales Comparison</SelectItem>
                  <SelectItem value="expenses">Expenses Comparison</SelectItem>
                  <SelectItem value="profit">Profit Comparison</SelectItem>
                  <SelectItem value="pie">Market Share (Profit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md mb-6">
            <div className="text-sm text-muted-foreground mb-1">Period</div>
            <div className="text-lg font-medium">
              {dateRange ? 
                `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}` : 
                'All time'}
            </div>
          </div>

          {renderChart()}
          
          {!isLoading && stationReports && Object.keys(stationReports).length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Station Performance Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTotalsByStation().map((station) => (
                  <Card key={station.name} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{station.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Sales:</span>
                        <span className="font-medium">${station.sales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Expenses:</span>
                        <span className="font-medium">${station.expenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Profit:</span>
                        <span className={`font-medium ${station.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          ${station.profit.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Margin:</span>
                        <span className={`font-medium ${station.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {station.sales > 0 ? 
                            `${(station.profit / station.sales * 100).toFixed(1)}%` : 
                            'N/A'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
