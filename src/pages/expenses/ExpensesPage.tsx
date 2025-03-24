
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
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { Calendar, DollarSign, Download, MoreVertical, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Expense } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [expenseType, setExpenseType] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState('list');

  useEffect(() => {
    if (user?.station_id) {
      setStationId(user.station_id);
    }
  }, [user]);

  // Set default date range to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateRange({ from: firstDay, to: lastDay });
  }, []);

  const { data: expenses, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', stationId, dateRange, expenseType],
    queryFn: async () => {
      if (!stationId) return null;
      
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('station_id', stationId)
        .order('date', { ascending: false });
        
      if (dateRange?.from) {
        query = query.gte('date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('date', format(dateRange.to, 'yyyy-MM-dd'));
      }
      
      if (expenseType) {
        query = query.eq('expense_type', expenseType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!stationId,
  });

  const getExpenseChartData = () => {
    if (!expenses) return [];
    
    // Group by expense type
    const expensesByType = expenses.reduce((acc: Record<string, number>, expense) => {
      const type = expense.expense_type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += Number(expense.amount);
      return acc;
    }, {});
    
    return Object.entries(expensesByType).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  };

  const getExpensesByDateChartData = () => {
    if (!expenses) return [];
    
    // Group by date
    const expensesByDate = expenses.reduce((acc: Record<string, number>, expense) => {
      const date = format(new Date(expense.date), 'MMM dd');
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(expense.amount);
      return acc;
    }, {});
    
    return Object.entries(expensesByDate).map(([name, value]) => ({
      name,
      amount: Number(value.toFixed(2))
    }));
  };

  const getTotalExpenses = () => {
    if (!expenses) return 0;
    return expenses.reduce((total, expense) => total + Number(expense.amount), 0).toFixed(2);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (error) {
    toast.error('Failed to load expenses');
    console.error('Error loading expenses:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage all your station expenses
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/expenses/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Management</CardTitle>
          <CardDescription>
            View and analyze your station's expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            </div>
            <div className="w-full md:w-64">
              <label className="text-sm font-medium mb-1 block">Expense Type</label>
              <Select value={expenseType} onValueChange={setExpenseType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All types</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Salary">Salary</SelectItem>
                  <SelectItem value="Taxes">Taxes</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <DollarSign className="h-10 w-10 text-primary p-2 bg-primary/10 rounded-full mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">${getTotalExpenses()}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-10 w-10 text-primary p-2 bg-primary/10 rounded-full mr-4" />
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-md font-medium">
                  {dateRange ? 
                    `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}` : 
                    'All time'}
                </p>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="chart">Chart View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !expenses || expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <DollarSign className="h-12 w-12 text-muted-foreground" />
                  <div className="text-lg font-medium">No expenses found</div>
                  <p className="text-muted-foreground text-center max-w-md">
                    No expenses recorded for the selected filters. Adjust your filters or add a new expense.
                  </p>
                  <Button asChild>
                    <Link to="/expenses/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Expense Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{expense.expense_type}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="text-right font-medium">${Number(expense.amount).toFixed(2)}</TableCell>
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
                                <DropdownMenuItem>
                                  <Link to={`/expenses/${expense.id}`} className="w-full">
                                    Edit expense
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="chart">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getExpenseChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getExpenseChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getExpensesByDateChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                          <Bar dataKey="amount" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
