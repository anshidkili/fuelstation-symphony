
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingStations } = await supabase
      .from("stations")
      .select("id, name")
      .eq("status", "active")
      .limit(2);

    if (!existingStations || existingStations.length < 2) {
      // Create test stations if they don't exist
      const { data: stationData, error: stationError } = await supabase
        .from("stations")
        .insert([
          {
            name: "Downtown Fuel Station",
            address: "123 Main St",
            city: "Cityville",
            state: "State",
            zip: "12345",
            phone: "555-1234",
            email: "downtown@fuelsymphony.com",
            status: "active",
          },
          {
            name: "Uptown Fuel Station",
            address: "456 High St",
            city: "Townsburg",
            state: "State",
            zip: "54321",
            phone: "555-5678",
            email: "uptown@fuelsymphony.com",
            status: "active",
          },
        ])
        .select();

      if (stationError) throw stationError;
    }

    // Get stations again after creation to ensure we have the IDs
    const { data: stations } = await supabase
      .from("stations")
      .select("id, name")
      .eq("status", "active")
      .limit(2);

    if (!stations || stations.length < 2) {
      throw new Error("Failed to find or create stations");
    }

    // Create test users for each role
    const testUsers = [
      {
        email: "superadmin@fuelsymphony.com",
        password: "superadmin123",
        full_name: "Super Admin",
        role: "Super Admin",
        station_id: null,
      },
      {
        email: "admin@fuelsymphony.com",
        password: "admin123",
        full_name: "Station Admin",
        role: "Admin",
        station_id: stations[0].id,
      },
      {
        email: "employee@fuelsymphony.com",
        password: "employee123",
        full_name: "Station Employee",
        role: "Employee",
        station_id: stations[0].id,
      },
      {
        email: "customer@fuelsymphony.com",
        password: "customer123",
        full_name: "Credit Customer",
        role: "Credit Customer",
        station_id: stations[0].id,
      },
    ];

    const results = [];

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        results.push({
          email: user.email,
          status: "already exists",
          role: user.role,
        });
        continue;
      }

      // Create auth user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
      });

      if (error) {
        results.push({
          email: user.email,
          status: "error",
          message: error.message,
        });
        continue;
      }

      // Update profile with additional info
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          station_id: user.station_id,
          status: "active",
        })
        .eq("user_id", data.user.id);

      if (profileError) {
        results.push({
          email: user.email,
          status: "error",
          message: profileError.message,
        });
        continue;
      }

      results.push({
        email: user.email,
        status: "created",
        role: user.role,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test users creation completed",
        users: testUsers.map(u => ({
          email: u.email,
          password: u.password,
          role: u.role,
        })),
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
