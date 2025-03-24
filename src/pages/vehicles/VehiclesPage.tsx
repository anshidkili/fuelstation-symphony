
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Car, CarFront, Eye, MoreVertical, Plus, RefreshCw, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { getVehicles, deleteVehicle } from '@/services/vehicleService';

export default function VehiclesPage() {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setCustomerId(user.id);
    }
  }, [user]);

  const { data: vehicles, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      
      const result = await getVehicles(customerId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.vehicles;
    },
    enabled: !!customerId,
  });

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        const result = await deleteVehicle(vehicleId);
        
        if (result.success) {
          toast.success('Vehicle deleted successfully');
          refetch();
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        console.error('Error deleting vehicle:', error);
        toast.error(error.message || 'Failed to delete vehicle');
      }
    }
  };

  if (error) {
    toast.error('Failed to load vehicles');
    console.error('Error loading vehicles:', error);
  }

  // Access control - only Credit Customers should see this
  if (user?.role !== UserRole.CREDIT_CUSTOMER) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="text-2xl font-bold">Access Denied</div>
        <p className="text-muted-foreground text-center max-w-md">
          Only credit customers can access vehicle management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your registered vehicles
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/vehicles/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Management</CardTitle>
          <CardDescription>
            Add and manage your registered vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !vehicles || vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Car className="h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No vehicles found</div>
              <p className="text-muted-foreground text-center max-w-md">
                You haven't registered any vehicles yet. Add a vehicle to track your fuel consumption.
              </p>
              <Button asChild>
                <Link to="/vehicles/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Make & Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>{vehicle.license_plate}</TableCell>
                      <TableCell className="capitalize">{vehicle.fuel_type}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/vehicles/details/${vehicle.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link to={`/vehicles/${vehicle.id}`}>
                                  Edit vehicle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                              >
                                Delete vehicle
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
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
          <CardTitle>Why Register Your Vehicles?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <CarFront className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Track Consumption</h3>
              <p className="text-muted-foreground">
                Monitor fuel usage for each vehicle in your fleet to optimize efficiency and reduce costs.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <ChartPieIcon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Detailed Analytics</h3>
              <p className="text-muted-foreground">
                Get insights into your fleet's performance and identify opportunities for improvement.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <ReportIcon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Usage Reports</h3>
              <p className="text-muted-foreground">
                Access comprehensive reports on fuel consumption and spending for business accounting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add missing icons
import { PieChart as ChartPieIcon, FileText as ReportIcon } from 'lucide-react';
