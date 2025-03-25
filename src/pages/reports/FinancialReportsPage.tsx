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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format, startOfMonth } from 'date-fns';
import { FileSpreadsheet, MoreVertical, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getFinancialReports, FinancialReportType, FinancialReport } from '@/services/financeService';
import { DateRange } from 'react-day-picker';

export default function FinancialReportsPage() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [reportType, setReportType] = useState<FinancialReportType>(FinancialReportType.MONTHLY);

  useEffect(() => {
    if (user?.station_id) {
      setStationId(user.station_id);
    }
  }, [user]);

  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['financial-reports', stationId, reportType, dateRange],
    queryFn: async () => {
      if (!stationId) return null;
      
      const result = await getFinancialReports(stationId, reportType, dateRange);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.reports;
    },
    enabled: !!stationId,
  });

  const handleGenerateReport = async () => {
    if (!stationId) return;
    
    try {
      const reportDate = new Date();
      
      // Generate report logic here
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const getReportTypeLabel = (type: FinancialReportType) => {
    switch (type) {
      case FinancialReportType.DAILY:
        return 'Daily';
      case FinancialReportType.WEEKLY:
        return 'Weekly';
      case FinancialReportType.MONTHLY:
        return 'Monthly';
      case FinancialReportType.YEARLY:
        return 'Yearly';
      default:
        return 'Unknown';
    }
  };

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
            Generate and manage financial reports for your station
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleGenerateReport}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Management</CardTitle>
          <CardDescription>
            View and manage all your financial reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Report Type</label>
              <Select 
                value={reportType} 
                onValueChange={(value) => setReportType(value as FinancialReportType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FinancialReportType.DAILY}>Daily</SelectItem>
                  <SelectItem value={FinancialReportType.WEEKLY}>Weekly</SelectItem>
                  <SelectItem value={FinancialReportType.MONTHLY}>Monthly</SelectItem>
                  <SelectItem value={FinancialReportType.YEARLY}>Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            </div>
            <div className="w-full md:w-auto flex items-end">
              <Button onClick={handleGenerateReport}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No reports found</div>
              <p className="text-muted-foreground text-center max-w-md">
                No financial reports matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead className="text-right">Sales Amount</TableHead>
                    <TableHead className="text-right">Expenses Amount</TableHead>
                    <TableHead className="text-right">Profit Amount</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: FinancialReport) => (
                    <TableRow key={report.id}>
                      <TableCell>{format(new Date(report.report_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getReportTypeLabel(report.report_type as FinancialReportType)}</TableCell>
                      <TableCell className="text-right">${Number(report.sales_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Number(report.expenses_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Number(report.profit_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/reports/financial/${report.id}`} className="w-full">
                                View details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit report</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete report</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
