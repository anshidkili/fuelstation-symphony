
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.supabase.com/reference/deno/initialize

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the first available stations for the users
    const { data: stations } = await supabaseClient
      .from('stations')
      .select('id, name')
      .eq('status', 'active')
      .limit(2);
      
    if (!stations || stations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No active stations found. Please create stations first.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Define test users
    const testUsers = [
      {
        email: 'superadmin@fuelsymphony.com',
        password: 'Password123!',
        role: 'Super Admin',
        full_name: 'Super Admin',
      },
      {
        email: 'admin@fuelsymphony.com',
        password: 'Password123!',
        role: 'Admin',
        full_name: 'Station Admin',
        station_id: stations[0].id,
      },
      {
        email: 'employee@fuelsymphony.com',
        password: 'Password123!',
        role: 'Employee',
        full_name: 'Station Employee',
        station_id: stations[0].id,
      },
      {
        email: 'customer@fuelsymphony.com',
        password: 'Password123!',
        role: 'Credit Customer',
        full_name: 'Credit Customer',
        station_id: stations[0].id,
      },
    ];

    const createdUsers = [];

    // Create or update each test user
    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        console.log(`User ${user.email} already exists, updating...`);
        
        // Update existing user
        await supabaseClient
          .from('profiles')
          .update({
            role: user.role,
            full_name: user.full_name,
            station_id: user.station_id,
            status: 'active',
          })
          .eq('email', user.email);

        createdUsers.push({
          email: user.email,
          password: user.password,
          role: user.role,
        });
      } else {
        console.log(`Creating new user: ${user.email}`);
        
        // Create new user
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role,
          },
        });

        if (authError) {
          console.error(`Error creating user ${user.email}:`, authError);
          continue;
        }

        // Update the profile with additional data
        if (authUser?.user) {
          await supabaseClient
            .from('profiles')
            .update({
              role: user.role,
              station_id: user.station_id,
              status: 'active',
            })
            .eq('user_id', authUser.user.id);
        }

        createdUsers.push({
          email: user.email,
          password: user.password,
          role: user.role,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test users created successfully',
        users: createdUsers
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating test users:', error);
    
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
