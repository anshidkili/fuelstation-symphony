
# Fuel Symphony - Fuel Station Management System

This is a comprehensive management system for fuel stations, supporting multiple user roles and functionalities.

## Setting Up Supabase Database

1. Create a new Supabase project
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the SQL from `supabase_schema.sql` into a new query
4. Run the query to set up all tables, functions, and security policies
5. Create your first Super Admin user through the Supabase Auth UI or API

## Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase project URL and anon key.

## Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## User Roles

- **Super Admin**: Manages all stations and admins, views system-wide reports
- **Admin**: Manages a specific station, employees, inventory, and finances
- **Employee**: Handles daily operations and sales
- **Credit Customer**: Views invoices and vehicle consumption

## Demo Login Credentials

For testing purposes, the following demo accounts are available:

- **Super Admin**: superadmin@fuelstation.com / password
- **Admin**: admin@fuelstation.com / password
- **Employee**: employee@fuelstation.com / password
- **Credit Customer**: customer@company.com / password

Note: These credentials work even when Supabase is not connected, to facilitate development and testing.

## Features

- Real-time dashboard for each user role
- Complete station management
- Employee shift tracking
- Dispenser and fuel inventory management
- Sales and transaction tracking
- Invoice generation and management
- Financial reporting and analytics
- Credit customer management
- Vehicle tracking and fuel consumption analytics

## License

© 2023 Fuel Symphony. All rights reserved.
