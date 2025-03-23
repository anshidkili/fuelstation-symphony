export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dispensers: {
        Row: {
          created_at: string | null
          fuel_types: string[]
          id: string
          name: string
          station_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fuel_types: string[]
          id?: string
          name: string
          station_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fuel_types?: string[]
          id?: string
          name?: string
          station_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispensers_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          expense_type: string
          id: string
          station_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          expense_type: string
          id?: string
          station_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          expense_type?: string
          id?: string
          station_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_inventory: {
        Row: {
          alert_threshold: number
          capacity: number
          cost_per_liter: number
          created_at: string | null
          current_stock: number
          fuel_type: string
          id: string
          price_per_liter: number
          station_id: string
          updated_at: string | null
        }
        Insert: {
          alert_threshold: number
          capacity: number
          cost_per_liter: number
          created_at?: string | null
          current_stock?: number
          fuel_type: string
          id?: string
          price_per_liter: number
          station_id: string
          updated_at?: string | null
        }
        Update: {
          alert_threshold?: number
          capacity?: number
          cost_per_liter?: number
          created_at?: string | null
          current_stock?: number
          fuel_type?: string
          id?: string
          price_per_liter?: number
          station_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_inventory_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          customer_id: string
          discount: number
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          station_id: string
          status: string
          tax: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          discount?: number
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          station_id: string
          status?: string
          tax?: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          discount?: number
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          station_id?: string
          status?: string
          tax?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          created_at: string | null
          dispenser_id: string
          end_reading: number | null
          fuel_type: string
          id: string
          shift_id: string
          start_reading: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dispenser_id: string
          end_reading?: number | null
          fuel_type: string
          id?: string
          shift_id: string
          start_reading: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dispenser_id?: string
          end_reading?: number | null
          fuel_type?: string
          id?: string
          shift_id?: string
          start_reading?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_dispenser_id_fkey"
            columns: ["dispenser_id"]
            isOneToOne: false
            referencedRelation: "dispensers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          alert_threshold: number
          category: string
          cost: number
          created_at: string | null
          current_stock: number
          id: string
          name: string
          price: number
          station_id: string
          updated_at: string | null
        }
        Insert: {
          alert_threshold: number
          category: string
          cost: number
          created_at?: string | null
          current_stock?: number
          id?: string
          name: string
          price: number
          station_id: string
          updated_at?: string | null
        }
        Update: {
          alert_threshold?: number
          category?: string
          cost?: number
          created_at?: string | null
          current_stock?: number
          id?: string
          name?: string
          price?: number
          station_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          contact_number: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          role: string
          station_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          role: string
          station_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          role?: string
          station_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          dispensers: string[]
          employee_id: string
          end_time: string | null
          ending_cash: number | null
          id: string
          notes: string | null
          start_time: string
          starting_cash: number
          station_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dispensers: string[]
          employee_id: string
          end_time?: string | null
          ending_cash?: number | null
          id?: string
          notes?: string | null
          start_time: string
          starting_cash: number
          station_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dispensers?: string[]
          employee_id?: string
          end_time?: string | null
          ending_cash?: number | null
          id?: string
          notes?: string | null
          start_time?: string
          starting_cash?: number
          station_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          status: string
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          quantity: number
          total_price: number
          transaction_id: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          quantity: number
          total_price: number
          transaction_id: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number
          total_price?: number
          transaction_id?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          payment_method: string
          shift_id: string
          station_id: string
          status: string
          total_amount: number
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          payment_method: string
          shift_id: string
          station_id: string
          status?: string
          total_amount: number
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          payment_method?: string
          shift_id?: string
          station_id?: string
          status?: string
          total_amount?: number
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          customer_id: string
          fuel_type: string
          id: string
          license_plate: string
          make: string
          model: string
          updated_at: string | null
          year: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          fuel_type: string
          id?: string
          license_plate: string
          make: string
          model: string
          updated_at?: string | null
          year: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          fuel_type?: string
          id?: string
          license_plate?: string
          make?: string
          model?: string
          updated_at?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_station_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_fuel_inventory: {
        Args: {
          p_fuel_id: string
          p_quantity: number
        }
        Returns: undefined
      }
      update_product_inventory: {
        Args: {
          p_product_id: string
          p_quantity: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
