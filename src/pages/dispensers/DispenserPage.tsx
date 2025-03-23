
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Edit, MoreHorizontal, Plus, Fuel } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DispenserPage() {
  const [dispensers, setDispensers] = useState<any[]>([]);
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
    const fetchDispensers = async () => {
      if (!user?.station_id) return;
      
      try {
        const { data, error } = await supabase
          .from("dispensers")
          .select("*")
          .eq("station_id", user.station_id)
          .order("name");

        if (error) throw error;
        
        setDispensers(data || []);
      } catch (error: any) {
        toast.error(`Error fetching dispensers: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDispensers();
  }, [user]);

  const handleCreateDispenser = () => {
    navigate("/dispensers/new");
  };

  const handleEditDispenser = (id: string) => {
    navigate(`/dispensers/${id}`);
  };

  const updateDispenserStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("dispensers")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setDispensers(
        dispensers.map((dispenser) =>
          dispenser.id === id ? { ...dispenser, status } : dispenser
        )
      );

      toast.success(`Dispenser ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(`Error updating dispenser: ${error.message}`);
    }
  };

  const getFuelTypeBadges = (fuelTypes: string[]) => {
    return fuelTypes.map((type) => {
      const fuelType = FUEL_TYPES.find(ft => ft.value === type);
      return (
        <Badge key={type} variant="outline" className={fuelType?.color}>
          {fuelType?.label || type}
        </Badge>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dispensers</h1>
          <p className="text-muted-foreground">
            Manage fuel dispensers at your station
          </p>
        </div>
        <Button onClick={handleCreateDispenser}>
          <Plus className="mr-2 h-4 w-4" />
          Add Dispenser
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : dispensers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Fuel className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No dispensers found</h3>
          <p className="text-sm text-muted-foreground">
            Get started by creating a new dispenser
          </p>
          <Button onClick={handleCreateDispenser} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Dispenser
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Fuel Dispensers</CardTitle>
            <CardDescription>
              View and manage fuel dispensers for your station
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Fuel Types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispensers.map((dispenser) => (
                  <TableRow key={dispenser.id}>
                    <TableCell className="font-medium">{dispenser.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getFuelTypeBadges(dispenser.fuel_types)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            dispenser.status === "active"
                              ? "bg-green-500"
                              : dispenser.status === "maintenance"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          } mr-2`}
                        />
                        {dispenser.status.charAt(0).toUpperCase() + dispenser.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditDispenser(dispenser.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {dispenser.status === "active" ? (
                            <DropdownMenuItem
                              onClick={() => updateDispenserStatus(dispenser.id, "inactive")}
                              className="text-red-500"
                            >
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => updateDispenserStatus(dispenser.id, "active")}
                              className="text-green-500"
                            >
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => updateDispenserStatus(dispenser.id, "maintenance")}
                            className="text-yellow-500"
                          >
                            Set to Maintenance
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
