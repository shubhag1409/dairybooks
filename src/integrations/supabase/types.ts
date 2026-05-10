export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_settings: {
        Row: {
          address: string | null
          bank_account_number: string | null
          business_name: string | null
          ca_email: string | null
          email: string | null
          gst_number: string | null
          ifsc_code: string | null
          pan_number: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          business_name?: string | null
          ca_email?: string | null
          email?: string | null
          gst_number?: string | null
          ifsc_code?: string | null
          pan_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          business_name?: string | null
          ca_email?: string | null
          email?: string | null
          gst_number?: string | null
          ifsc_code?: string | null
          pan_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crates: {
        Row: {
          closing_stock: number
          created_at: string
          date: string
          given: number
          id: string
          opening_stock: number
          received: number
          user_id: string
        }
        Insert: {
          closing_stock?: number
          created_at?: string
          date: string
          given?: number
          id?: string
          opening_stock?: number
          received?: number
          user_id: string
        }
        Update: {
          closing_stock?: number
          created_at?: string
          date?: string
          given?: number
          id?: string
          opening_stock?: number
          received?: number
          user_id?: string
        }
        Relationships: []
      }
      customer_crates: {
        Row: {
          created_at: string
          customer_id: string
          date: string
          given: number
          id: string
          note: string | null
          returned: number
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          date?: string
          given?: number
          id?: string
          note?: string | null
          returned?: number
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          date?: string
          given?: number
          id?: string
          note?: string | null
          returned?: number
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          created_at: string
          gst_number: string | null
          id: string
          name: string
          pan_number: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          name: string
          pan_number?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          name?: string
          pan_number?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          product_id: string
          quantity: number
          reason: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          product_id: string
          quantity?: number
          reason: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          product_id?: string
          quantity?: number
          reason?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          hsn_code: string | null
          id: string
          name: string
          offer_buy_qty: number | null
          offer_free_product_id: string | null
          offer_free_qty: number | null
          rate: number
          taxed: boolean
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hsn_code?: string | null
          id?: string
          name: string
          offer_buy_qty?: number | null
          offer_free_product_id?: string | null
          offer_free_qty?: number | null
          rate?: number
          taxed?: boolean
          unit?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hsn_code?: string | null
          id?: string
          name?: string
          offer_buy_qty?: number | null
          offer_free_product_id?: string | null
          offer_free_qty?: number | null
          rate?: number
          taxed?: boolean
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          id: string
          price: number
          product_id: string
          purchase_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          id?: string
          price?: number
          product_id: string
          purchase_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          id?: string
          price?: number
          product_id?: string
          purchase_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          date: string
          id: string
          invoice_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          invoice_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          invoice_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          amount: number
          id: string
          product_id: string
          quantity: number
          sale_id: string
          user_id: string
        }
        Insert: {
          amount?: number
          id?: string
          product_id: string
          quantity?: number
          sale_id: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          id: string
          method: string
          note: string | null
          sale_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          date?: string
          id?: string
          method?: string
          note?: string | null
          sale_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          method?: string
          note?: string | null
          sale_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          date: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
