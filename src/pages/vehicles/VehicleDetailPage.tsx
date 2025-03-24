
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Car, Edit, FileText, Fuel, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getVehicleById, getVehicleFuelConsumption } from '@/services/vehicleService';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: vehicleData, isLoading, error } = useQuery({
    queryKey: ['vehicle-details', id],
    queryFn: async () => {
      if (!id) return null;
      
      const vehicleResult = await getVehicleById(id);
      
      if (!vehicleResult.success) {
        throw new Error(vehicleResult.error);
      }
      
      const consumptionResult = await getVehicleFuelConsumption(id);
      
      return {
        vehicle: vehicleResult.vehicle,
        consumption: consumptionResult.success ? consumptionResult.consumption : null
      };
    },
    enabled: !!id,
  });

  if (error) {
    toast.error('Failed to load vehicle details');
    console.error('Error loading vehicle details:', error);
  }

  // Prepare chart data
  const getConsumptionChartData = () => {
    if (!vehicleData?.consumption?.transactions) return [];
    
    // Group by month
    const consumptionByMonth: Record<string, number> = {};
    
    vehicleData.consumption.transactions.forEach((transaction: any) => {
      const month = format(new Date(transaction.transaction.created_at), 'MMM yyyy');
      
      if (!consumptionByMonth[month]) {
        consumptionByMonth[month] = 0;
      }
      
      consumptionByMonth[month] += Number(transaction.quantity);
    });
    
    return Object.entries(consumptionByMonth).map(([month, liters]) => ({
      month,
      liters: Number(liters.toFixed(2))
    }));
  };

  // Access control - only Credit Customers should see this
  if (user?.role !== UserRole.CREDIT_CUSTOMER) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          Only credit customers can view vehicle details.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicleData || !vehicleData.vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg font-medium">Vehicle not found</div>
        <p className="text-muted-foreground text-center max-w-md">
          The requested vehicle could not be found.
        </p>
        <Button onClick={() => navigate('/vehicles')}>
          Back to Vehicles
        </Button>
      </div>
    );
  }

  const { vehicle, consumption } = vehicleData;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/vehicles')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </h1>
          <p className="text-muted-foreground">
            Vehicle Details and Fuel Consumption
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={`/vehicles/${vehicle.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Vehicle
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Make & Model</p>
                <p className="font-medium">{vehicle.make} {vehicle.model}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">License Plate</p>
                <p className="font-medium">{vehicle.license_plate}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Fuel Type</p>
                <p className="font-medium capitalize">{vehicle.fuel_type}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Registered On</p>
                <p className="font-medium">{format(new Date(vehicle.created_at), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fuel Consumption Summary</CardTitle>
            <CardDescription>
              Total fuel usage for this vehicle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md flex flex-col items-center">
                <Fuel className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Total Consumption</p>
                <p className="text-xl font-bold">
                  {consumption?.totalLiters ? consumption.totalLiters.toFixed(2) : '0.00'} L
                </p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md flex flex-col items-center">
                <DollarSign className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">
                  ${consumption?.totalAmount ? consumption.totalAmount.toFixed(2) : '0.00'}
                </p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md flex flex-col items-center">
                <Activity className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">
                  {consumption?.transactions ? consumption.transactions.length : 0}
                </p>
              </div>
            </div>
            
            <div className="h-64">
              {!consumption?.transactions || consumption.transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Fuel className="h-12 w-12 text-muted-foreground" />
                  <div className="text-lg font-medium">No consumption data</div>
                  <p className="text-muted-foreground text-center max-w-md">
                    No fuel consumption data available for this vehicle.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getConsumptionChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} L`, 'Consumption']} />
                    <Bar dataKey="liters" name="Liters" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Transaction History</CardTitle>
          <CardDescription>
            Detailed record of fuel purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!consumption?.transactions || consumption.transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transaction history available for this vehicle.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">Quantity (L)</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumption.transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.transaction.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="capitalize">{vehicle.fuel_type}</TableCell>
                      <TableCell className="text-right">{transaction.quantity.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${transaction.unit_price.toFixed(2)}/L</TableCell>
                      <TableCell className="text-right">${transaction.total_price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Maintenance</CardTitle>
          <CardDescription>
            Track your vehicle maintenance and service history
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            Vehicle maintenance tracking feature will be available soon. 
            You'll be able to record service history, set maintenance reminders, and more.
          </p>
          <Button variant="outline" disabled>
            Enable Maintenance Tracking
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Add missing icons
import { DollarSign, Activity } from 'lucide-react';
