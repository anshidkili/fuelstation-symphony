
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Download, Loader2, PrinterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type FinancialReport = {
  id: string;
  station_id: string;
  report_type: string;
  report_date: string;
  sales_amount: number;
  expenses_amount: number;
  profit_amount: number;
  created_at: string;
  station: {
    id: string;
    name: string;
  };
  transactions?: any[];
  expenses?: any[];
};

export default function FinancialReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['financial-report', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('financial_reports')
        .select(`
          *,
          station:stations(id, name)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      // Get the transaction data for this report
      let transactionQuery = supabase
        .from('transactions')
        .select('*')
        .eq('station_id', data.station_id);
      
      // Get the expense data for this report
      let expenseQuery = supabase
        .from('expenses')
        .select('*')
        .eq('station_id', data.station_id);
      
      if (data.report_type === 'daily') {
        transactionQuery = transactionQuery.eq('created_at::date', data.report_date);
        expenseQuery = expenseQuery.eq('date', data.report_date);
      } else if (data.report_type === 'monthly') {
        const date = parseISO(data.report_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        transactionQuery = transactionQuery
          .gte('created_at', `${year}-${month.toString().padStart(2, '0')}-01`)
          .lt('created_at', month === 12 ? `${year+1}-01-01` : `${year}-${(month+1).toString().padStart(2, '0')}-01`);
          
        expenseQuery = expenseQuery
          .gte('date', `${year}-${month.toString().padStart(2, '0')}-01`)
          .lt('date', month === 12 ? `${year+1}-01-01` : `${year}-${(month+1).toString().padStart(2, '0')}-01`);
      } else if (data.report_type === 'yearly') {
        const year = parseISO(data.report_date).getFullYear();
        
        transactionQuery = transactionQuery
          .gte('created_at', `${year}-01-01`)
          .lt('created_at', `${year+1}-01-01`);
          
        expenseQuery = expenseQuery
          .gte('date', `${year}-01-01`)
          .lt('date', `${year+1}-01-01`);
      }
      
      const [transactionResponse, expenseResponse] = await Promise.all([
        transactionQuery,
        expenseQuery
      ]);
      
      if (transactionResponse.error) throw transactionResponse.error;
      if (expenseResponse.error) throw expenseResponse.error;
      
      return {
        ...data,
        transactions: transactionResponse.data || [],
        expenses: expenseResponse.data || []
      } as FinancialReport;
    },
    enabled: !!id,
  });

  const getReportPeriodFormatted = () => {
    if (!report) return '';
    
    const date = parseISO(report.report_date);
    
    if (report.report_type === 'daily') {
      return format(date, 'MMMM d, yyyy');
    } else if (report.report_type === 'monthly') {
      return format(date, 'MMMM yyyy');
    } else {
      return format(date, 'yyyy');
    }
  };

  // Prepare data for charts
  const getTransactionsChartData = () => {
    if (!report?.transactions) return [];
    
    // Group transactions by payment method
    const paymentMethodCounts: Record<string, number> = {};
    const paymentMethodAmounts: Record<string, number> = {};
    
    report.transactions.forEach(transaction => {
      const method = transaction.payment_method;
      if (!paymentMethodCounts[method]) {
        paymentMethodCounts[method] = 0;
        paymentMethodAmounts[method] = 0;
      }
      paymentMethodCounts[method]++;
      paymentMethodAmounts[method] += Number(transaction.total_amount);
    });
    
    return Object.keys(paymentMethodCounts).map(method => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      count: paymentMethodCounts[method],
      amount: Number(paymentMethodAmounts[method].toFixed(2))
    }));
  };

  const getExpensesChartData = () => {
    if (!report?.expenses) return [];
    
    // Group expenses by type
    const expensesByType: Record<string, number> = {};
    
    report.expenses.forEach(expense => {
      const type = expense.expense_type;
      if (!expensesByType[type]) {
        expensesByType[type] = 0;
      }
      expensesByType[type] += Number(expense.amount);
    });
    
    return Object.keys(expensesByType).map(type => ({
      name: type,
      value: Number(expensesByType[type].toFixed(2))
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (error) {
    toast.error('Failed to load report details');
    console.error('Error loading report details:', error);
  }

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg font-medium">Report not found</div>
        <p className="text-muted-foreground text-center max-w-md">
          The requested financial report could not be found.
        </p>
        <Button onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/reports')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Report</h1>
            <p className="text-muted-foreground">
              {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report - {getReportPeriodFormatted()}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-700 dark:text-emerald-300">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
              ${Number(report.sales_amount).toFixed(2)}
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm">
              {report.transactions?.length || 0} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 dark:text-amber-300">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">
              ${Number(report.expenses_amount).toFixed(2)}
            </div>
            <p className="text-amber-600 dark:text-amber-400 text-sm">
              {report.expenses?.length || 0} expense entries
            </p>
          </CardContent>
        </Card>
        
        <Card className={`${Number(report.profit_amount) >= 0 ? 
          'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : 
          'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`${Number(report.profit_amount) >= 0 ? 
              'text-blue-700 dark:text-blue-300' : 
              'text-red-700 dark:text-red-300'}`}>
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${Number(report.profit_amount) >= 0 ? 
              'text-blue-800 dark:text-blue-200' : 
              'text-red-800 dark:text-red-200'}`}>
              ${Number(report.profit_amount).toFixed(2)}
            </div>
            <p className={`text-sm ${Number(report.profit_amount) >= 0 ? 
              'text-blue-600 dark:text-blue-400' : 
              'text-red-600 dark:text-red-400'}`}>
              {Number(report.sales_amount) > 0 ? 
                `${(Number(report.profit_amount) / Number(report.sales_amount) * 100).toFixed(1)}% profit margin` : 
                'No sales recorded'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Breakdown</CardTitle>
            <CardDescription>Sales by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {getTransactionsChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getTransactionsChartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Bar dataKey="amount" name="Amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground">No transaction data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {getExpensesChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getExpensesChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getExpensesChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground">No expense data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Sales transactions during this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.transactions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions recorded during this period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(report.transactions || []).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell className="capitalize">{transaction.transaction_type}</TableCell>
                    <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                    <TableCell className="text-right">${Number(transaction.total_amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Expenses recorded during this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.expenses?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses recorded during this period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(report.expenses || []).map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{expense.expense_type}</TableCell>
                    <TableCell>{expense.description || '-'}</TableCell>
                    <TableCell className="text-right">${Number(expense.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
