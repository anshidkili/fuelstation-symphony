import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/constants";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Gauge } from "lucide-react";
import { FUEL_TYPES } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";

// Define the schema for a single meter reading
const meterReadingSchema = z.object({
  dispenser_id: z.string(),
  fuel_type: z.string(),
  start_reading: z.coerce.number().min(0),
  end_reading: z.coerce.number().optional(),
});

// Create a dynamic form schema based on the number of readings
const createFormSchema = (count: number) => {
  const schema: Record<string, any> = {};
  for (let i = 0; i < count; i++) {
    schema[`reading_${i}`] = meterReadingSchema;
  }
  return z.object(schema);
};

export default function MeterReadingsForm() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [shift, setShift] = useState<any>(null);
  const [dispensers, setDispensers] = useState<any[]>([]);
  const [meterReadings, setMeterReadings] = useState<any[]>([]);
  const [formSchema, setFormSchema] = useState(z.object({}));
  
  const isAdmin = user?.role === UserRole.ADMIN;
  const isEmployee = user?.role === UserRole.EMPLOYEE;

  // Initialize form with empty schema, will update after fetching data
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (!user || (!isAdmin && !isEmployee)) {
      navigate("/");
      toast.error("You don't have permission to access this page");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch the shift details first
        const { data: shiftData, error: shiftError } = await supabase
          .from("shifts")
          .select(`
            *,
            profiles(full_name)
          `)
          .eq("id", shiftId)
          .single();

        if (shiftError) throw shiftError;
        
        setShift(shiftData);
        
        // If employee, check if they are assigned to this shift
        if (isEmployee && shiftData.employee_id !== user.id) {
          toast.error("You do not have permission to view this shift");
          navigate("/shifts");
          return;
        }

        // Fetch dispensers used in this shift
        const { data: dispenserData, error: dispenserError } = await supabase
          .from("dispensers")
          .select("*")
          .in("id", shiftData.dispensers || []);

        if (dispenserError) throw dispenserError;
        
        setDispensers(dispenserData || []);

        // Fetch existing meter readings
        const { data: readingsData, error: readingsError } = await supabase
          .from("meter_readings")
          .select("*")
          .eq("shift_id", shiftId);

        if (readingsError) throw readingsError;
        
        setMeterReadings(readingsData || []);

        // Create the form schema and default values based on dispensers and fuel types
        const defaultValues: Record<string, any> = {};
        let readings: any[] = [];
        
        // If we have existing readings, use them
        if (readingsData && readingsData.length > 0) {
          readings = readingsData;
        } else {
          // Otherwise create readings for each dispenser and fuel type
          readings = [];
          dispenserData?.forEach(dispenser => {
            dispenser.fuel_types.forEach((fuelType: string) => {
              readings.push({
                dispenser_id: dispenser.id,
                fuel_type: fuelType,
                start_reading: 0,
                end_reading: undefined,
              });
            });
          });
        }

        // Populate form default values
        readings.forEach((reading, index) => {
          defaultValues[`reading_${index}`] = {
            dispenser_id: reading.dispenser_id,
            fuel_type: reading.fuel_type,
            start_reading: reading.start_reading || 0,
            end_reading: reading.end_reading,
          };
        });

        // Set form schema and reset form with default values
        setFormSchema(createFormSchema(readings.length));
        form.reset(defaultValues);
        
      } catch (error: any) {
        toast.error(`Error fetching data: ${error.message}`);
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, [shiftId, user, navigate, isAdmin, isEmployee]);

  const onSubmit = async (data: any) => {
    setLoading(true);

    try {
      // Extract readings from form data
      const readings = Object.values(data).map((reading: any) => ({
        shift_id: shiftId,
        ...reading,
      }));

      // Check if we're updating existing readings or creating new ones
      if (meterReadings.length > 0) {
        // Update existing readings
        for (let i = 0; i < readings.length; i++) {
          const reading = readings[i] as any;
          const existingReading = meterReadings[i];
          
          if (existingReading) {
            const { error } = await supabase
              .from("meter_readings")
              .update({
                start_reading: reading.start_reading,
                end_reading: reading.end_reading,
              })
              .eq("id", existingReading.id);

            if (error) throw error;
          } else {
            // If there's a new reading, insert it
            const { error } = await supabase
              .from("meter_readings")
              .insert(reading);

            if (error) throw error;
          }
        }
      } else {
        // Insert new readings
        const { error } = await supabase
          .from("meter_readings")
          .insert(readings);

        if (error) throw error;
      }

      toast.success("Meter readings saved successfully");
      navigate(`/shifts/${shiftId}`);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get fuel type display name
  const getFuelTypeName = (fuelType: string) => {
    const fuel = FUEL_TYPES.find(f => f.value === fuelType);
    return fuel ? fuel.label : fuelType;
  };

  // Get dispenser name
  const getDispenserName = (dispenserId: string) => {
    const dispenser = dispensers.find(d => d.id === dispenserId);
    return dispenser ? dispenser.name : dispenserId;
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
          <h1 className="text-2xl font-bold tracking-tight">Meter Readings</h1>
          <p className="text-muted-foreground">
            Record and track fuel dispenser meter readings
          </p>
        </div>
      </div>

      {shift && (
        <Card>
          <CardHeader>
            <CardTitle>Shift Information</CardTitle>
            <CardDescription>
              Meter readings for shift on {format(new Date(shift.start_time), "MMM dd, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Employee</h3>
              <p>{shift.profiles?.full_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Start Time</h3>
              <p>{format(new Date(shift.start_time), "MMM dd, yyyy h:mm a")}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">End Time</h3>
              <p>{shift.end_time ? format(new Date(shift.end_time), "MMM dd, yyyy h:mm a") : "Ongoing"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Dispenser Readings</CardTitle>
              <CardDescription>
                Enter start and end meter readings for each fuel type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.keys(form.getValues()).map((key, index) => {
                  const reading = form.getValues()[key];
                  return (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex items-center gap-2 mb-4">
                        <Gauge className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">
                          {getDispenserName(reading.dispenser_id)} - {getFuelTypeName(reading.fuel_type)}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name={`${key}.start_reading`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Reading</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormDescription>
                                Reading at the start of shift
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`${key}.end_reading`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Reading</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field} 
                                  value={field.value === undefined ? "" : field.value} 
                                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Reading at the end of shift (leave blank for active shifts)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Hidden fields that need to be preserved but not edited */}
                        <input
                          type="hidden"
                          {...form.register(`${key}.dispenser_id`)}
                          value={reading.dispenser_id}
                        />
                        <input
                          type="hidden"
                          {...form.register(`${key}.fuel_type`)}
                          value={reading.fuel_type}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/shifts`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Readings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
