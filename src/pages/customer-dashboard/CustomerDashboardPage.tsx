
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
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
import { Badge } from '@/components/ui/badge';
import { format, subMonths } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calendar, Car, CreditCard, DollarSign, Eye, FileText, Fuel, History } from 'lucide-react';
import { toast } from 'sonner';
import { getInvoices } from '@/services/invoiceService';
import { getVehicles, getVehicleFuelConsumption } from '@/services/vehicleService';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setCustomerId(user.id);
    }
  }, [user]);

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ['customer-invoices', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      
      // Get invoices for the last 6 months
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const result = await getInvoices({
        customerId,
        startDate: sixMonthsAgo,
        endDate: new Date()
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.invoices;
    },
    enabled: !!customerId,
  });

  // Fetch vehicles
  const { data: vehicles, isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ['customer-vehicles', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      
      const result = await getVehicles(customerId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // For each vehicle, get fuel consumption data
      const vehiclesWithConsumption = await Promise.all(
        result.vehicles.map(async (vehicle) => {
          const consumptionResult = await getVehicleFuelConsumption(vehicle.id);
          
          return {
            ...vehicle,
            consumption: consumptionResult.success ? consumptionResult.consumption : null
          };
        })
      );
      
      return vehiclesWithConsumption;
    },
    enabled: !!customerId,
  });

  // Prepare data for charts
  const getInvoiceChartData = () => {
    if (!invoices) return [];
    
    // Group by month
    const invoicesByMonth: Record<string, number> = {};
    
    invoices.forEach(invoice => {
      const month = format(new Date(invoice.issue_date), 'MMM yyyy');
      
      if (!invoicesByMonth[month]) {
        invoicesByMonth[month] = 0;
      }
      
      invoicesByMonth[month] += Number(invoice.total_amount);
    });
    
    return Object.entries(invoicesByMonth).map(([month, amount]) => ({
      month,
      amount: Number(amount.toFixed(2))
    }));
  };

  const getVehicleConsumptionChartData = () => {
    if (!vehicles) return [];
    
    return vehicles.map(vehicle => ({
      name: `${vehicle.make} ${vehicle.model}`,
      value: vehicle.consumption ? Number(vehicle.consumption.totalLiters.toFixed(2)) : 0
    }));
  };

  // Calculate totals
  const calculateTotalInvoiced = () => {
    if (!invoices) return 0;
    
    return invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0).toFixed(2);
  };

  const calculateTotalOutstanding = () => {
    if (!invoices) return 0;
    
    return invoices
      .filter(invoice => invoice.status === 'unpaid' || invoice.status === 'overdue' || invoice.status === 'partially_paid')
      .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)
      .toFixed(2);
  };

  const calculateTotalFuelConsumed = () => {
    if (!vehicles) return 0;
    
    return vehicles
      .reduce((sum, vehicle) => {
        if (vehicle.consumption) {
          return sum + vehicle.consumption.totalLiters;
        }
        return sum;
      }, 0)
      .toFixed(2);
  };

  if (invoicesError) {
    toast.error('Failed to load invoice data');
    console.error('Error loading invoice data:', invoicesError);
  }

  if (vehiclesError) {
    toast.error('Failed to load vehicle data');
    console.error('Error loading vehicle data:', vehiclesError);
  }

  // Access control - only Credit Customers should see this
  if (user?.role !== UserRole.CREDIT_CUSTOMER) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          Only credit customers can access this dashboard.
        </p>
      </div>
    );
  }

  const COLORS = ['#4ade80', '#facc15', '#f87171', '#60a5fa'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">
              ${calculateTotalInvoiced()}
            </div>
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              Last 6 months
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 dark:text-amber-300 flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">
              ${calculateTotalOutstanding()}
            </div>
            <p className="text-amber-600 dark:text-amber-400 text-sm">
              {invoices?.filter(i => i.status !== 'paid').length || 0} unpaid invoices
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-700 dark:text-emerald-300 flex items-center">
              <Fuel className="mr-2 h-5 w-5" />
              Total Fuel Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
              {calculateTotalFuelConsumed()} L
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm">
              Across {vehicles?.length || 0} vehicles
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Your recent invoice history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div className="text-lg font-medium">No invoices found</div>
                <p className="text-muted-foreground text-center max-w-md">
                  You don't have any invoices in the last 6 months.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.slice(0, 5).map((invoice) => {
                      const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';
                      const status = isOverdue ? 'overdue' : invoice.status;
                      
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">${Number(invoice.total_amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                status === 'paid'
                                  ? 'success'
                                  : status === 'overdue'
                                  ? 'destructive'
                                  : 'warning'
                              }
                            >
                              {status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/invoices/${invoice.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
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
            
            <div className="mt-4 flex justify-center">
              <Button variant="outline" asChild>
                <Link to="/invoices">
                  <History className="h-4 w-4 mr-2" />
                  View All Invoices
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
            <CardDescription>
              Your fuel and service expenses over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <div className="text-lg font-medium">No spending data</div>
                <p className="text-muted-foreground text-center max-w-md">
                  You don't have any spending data to visualize.
                </p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getInvoiceChartData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Bar dataKey="amount" name="Amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Vehicles</CardTitle>
            <CardDescription>
              Registered vehicles and fuel consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vehiclesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !vehicles || vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Car className="h-12 w-12 text-muted-foreground" />
                <div className="text-lg font-medium">No vehicles found</div>
                <p className="text-muted-foreground text-center max-w-md">
                  You don't have any registered vehicles yet.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead className="text-right">Consumption (L)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </TableCell>
                        <TableCell>{vehicle.license_plate}</TableCell>
                        <TableCell className="capitalize">{vehicle.fuel_type}</TableCell>
                        <TableCell className="text-right">
                          {vehicle.consumption 
                            ? vehicle.consumption.totalLiters.toFixed(2)
                            : '0.00'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/vehicles/details/${vehicle.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <div className="mt-4 flex justify-center">
              <Button variant="outline" asChild>
                <Link to="/vehicles">
                  <Car className="h-4 w-4 mr-2" />
                  Manage Vehicles
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Fuel Consumption by Vehicle</CardTitle>
            <CardDescription>
              Distribution of fuel usage across your fleet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vehiclesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !vehicles || vehicles.length === 0 || !vehicles.some(v => v.consumption && v.consumption.totalLiters > 0) ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Fuel className="h-12 w-12 text-muted-foreground" />
                <div className="text-lg font-medium">No consumption data</div>
                <p className="text-muted-foreground text-center max-w-md">
                  No fuel consumption data available for your vehicles.
                </p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getVehicleConsumptionChartData().filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getVehicleConsumptionChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} L`, 'Consumption']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment methods and invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6 items-center justify-center py-8">
          <div className="text-center md:text-left md:flex-1 max-w-md">
            <CreditCard className="h-12 w-12 text-primary mx-auto md:mx-0 mb-4" />
            <h3 className="text-xl font-bold mb-2">Easy Invoice Payments</h3>
            <p className="text-muted-foreground mb-4">
              View and pay your invoices online with our secure payment system. 
              Keep track of your payment history and upcoming due dates all in one place.
            </p>
            <Button asChild>
              <Link to="/invoices">
                View & Pay Invoices
              </Link>
            </Button>
          </div>
          
          <div className="hidden md:block border-r border-border h-40"></div>
          
          <div className="text-center md:text-left md:flex-1 max-w-md">
            <Bell className="h-12 w-12 text-primary mx-auto md:mx-0 mb-4" />
            <h3 className="text-xl font-bold mb-2">Payment Reminders</h3>
            <p className="text-muted-foreground mb-4">
              Never miss a payment deadline with our automated reminder system.
              Stay on top of your finances and avoid late fees.
            </p>
            <Button variant="outline" asChild>
              <Link to="/payment-reminders">
                View Reminders
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add missing Bell import
import { Bell } from 'lucide-react';
