
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StationComparisonsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [chartType, setChartType] = useState<string>('sales');

  // Set default date range to last 3 months
  useEffect(() => {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    
    setDateRange({
      from: threeMonthsAgo,
      to: today
    });
  }, []);

  const { data: stations, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stations')
        .select('*');
        
      if (error) throw error;
      return data || [];
    },
    enabled: user?.role === UserRole.SUPER_ADMIN,
  });

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['station-sales', dateRange],
    queryFn: async () => {
      if (!dateRange) return [];
      
      // Get sales totals by station
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          station_id,
          total_amount,
          created_at,
          stations (
            id,
            name
          )
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to ? dateRange.to.toISOString() : new Date().toISOString());
        
      if (error) throw error;
      
      // Aggregate data by station
      const stationSalesData: Record<string, { stationId: string, stationName: string, totalSales: number }> = {};
      
      data?.forEach(transaction => {
        const stationId = transaction.station_id;
        const stationName = transaction.stations?.name || 'Unknown Station';
        
        if (!stationSalesData[stationId]) {
          stationSalesData[stationId] = {
            stationId,
            stationName,
            totalSales: 0
          };
        }
        
        stationSalesData[stationId].totalSales += Number(transaction.total_amount || 0);
      });
      
      return Object.values(stationSalesData);
    },
    enabled: !!dateRange && user?.role === UserRole.SUPER_ADMIN,
  });

  const { data: fuelData, isLoading: loadingFuel } = useQuery({
    queryKey: ['station-fuel', dateRange],
    queryFn: async () => {
      if (!dateRange) return [];
      
      // Get fuel sales by station
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          station_id,
          stations (
            id,
            name
          ),
          transaction_items (
            item_type,
            item_id,
            quantity
          )
        `)
        .eq('transaction_items.item_type', 'fuel')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to ? dateRange.to.toISOString() : new Date().toISOString());
        
      if (error) throw error;
      
      // Aggregate data by station
      const stationFuel: Record<string, { stationId: string, stationName: string, totalLiters: number }> = {};
      
      data?.forEach(transaction => {
        const stationId = transaction.station_id;
        const stationName = transaction.stations?.name || 'Unknown Station';
        
        if (!stationFuel[stationId]) {
          stationFuel[stationId] = {
            stationId,
            stationName,
            totalLiters: 0
          };
        }
        
        transaction.transaction_items?.forEach((item: any) => {
          if (item.item_type === 'fuel') {
            stationFuel[stationId].totalLiters += Number(item.quantity || 0);
          }
        });
      });
      
      return Object.values(stationFuel);
    },
    enabled: !!dateRange && user?.role === UserRole.SUPER_ADMIN,
  });

  const getSalesChartData = () => {
    return salesData?.map(station => ({
      name: station.stationName,
      sales: Number((station.totalSales || 0).toFixed(2))
    })) || [];
  };

  const getFuelChartData = () => {
    return fuelData?.map(station => ({
      name: station.stationName,
      liters: Number((station.totalLiters || 0).toFixed(2))
    })) || [];
  };

  const getExpenseChartData = () => {
    // This would be calculated from actual expense data
    return [];
  };

  if (user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          Only Super Admins can access the analytics.
        </p>
      </div>
    );
  }

  const isLoading = loadingStations || loadingSales || loadingFuel;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Station Analytics</h1>
        <p className="text-muted-foreground">
          Compare performance across stations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Period</CardTitle>
          <CardDescription>
            Select a date range to compare station performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatePickerWithRange value={dateRange} onChange={setDateRange} />
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" onValueChange={setChartType}>
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Volumes</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Comparison</CardTitle>
              <CardDescription>
                Total sales by station for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : salesData?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="text-lg font-medium">No sales data available</div>
                  <p className="text-muted-foreground text-center max-w-md">
                    There are no sales recorded for the selected period.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getSalesChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`$${value}`, 'Sales']} />
                        <Legend />
                        <Bar dataKey="sales" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Volume Comparison</CardTitle>
              <CardDescription>
                Total fuel liters sold by station for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : fuelData?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="text-lg font-medium">No fuel data available</div>
                  <p className="text-muted-foreground text-center max-w-md">
                    There are no fuel sales recorded for the selected period.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getFuelChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`${value} L`, 'Volume']} />
                        <Legend />
                        <Bar dataKey="liters" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expense Comparison</CardTitle>
              <CardDescription>
                Total expenses by station for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="text-lg font-medium">No expense data available</div>
                <p className="text-muted-foreground text-center max-w-md">
                  Feature under development. Check back soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
