
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, FUEL_TYPES } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Plus, 
  Droplet,
  TrendingUp,
  TrendingDown,
  Fuel,
  Edit
} from "lucide-react";

export default function FuelInventoryPage() {
  const [fuelInventory, setFuelInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only Admin can access this page
    if (user && user.role !== UserRole.ADMIN) {
      navigate("/");
      toast.error("You don't have permission to access this page");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchFuelInventory = async () => {
      if (!user?.station_id) return;
      
      try {
        const { data, error } = await supabase
          .from("fuel_inventory")
          .select("*")
          .eq("station_id", user.station_id)
          .order("fuel_type");

        if (error) throw error;
        
        setFuelInventory(data || []);
      } catch (error: any) {
        toast.error(`Error fetching fuel inventory: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFuelInventory();
  }, [user]);

  const handleCreateFuelInventory = () => {
    navigate("/inventory/fuel/new");
  };

  const handleEditFuelInventory = (id: string) => {
    navigate(`/inventory/fuel/${id}`);
  };

  const getFuelTypeName = (type: string) => {
    const fuelType = FUEL_TYPES.find(ft => ft.value === type);
    return fuelType?.label || type;
  };
  
  const getFuelTypeColor = (type: string) => {
    const fuelType = FUEL_TYPES.find(ft => ft.value === type);
    return fuelType?.color || "text-gray-500";
  };

  const getStockPercentage = (current: number, capacity: number) => {
    return Math.min(Math.round((current / capacity) * 100), 100);
  };

  const isLowStock = (current: number, threshold: number) => {
    return current <= threshold;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuel Inventory</h1>
          <p className="text-muted-foreground">
            Manage fuel stock and pricing at your station
          </p>
        </div>
        <Button onClick={handleCreateFuelInventory}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fuel Type
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : fuelInventory.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Fuel className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No fuel inventory found</h3>
          <p className="text-sm text-muted-foreground">
            Get started by adding fuel types to your inventory
          </p>
          <Button onClick={handleCreateFuelInventory} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Fuel Type
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {fuelInventory.map((fuel) => (
              <Card key={fuel.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Droplet className={`mr-2 h-4 w-4 ${getFuelTypeColor(fuel.fuel_type)}`} />
                    {getFuelTypeName(fuel.fuel_type)}
                    {isLowStock(fuel.current_stock, fuel.alert_threshold) && (
                      <AlertTriangle className="ml-2 h-4 w-4 text-destructive" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Current Stock</span>
                      <span>{fuel.current_stock.toLocaleString()} L</span>
                    </div>
                    <Progress 
                      value={getStockPercentage(fuel.current_stock, fuel.capacity)} 
                      className={isLowStock(fuel.current_stock, fuel.alert_threshold) ? "text-destructive" : ""}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Capacity:</span>
                      <p>{fuel.capacity.toLocaleString()} L</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Alert at:</span>
                      <p>{fuel.alert_threshold.toLocaleString()} L</p>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">Sell Price:</span>
                      <p className="ml-1">${fuel.price_per_liter.toFixed(2)}/L</p>
                    </div>
                    <div className="flex items-center">
                      <TrendingDown className="mr-1 h-3 w-3 text-blue-500" />
                      <span className="text-muted-foreground">Cost:</span>
                      <p className="ml-1">${fuel.cost_per_liter.toFixed(2)}/L</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleEditFuelInventory(fuel.id)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fuel Inventory Details</CardTitle>
              <CardDescription>
                Detailed view of all fuel types, stock levels, and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Alert Threshold</TableHead>
                    <TableHead>Price (per L)</TableHead>
                    <TableHead>Cost (per L)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelInventory.map((fuel) => (
                    <TableRow key={fuel.id}>
                      <TableCell className={`font-medium ${getFuelTypeColor(fuel.fuel_type)}`}>
                        {getFuelTypeName(fuel.fuel_type)}
                      </TableCell>
                      <TableCell>{fuel.current_stock.toLocaleString()} L</TableCell>
                      <TableCell>{fuel.capacity.toLocaleString()} L</TableCell>
                      <TableCell>{fuel.alert_threshold.toLocaleString()} L</TableCell>
                      <TableCell>${fuel.price_per_liter.toFixed(2)}</TableCell>
                      <TableCell>${fuel.cost_per_liter.toFixed(2)}</TableCell>
                      <TableCell>
                        {isLowStock(fuel.current_stock, fuel.alert_threshold) ? (
                          <span className="inline-flex items-center text-destructive">
                            <AlertTriangle className="mr-1 h-4 w-4" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-green-500">
                            In Stock
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFuelInventory(fuel.id)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
