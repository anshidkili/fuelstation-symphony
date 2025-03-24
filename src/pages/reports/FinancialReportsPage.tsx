
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart as BarChartIcon, CalendarRange, Download, FileText, LineChart as LineChartIcon, PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateFinancialReport, getFinancialReports, FinancialReportType } from '@/services/financeService';

export default function FinancialReportsPage() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [reportType, setReportType] = useState<FinancialReportType>('monthly');
  const [tab, setTab] = useState<string>('table');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user?.station_id) {
      setStationId(user.station_id);
    }
  }, [user]);

  // Set default date range to last 3 months
  useEffect(() => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    
    setDateRange({
      from: startOfMonth(threeMonthsAgo),
      to: endOfMonth(today)
    });
  }, []);

  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['financial-reports', stationId, dateRange, reportType],
    queryFn: async () => {
      if (!stationId) return null;
      
      const result = await getFinancialReports(stationId, reportType);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      let filteredReports = result.reports;
      
      if (dateRange?.from && dateRange?.to) {
        filteredReports = filteredReports.filter(report => {
          const reportDate = new Date(report.report_date);
          return reportDate >= dateRange.from && reportDate <= dateRange.to;
        });
      }
      
      return filteredReports;
    },
    enabled: !!stationId,
  });

  const handleGenerateReport = async () => {
    if (!stationId) {
      toast.error('No station selected');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // For monthly/yearly reports, we generate for current period
      let reportDate = new Date();
      
      if (reportType === 'daily') {
        reportDate = new Date(); // Today
      }
      
      const result = await generateFinancialReport(stationId, reportType, reportDate);
      
      if (result.success) {
        refetch();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSalesBarChartData = () => {
    if (!reports) return [];
    
    return reports.map(report => ({
      name: format(new Date(report.report_date), reportType === 'daily' ? 'MMM d' : reportType === 'monthly' ? 'MMM yyyy' : 'yyyy'),
      sales: Number(report.sales_amount),
      expenses: Number(report.expenses_amount),
      profit: Number(report.profit_amount)
    }));
  };

  const getProfitLineChartData = () => {
    if (!reports) return [];
    
    return reports.map(report => ({
      name: format(new Date(report.report_date), reportType === 'daily' ? 'MMM d' : reportType === 'monthly' ? 'MMM yyyy' : 'yyyy'),
      profit: Number(report.profit_amount),
      margin: Number(report.sales_amount) > 0 ? 
        (Number(report.profit_amount) / Number(report.sales_amount) * 100).toFixed(1) : 0
    }));
  };

  const getBreakdownPieChartData = () => {
    if (!reports) return [];
    
    // Aggregate all reports data
    const totalSales = reports.reduce((sum, report) => sum + Number(report.sales_amount), 0);
    const totalExpenses = reports.reduce((sum, report) => sum + Number(report.expenses_amount), 0);
    const totalProfit = reports.reduce((sum, report) => sum + Number(report.profit_amount), 0);
    
    return [
      { name: 'Expenses', value: Number(totalExpenses.toFixed(2)) },
      { name: 'Profit', value: Number(totalProfit.toFixed(2)) }
    ];
  };

  const COLORS = ['#FF8042', '#00C49F'];

  if (error) {
    toast.error('Failed to load financial reports');
    console.error('Error loading financial reports:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            View and generate financial reports for your station
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isLoading || isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            disabled={isLoading || isGenerating}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>
            View and analyze financial performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            </div>
            <div className="w-full md:w-64">
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
            <div className="w-full md:w-auto flex items-end">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <BarChartIcon className="h-10 w-10 text-emerald-500 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">
                  ${reports?.reduce((sum, report) => sum + Number(report.sales_amount), 0).toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <PieChartIcon className="h-10 w-10 text-amber-500 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-full mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">
                  ${reports?.reduce((sum, report) => sum + Number(report.expenses_amount), 0).toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <LineChartIcon className="h-10 w-10 text-blue-500 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-full mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">
                  ${reports?.reduce((sum, report) => sum + Number(report.profit_amount), 0).toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="table">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !reports || reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <CalendarRange className="h-12 w-12 text-muted-foreground" />
                  <div className="text-lg font-medium">No reports found</div>
                  <p className="text-muted-foreground text-center max-w-md">
                    No financial reports available for the selected criteria. Generate a new report or adjust your filters.
                  </p>
                  <Button onClick={handleGenerateReport} disabled={isGenerating}>
                    {isGenerating ? 
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : 
                      <><FileText className="h-4 w-4 mr-2" /> Generate Report</>
                    }
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Report Type</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Profit Margin</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => {
                        const profitMargin = report.sales_amount > 0 
                          ? (report.profit_amount / report.sales_amount * 100).toFixed(1) 
                          : '0.0';
                          
                        return (
                          <TableRow key={report.id}>
                            <TableCell>
                              {format(
                                new Date(report.report_date),
                                reportType === 'daily' 
                                  ? 'MMM d, yyyy' 
                                  : reportType === 'monthly'
                                  ? 'MMMM yyyy'
                                  : 'yyyy'
                              )}
                            </TableCell>
                            <TableCell>
                              {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${Number(report.sales_amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${Number(report.expenses_amount).toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${Number(report.profit_amount) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              ${Number(report.profit_amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {profitMargin}%
                            </TableCell>
                            <TableCell className="text-center">
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/reports/${report.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="charts">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !reports || reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <CalendarRange className="h-12 w-12 text-muted-foreground" />
                  <div className="text-lg font-medium">No data available</div>
                  <p className="text-muted-foreground text-center max-w-md">
                    No financial data available for visualization. Generate a report first.
                  </p>
                  <Button onClick={handleGenerateReport} disabled={isGenerating}>
                    {isGenerating ? 
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : 
                      <><FileText className="h-4 w-4 mr-2" /> Generate Report</>
                    }
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales, Expenses & Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getSalesBarChartData()}>
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
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profit Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getProfitLineChartData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" unit="%" />
                              <Tooltip />
                              <Legend />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="profit" 
                                name="Profit ($)" 
                                stroke="#60a5fa" 
                                activeDot={{ r: 8 }} 
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="margin" 
                                name="Profit Margin (%)" 
                                stroke="#8884d8" 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getBreakdownPieChartData()}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {getBreakdownPieChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`$${value}`, '']} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
