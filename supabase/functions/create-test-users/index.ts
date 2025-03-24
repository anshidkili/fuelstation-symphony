
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Set up CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables for Supabase connection');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Define test users for each role
    const testUsers = [
      {
        email: 'superadmin@fuelsymphony.com',
        password: 'Password123!',
        role: 'Super Admin',
        full_name: 'Super Admin User',
      },
      {
        email: 'admin@fuelsymphony.com',
        password: 'Password123!',
        role: 'Admin',
        full_name: 'Admin User',
      },
      {
        email: 'employee@fuelsymphony.com',
        password: 'Password123!',
        role: 'Employee',
        full_name: 'Employee User',
      },
      {
        email: 'customer@fuelsymphony.com',
        password: 'Password123!',
        role: 'Credit Customer',
        full_name: 'Credit Customer User',
      },
    ];

    // Create or update the users
    const createdUsers = [];

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (existingUser) {
        console.log(`User ${user.email} already exists, skipping creation`);
        createdUsers.push({
          email: user.email,
          password: user.password,
          role: user.role,
        });
        continue;
      }

      // Create the auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
      });

      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError);
        throw authError;
      }
      
      // Get the profiles data to verify it was created by the trigger
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error(`Error fetching profile for ${user.email}:`, profileError);
      } else if (!profileData) {
        console.error(`Profile not created for ${user.email}`);
      } else {
        console.log(`Successfully created user and profile for ${user.email}`);
      }

      // If this is an Admin, assign to first station
      if (user.role === 'Admin') {
        // Get the first station
        const { data: stations } = await supabase
          .from('stations')
          .select('id')
          .eq('status', 'active')
          .limit(1);
          
        if (stations && stations.length > 0) {
          const stationId = stations[0].id;
          
          // Update the profile with the station ID
          await supabase
            .from('profiles')
            .update({ station_id: stationId, status: 'active' })
            .eq('user_id', authUser.user.id);
        }
      }
      
      // If this is an Employee, assign to first station
      if (user.role === 'Employee') {
        // Get the first station
        const { data: stations } = await supabase
          .from('stations')
          .select('id')
          .eq('status', 'active')
          .limit(1);
          
        if (stations && stations.length > 0) {
          const stationId = stations[0].id;
          
          // Update the profile with the station ID and hourly rate
          await supabase
            .from('profiles')
            .update({ 
              station_id: stationId, 
              status: 'active',
              hourly_rate: 15.00
            })
            .eq('user_id', authUser.user.id);
        }
      }

      // Add user to created users list with credentials
      createdUsers.push({
        email: user.email,
        password: user.password,
        role: user.role,
      });
    }

    // Return the created users
    return new Response(
      JSON.stringify({
        success: true,
        users: createdUsers,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating test users:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
