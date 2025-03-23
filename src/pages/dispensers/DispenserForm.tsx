
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
import { Checkbox } from "@/components/ui/checkbox";
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
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  status: z.enum(["active", "inactive", "maintenance"]),
  fuel_types: z.array(z.string()).min(1, {
    message: "Select at least one fuel type.",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function DispenserForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "active",
      fuel_types: [],
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
    const fetchDispenser = async () => {
      if (!isEditMode) {
        setFetchingData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("dispensers")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            name: data.name || "",
            status: data.status as "active" | "inactive" | "maintenance",
            fuel_types: data.fuel_types || [],
          });
        }
      } catch (error: any) {
        toast.error(`Error fetching dispenser: ${error.message}`);
      } finally {
        setFetchingData(false);
      }
    };

    fetchDispenser();
  }, [id, isEditMode, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from("dispensers")
          .update({
            name: data.name,
            status: data.status,
            fuel_types: data.fuel_types,
          })
          .eq("id", id);

        if (error) throw error;

        toast.success("Dispenser updated successfully");
      } else {
        const { error } = await supabase
          .from("dispensers")
          .insert({
            name: data.name,
            status: data.status,
            fuel_types: data.fuel_types,
            station_id: user?.station_id,
          });

        if (error) throw error;

        toast.success("Dispenser created successfully");
      }

      navigate("/dispensers");
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
            {isEditMode ? "Edit Dispenser" : "Create Dispenser"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update dispenser details and settings"
              : "Add a new fuel dispenser to your station"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispenser Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dispenser 1" {...field} />
                  </FormControl>
                  <FormDescription>
                    A unique name to identify this dispenser
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="fuel_types"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Fuel Types</FormLabel>
                  <FormDescription>
                    Select all fuel types available in this dispenser
                  </FormDescription>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {FUEL_TYPES.map((fuelType) => (
                    <FormField
                      key={fuelType.value}
                      control={form.control}
                      name="fuel_types"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={fuelType.value}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(fuelType.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, fuelType.value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== fuelType.value
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className={`font-normal ${fuelType.color}`}>
                              {fuelType.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dispensers")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditMode ? "Update Dispenser" : "Create Dispenser"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
