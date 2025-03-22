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
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          details: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string
          details?: Json
          created_at?: string
        }
      }
      dispensers: {
        Row: {
          id: string
          station_id: string
          name: string
          status: string
          fuel_types: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          station_id: string
          name: string
          status: string
          fuel_types: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          name?: string
          status?: string
          fuel_types?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          station_id: string
          expense_type: string
          amount: number
          date: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          station_id: string
          expense_type: string
          amount: number
          date: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          expense_type?: string
          amount?: number
          date?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      fuel_inventory: {
        Row: {
          id: string
          station_id: string
          fuel_type: string
          current_stock: number
          capacity: number
          alert_threshold: number
          price_per_liter: number
          cost_per_liter: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          station_id: string
          fuel_type: string
          current_stock: number
          capacity: number
          alert_threshold: number
          price_per_liter: number
          cost_per_liter: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          fuel_type?: string
          current_stock?: number
          capacity?: number
          alert_threshold?: number
          price_per_liter?: number
          cost_per_liter?: number
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          customer_id: string
          station_id: string
          invoice_number: string
          issue_date: string
          due_date: string
          total_amount: number
          discount: number
          tax: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          station_id: string
          invoice_number: string
          issue_date: string
          due_date: string
          total_amount: number
          discount: number
          tax: number
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          station_id?: string
          invoice_number?: string
          issue_date?: string
          due_date?: string
          total_amount?: number
          discount?: number
          tax?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      meter_readings: {
        Row: {
          id: string
          shift_id: string
          dispenser_id: string
          fuel_type: string
          start_reading: number
          end_reading: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          dispenser_id: string
          fuel_type: string
          start_reading: number
          end_reading?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          dispenser_id?: string
          fuel_type?: string
          start_reading?: number
          end_reading?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          station_id: string
          name: string
          category: string
          current_stock: number
          alert_threshold: number
          price: number
          cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          station_id: string
          name: string
          category: string
          current_stock: number
          alert_threshold: number
          price: number
          cost: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          name?: string
          category?: string
          current_stock?: number
          alert_threshold?: number
          price?: number
          cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          role: string
          station_id: string | null
          created_at: string
          updated_at: string
          hourly_rate: number | null
          contact_number: string | null
          email: string | null
          address: string | null
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          role: string
          station_id?: string | null
          created_at?: string
          updated_at?: string
          hourly_rate?: number | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          status: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          role?: string
          station_id?: string | null
          created_at?: string
          updated_at?: string
          hourly_rate?: number | null
          contact_number?: string | null
          email?: string | null
          address?: string | null
          status?: string
        }
      }
      shifts: {
        Row: {
          id: string
          station_id: string
          employee_id: string
          start_time: string
          end_time: string | null
          dispensers: string[]
          starting_cash: number
          ending_cash: number | null
          notes: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          station_id: string
          employee_id: string
          start_time: string
          end_time?: string | null
          dispensers: string[]
          starting_cash: number
          ending_cash?: number | null
          notes: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          employee_id?: string
          start_time?: string
          end_time?: string | null
          dispensers?: string[]
          starting_cash?: number
          ending_cash?: number | null
          notes?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      stations: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          zip: string
          phone: string
          email: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          state: string
          zip: string
          phone: string
          email: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          state?: string
          zip?: string
          phone?: string
          email?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          item_type: string
          item_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          item_type: string
          item_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          item_type?: string
          item_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          station_id: string
          shift_id: string
          customer_id: string | null
          transaction_type: string
          payment_method: string
          total_amount: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          station_id: string
          shift_id: string
          customer_id?: string | null
          transaction_type: string
          payment_method: string
          total_amount: number
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          station_id?: string
          shift_id?: string
          customer_id?: string | null
          transaction_type?: string
          payment_method?: string
          total_amount?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          customer_id: string
          make: string
          model: string
          year: string
          license_plate: string
          fuel_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          make: string
          model: string
          year: string
          license_plate: string
          fuel_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          make?: string
          model?: string
          year?: string
          license_plate?: string
          fuel_type?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
