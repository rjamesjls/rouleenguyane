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
      bookings: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          daily_price: number
          deposit_amount: number
          end_date: string
          id: string
          owner_id: string
          renter_id: string
          service_fee: number
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          total_amount: number
          total_days: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          daily_price: number
          deposit_amount?: number
          end_date: string
          id?: string
          owner_id: string
          renter_id: string
          service_fee?: number
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          total_amount: number
          total_days: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          daily_price?: number
          deposit_amount?: number
          end_date?: string
          id?: string
          owner_id?: string
          renter_id?: string
          service_fee?: number
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          total_amount?: number
          total_days?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          id: string
          booking_id: string
          type: Database["public"]["Enums"]["inspection_type"]
          mileage: number | null
          fuel_level: number | null
          is_clean: boolean | null
          damages: string | null
          comments: string | null
          contract_snapshot: Json | null
          owner_signature_path: string | null
          owner_signed_at: string | null
          renter_signature_path: string | null
          renter_signed_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          type: Database["public"]["Enums"]["inspection_type"]
          mileage?: number | null
          fuel_level?: number | null
          is_clean?: boolean | null
          damages?: string | null
          comments?: string | null
          contract_snapshot?: Json | null
          owner_signature_path?: string | null
          owner_signed_at?: string | null
          renter_signature_path?: string | null
          renter_signed_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          type?: Database["public"]["Enums"]["inspection_type"]
          mileage?: number | null
          fuel_level?: number | null
          is_clean?: boolean | null
          damages?: string | null
          comments?: string | null
          contract_snapshot?: Json | null
          owner_signature_path?: string | null
          owner_signed_at?: string | null
          renter_signature_path?: string | null
          renter_signed_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          id: string
          inspection_id: string
          path: string
          label: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          path: string
          label?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          path?: string
          label?: string | null
          position?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          paid_at: string | null
          preauth_status: Database["public"]["Enums"]["preauth_status"] | null
          refunded_amount: number | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          paid_at?: string | null
          preauth_status?: Database["public"]["Enums"]["preauth_status"] | null
          refunded_amount?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          paid_at?: string | null
          preauth_status?: Database["public"]["Enums"]["preauth_status"] | null
          refunded_amount?: number | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          key: string
          new_value: Json
          old_value: Json | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          key: string
          new_value: Json
          old_value?: Json | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          key?: string
          new_value?: Json
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          city: string | null
          company_name: string | null
          cover_url: string | null
          created_at: string
          driving_license_verified: boolean
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          siret: string | null
          type: Database["public"]["Enums"]["profile_type"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          city?: string | null
          company_name?: string | null
          cover_url?: string | null
          created_at?: string
          driving_license_verified?: boolean
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          siret?: string | null
          type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          city?: string | null
          company_name?: string | null
          cover_url?: string | null
          created_at?: string
          driving_license_verified?: boolean
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          siret?: string | null
          type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_availability: {
        Row: {
          date: string
          id: string
          is_available: boolean
          reason: string | null
          vehicle_id: string
        }
        Insert: {
          date: string
          id?: string
          is_available?: boolean
          reason?: string | null
          vehicle_id: string
        }
        Update: {
          date?: string
          id?: string
          is_available?: boolean
          reason?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_photos: {
        Row: {
          created_at: string
          id: string
          position: number
          url: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          url: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          url?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          address: string | null
          booking_mode: Database["public"]["Enums"]["booking_mode"]
          brand: string
          category: Database["public"]["Enums"]["vehicle_category"]
          city: string
          color: string | null
          created_at: string
          daily_price: number
          deposit_amount: number | null
          deposit_mode: Database["public"]["Enums"]["deposit_mode"]
          description: string | null
          fuel_type: string | null
          id: string
          insurance_included: boolean
          latitude: number | null
          license_plate: string
          longitude: number | null
          mileage_limit_per_day: number | null
          min_rental_days: number
          model: string
          owner_id: string
          seats: number | null
          status: Database["public"]["Enums"]["vehicle_status"]
          title: string
          transmission: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          address?: string | null
          booking_mode?: Database["public"]["Enums"]["booking_mode"]
          brand: string
          category: Database["public"]["Enums"]["vehicle_category"]
          city: string
          color?: string | null
          created_at?: string
          daily_price: number
          deposit_amount?: number | null
          deposit_mode?: Database["public"]["Enums"]["deposit_mode"]
          description?: string | null
          fuel_type?: string | null
          id?: string
          insurance_included?: boolean
          latitude?: number | null
          license_plate: string
          longitude?: number | null
          mileage_limit_per_day?: number | null
          min_rental_days?: number
          model: string
          owner_id: string
          seats?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          title: string
          transmission?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          address?: string | null
          booking_mode?: Database["public"]["Enums"]["booking_mode"]
          brand?: string
          category?: Database["public"]["Enums"]["vehicle_category"]
          city?: string
          color?: string | null
          created_at?: string
          daily_price?: number
          deposit_amount?: number | null
          deposit_mode?: Database["public"]["Enums"]["deposit_mode"]
          description?: string | null
          fuel_type?: string | null
          id?: string
          insurance_included?: boolean
          latitude?: number | null
          license_plate?: string
          longitude?: number | null
          mileage_limit_per_day?: number | null
          min_rental_days?: number
          model?: string
          owner_id?: string
          seats?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          title?: string
          transmission?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
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
      is_admin: { Args: never; Returns: boolean }
      motif_indisponibilite: {
        Args: { p_vehicle: string; p_debut: string; p_fin: string }
        Returns: string | null
      }
      dates_indisponibles: {
        Args: { p_vehicle: string; p_depuis?: string; p_jusqu_a?: string }
        Returns: { jour: string }[]
      }
      cloturer_locations_expirees: {
        Args: { delai_heures?: number }
        Returns: number
      }
      loueur_stats: {
        Args: { loueur: string }
        Returns: {
          vehicules_en_ligne: number
          vehicules_loues: number
          vehicules_disponibles: number
        }[]
      }
    }
    Enums: {
      booking_mode: "manuel" | "instantane"
      booking_status:
        | "en_attente"
        | "confirmee"
        | "refusee"
        | "annulee"
        | "en_cours"
        | "terminee"
      deposit_mode: "sur_place" | "preauth_stripe"
      inspection_type: "depart" | "retour"
      payment_kind: "location" | "caution_preauth"
      payment_status:
        | "en_attente"
        | "reussi"
        | "echoue"
        | "rembourse"
        | "partiellement_rembourse"
      preauth_status: "autorisee" | "liberee" | "capturee"
      profile_type: "particulier" | "professionnel"
      user_role: "utilisateur" | "admin"
      vehicle_category:
        | "citadine"
        | "berline"
        | "suv"
        | "utilitaire"
        | "moto"
        | "scooter"
        | "autre"
      vehicle_status: "brouillon" | "en_ligne" | "suspendu" | "archive"
      verification_status: "non_verifie" | "en_attente" | "verifie" | "refuse"
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
    Enums: {
      booking_mode: ["manuel", "instantane"],
      booking_status: [
        "en_attente",
        "confirmee",
        "refusee",
        "annulee",
        "en_cours",
        "terminee",
      ],
      deposit_mode: ["sur_place", "preauth_stripe"],
      payment_kind: ["location", "caution_preauth"],
      payment_status: [
        "en_attente",
        "reussi",
        "echoue",
        "rembourse",
        "partiellement_rembourse",
      ],
      preauth_status: ["autorisee", "liberee", "capturee"],
      profile_type: ["particulier", "professionnel"],
      user_role: ["utilisateur", "admin"],
      vehicle_category: [
        "citadine",
        "berline",
        "suv",
        "utilitaire",
        "moto",
        "scooter",
        "autre",
      ],
      vehicle_status: ["brouillon", "en_ligne", "suspendu", "archive"],
      verification_status: ["non_verifie", "en_attente", "verifie", "refuse"],
    },
  },
} as const
