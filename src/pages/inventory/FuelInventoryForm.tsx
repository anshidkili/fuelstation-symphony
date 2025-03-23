
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, FUEL_TYPES } from "@/lib/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  fuel_type: z.string().min(1, {
    message: "Please select a fuel type.",
  }),
  current_stock: z.coerce.number().min(0, {
    message: "Current stock cannot be negative.",
  }),
  capacity: z.coerce.number().min(1, {
    message: "Capacity must be at least 1.",
  }),
  alert_threshold: z.coerce.number().min(1, {
    message: "Alert threshold must be at least 1.",
  }),
  price_per_liter: z.coerce.number().min(0.01, {
    message: "Price per liter must be at least 0.01.",
  }),
  cost_per_liter: z.coerce.number().min(0.01, {
    message: "Cost per liter must be at least 0.01.",
  }),
}).refine(data => data.current_stock <= data.capacity, {
  message: "Current stock cannot exceed capacity",
  path: ["current_stock"],
}).refine(data => data.alert_threshold <= data.capacity, {
  message: "Alert threshold cannot exceed capacity",
  path: ["alert_threshold"],
});

type FormData = z.infer<typeof formSchema>;

export default function FuelInventoryForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [existingFuelTypes, setExistingFuelTypes] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fuel_type: "",
      current_stock: 0,
      capacity: 10000,
      alert_threshold: 1000,
      price_per_liter: 0.01,
      cost_per_liter: 0.01,
    },
  });

  useEffect(() => {
    // Only Admin can access this page
    if (user && user.role !== UserRole.ADMIN) {
      navigate("/");
      toast.error("You don't have permission to access this page");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchExistingFuelTypes = async () => {
      if (!user?.station_id) return;
      
      try {
        const { data, error } = await supabase
          .from("fuel_inventory")
          .select("fuel_type")
          .eq("station_id", user.station_id);

        if (error) throw error;
        
        setExistingFuelTypes(data?.map(item => item.fuel_type) || []);
      } catch (error: any) {
        toast.error(`Error fetching existing fuel types: ${error.message}`);
      }
    };

    fetchExistingFuelTypes();
  }, [user]);

  useEffect(() => {
    const fetchFuelInventory = async () => {
      if (!isEditMode) {
        setFetchingData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("fuel_inventory")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            fuel_type: data.fuel_type || "",
            current_stock: data.current_stock || 0,
            capacity: data.capacity || 10000,
            alert_threshold: data.alert_threshold || 1000,
            price_per_liter: data.price_per_liter || 0.01,
            cost_per_liter: data.cost_per_liter || 0.01,
          });
        }
      } catch (error: any) {
        toast.error(`Error fetching fuel inventory: ${error.message}`);
      } finally {
        setFetchingData(false);
      }
    };

    fetchFuelInventory();
  }, [id, isEditMode, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from("fuel_inventory")
          .update({
            fuel_type: data.fuel_type,
            current_stock: data.current_stock,
            capacity: data.capacity,
            alert_threshold: data.alert_threshold,
            price_per_liter: data.price_per_liter,
            cost_per_liter: data.cost_per_liter,
          })
          .eq("id", id);

        if (error) throw error;

        toast.success("Fuel inventory updated successfully");
      } else {
        // Check if this fuel type already exists for this station
        if (existingFuelTypes.includes(data.fuel_type)) {
          throw new Error(`${data.fuel_type} already exists in your inventory`);
        }

        const { error } = await supabase
          .from("fuel_inventory")
          .insert({
            fuel_type: data.fuel_type,
            current_stock: data.current_stock,
            capacity: data.capacity,
            alert_threshold: data.alert_threshold,
            price_per_liter: data.price_per_liter,
            cost_per_liter: data.cost_per_liter,
            station_id: user?.station_id,
          });

        if (error) throw error;

        toast.success("Fuel inventory added successfully");
      }

      navigate("/inventory/fuel");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit Fuel Inventory" : "Add Fuel Type"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update fuel inventory levels and pricing"
              : "Add a new fuel type to your station's inventory"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fuel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEditMode} // Cannot change fuel type for existing entry
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map((fuelType) => (
                          <SelectItem 
                            key={fuelType.value} 
                            value={fuelType.value}
                            disabled={!isEditMode && existingFuelTypes.includes(fuelType.value)}
                            className={fuelType.color}
                          >
                            {fuelType.label}
                            {!isEditMode && existingFuelTypes.includes(fuelType.value) && " (Already Added)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Select the type of fuel for this inventory item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current_stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Stock (Liters)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="5000" 
                      type="number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The current amount of fuel in storage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (Liters)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="10000" 
                      type="number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The maximum amount of fuel that can be stored
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alert_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Threshold (Liters)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1000" 
                      type="number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Low stock alert will be triggered below this level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_per_liter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price ($ per Liter)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1.50" 
                      type="number" 
                      step="0.01"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The price at which this fuel is sold to customers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost_per_liter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Price ($ per Liter)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1.20" 
                      type="number" 
                      step="0.01"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The price at which this fuel is purchased from suppliers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/inventory/fuel")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditMode ? "Update Fuel Inventory" : "Add Fuel Type"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
