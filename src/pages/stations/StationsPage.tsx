
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building, Edit, Plus, Trash2 } from "lucide-react";

export default function StationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only Super Admin can access this page
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      navigate("/");
      toast.error("You don't have permission to access this page");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data, error } = await supabase
          .from("stations")
          .select("*")
          .order("name");

        if (error) throw error;
        
        setStations(data || []);
      } catch (error: any) {
        toast.error(`Error fetching stations: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const handleCreateStation = () => {
    navigate("/stations/new");
  };

  const handleEditStation = (id: string) => {
    navigate(`/stations/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stations</h1>
          <p className="text-muted-foreground">
            Manage all fuel stations in your network
          </p>
        </div>
        <Button onClick={handleCreateStation}>
          <Plus className="mr-2 h-4 w-4" />
          Add Station
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : stations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Building className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No stations found</h3>
          <p className="text-sm text-muted-foreground">
            Get started by creating a new station
          </p>
          <Button onClick={handleCreateStation} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Station
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stations.map((station) => (
            <Card key={station.id}>
              <CardHeader className="pb-2">
                <CardTitle>{station.name}</CardTitle>
                <CardDescription>
                  {station.city}, {station.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          station.status === "active"
                            ? "bg-green-500"
                            : station.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        } mr-1`}
                      />
                      {station.status.charAt(0).toUpperCase() +
                        station.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium">{station.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{station.phone}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditStation(station.id)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
