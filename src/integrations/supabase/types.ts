export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          status: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      automated_messages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          template_id: string | null
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_id?: string | null
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_id?: string | null
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          automation_type: string
          contact_id: string | null
          created_at: string
          error_message: string | null
          highlevel_response: Json | null
          id: string
          status: string
          trigger_data: Json | null
        }
        Insert: {
          automation_type: string
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          highlevel_response?: Json | null
          id?: string
          status?: string
          trigger_data?: Json | null
        }
        Update: {
          automation_type?: string
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          highlevel_response?: Json | null
          id?: string
          status?: string
          trigger_data?: Json | null
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          absent_days_threshold: number
          booked_lead: boolean
          created_at: string
          id: string
          member_absent: boolean
          member_cancelled: boolean
          member_current: boolean
          member_delinquent: boolean
          member_present: boolean
          member_signed: boolean
          updated_at: string
        }
        Insert: {
          absent_days_threshold?: number
          booked_lead?: boolean
          created_at?: string
          id?: string
          member_absent?: boolean
          member_cancelled?: boolean
          member_current?: boolean
          member_delinquent?: boolean
          member_present?: boolean
          member_signed?: boolean
          updated_at?: string
        }
        Update: {
          absent_days_threshold?: number
          booked_lead?: boolean
          created_at?: string
          id?: string
          member_absent?: boolean
          member_cancelled?: boolean
          member_current?: boolean
          member_delinquent?: boolean
          member_present?: boolean
          member_signed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      belt_tests: {
        Row: {
          created_at: string
          current_belt: string
          evaluated_by: string | null
          id: string
          notes: string | null
          result: string | null
          status: string
          student_id: string
          target_belt: string
          test_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_belt: string
          evaluated_by?: string | null
          id?: string
          notes?: string | null
          result?: string | null
          status?: string
          student_id: string
          target_belt: string
          test_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_belt?: string
          evaluated_by?: string | null
          id?: string
          notes?: string | null
          result?: string | null
          status?: string
          student_id?: string
          target_belt?: string
          test_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_group: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instructor_id: string | null
          is_active: boolean | null
          max_students: number | null
          name: string
          skill_level: string | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          max_students?: number | null
          name: string
          skill_level?: string | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          max_students?: number | null
          name?: string
          skill_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          contact_id: string
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          sent_at: string
          sent_by: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
          sent_at?: string
          sent_by?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sent_at?: string
          sent_by?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_activities: {
        Row: {
          activity_data: Json | null
          activity_description: string | null
          activity_title: string
          activity_type: string
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_description?: string | null
          activity_title: string
          activity_type: string
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          activity_data?: Json | null
          activity_description?: string | null
          activity_title?: string
          activity_type?: string
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_imports: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_imports: number
          file_name: string
          id: string
          import_status: string
          imported_by: string | null
          successful_imports: number
          total_records: number
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_imports: number
          file_name: string
          id?: string
          import_status?: string
          imported_by?: string | null
          successful_imports: number
          total_records: number
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_imports?: number
          file_name?: string
          id?: string
          import_status?: string
          imported_by?: string | null
          successful_imports?: number
          total_records?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean
          subject: string
          template_name: string
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean
          subject: string
          template_name: string
          template_type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_name?: string
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          notes: string | null
          payment_status: string | null
          registration_date: string
          status: string
          student_id: string
        }
        Insert: {
          event_id: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_date?: string
          status?: string
          student_id: string
        }
        Update: {
          event_id?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_date?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          location: string | null
          max_participants: number | null
          registration_fee: number | null
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          location?: string | null
          max_participants?: number | null
          registration_fee?: number | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          registration_fee?: number | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      export_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          download_url: string | null
          export_type: string
          exported_by: string | null
          file_name: string
          file_size: number | null
          id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          download_url?: string | null
          export_type: string
          exported_by?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          download_url?: string | null
          export_type?: string
          exported_by?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      family_discounts: {
        Row: {
          created_at: string
          discount_amount: number | null
          discount_percentage: number
          family_name: string
          id: string
          is_active: boolean
          max_family_members: number | null
          notes: string | null
          primary_student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          discount_percentage: number
          family_name: string
          id?: string
          is_active?: boolean
          max_family_members?: number | null
          notes?: string | null
          primary_student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number
          family_name?: string
          id?: string
          is_active?: boolean
          max_family_members?: number | null
          notes?: string | null
          primary_student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_relationships: {
        Row: {
          created_at: string
          id: string
          is_emergency_contact: boolean | null
          notes: string | null
          primary_contact_id: string
          related_contact_id: string
          relationship_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_emergency_contact?: boolean | null
          notes?: string | null
          primary_contact_id: string
          related_contact_id: string
          relationship_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_emergency_contact?: boolean | null
          notes?: string | null
          primary_contact_id?: string
          related_contact_id?: string
          relationship_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_relationships_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_relationships_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          file_url: string | null
          generated_at: string
          generated_by: string | null
          id: string
          net_income: number | null
          period_end: string
          period_start: string
          report_data: Json | null
          report_type: string
          tax_amount: number | null
          total_expenses: number | null
          total_revenue: number
        }
        Insert: {
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          net_income?: number | null
          period_end: string
          period_start: string
          report_data?: Json | null
          report_type: string
          tax_amount?: number | null
          total_expenses?: number | null
          total_revenue: number
        }
        Update: {
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          net_income?: number | null
          period_end?: string
          period_start?: string
          report_data?: Json | null
          report_type?: string
          tax_amount?: number | null
          total_expenses?: number | null
          total_revenue?: number
        }
        Relationships: []
      }
      highlevel_config: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          is_connected: boolean
          subaccount_id: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          subaccount_id?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          subaccount_id?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          created_at: string
          current_stock: number
          description: string | null
          id: string
          location: string | null
          max_stock_level: number
          min_stock_level: number
          name: string
          selling_price: number
          sku: string
          status: string
          supplier: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          location?: string | null
          max_stock_level?: number
          min_stock_level?: number
          name: string
          selling_price?: number
          sku: string
          status?: string
          supplier?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          location?: string | null
          max_stock_level?: number
          min_stock_level?: number
          name?: string
          selling_price?: number
          sku?: string
          status?: string
          supplier?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          line_items: Json | null
          notes: string | null
          status: string
          stripe_invoice_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          line_items?: Json | null
          notes?: string | null
          status?: string
          stripe_invoice_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json | null
          notes?: string | null
          status?: string
          stripe_invoice_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      late_fees: {
        Row: {
          applied_at: string | null
          created_at: string
          days_overdue: number
          fee_percentage: number | null
          id: string
          late_fee_amount: number
          original_amount: number
          payment_id: string
          reason: string | null
          status: string
          student_id: string
          waived_at: string | null
          waived_by: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          days_overdue: number
          fee_percentage?: number | null
          id?: string
          late_fee_amount: number
          original_amount: number
          payment_id: string
          reason?: string | null
          status?: string
          student_id: string
          waived_at?: string | null
          waived_by?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          days_overdue?: number
          fee_percentage?: number | null
          id?: string
          late_fee_amount?: number
          original_amount?: number
          payment_id?: string
          reason?: string | null
          status?: string
          student_id?: string
          waived_at?: string | null
          waived_by?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          message_type: string
          name: string
          subject: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          message_type: string
          name: string
          subject: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message_type?: string
          name?: string
          subject?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      payment_analytics: {
        Row: {
          average_payment_value: number
          cancelled_memberships: number
          created_at: string
          failed_payments: number
          id: string
          new_memberships: number
          outstanding_amount: number
          payment_conversion_rate: number
          period_end: string
          period_start: string
          refunded_amount: number
          successful_payments: number
          total_payments: number
          total_revenue: number
        }
        Insert: {
          average_payment_value?: number
          cancelled_memberships?: number
          created_at?: string
          failed_payments?: number
          id?: string
          new_memberships?: number
          outstanding_amount?: number
          payment_conversion_rate?: number
          period_end: string
          period_start: string
          refunded_amount?: number
          successful_payments?: number
          total_payments?: number
          total_revenue?: number
        }
        Update: {
          average_payment_value?: number
          cancelled_memberships?: number
          created_at?: string
          failed_payments?: number
          id?: string
          new_memberships?: number
          outstanding_amount?: number
          payment_conversion_rate?: number
          period_end?: string
          period_start?: string
          refunded_amount?: number
          successful_payments?: number
          total_payments?: number
          total_revenue?: number
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expires_at: string | null
          id: string
          link_url: string | null
          paid_at: string | null
          payment_id: string | null
          status: string
          stripe_payment_link_id: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          link_url?: string | null
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          stripe_payment_link_id?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          link_url?: string | null
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          stripe_payment_link_id?: string | null
          student_id?: string
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          interval_count: number
          interval_type: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval_count?: number
          interval_type: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval_count?: number
          interval_type?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          amount: number
          created_at: string
          email_content: string | null
          id: string
          payment_due_date: string
          reminder_type: string
          sent_at: string | null
          sms_content: string | null
          status: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          email_content?: string | null
          id?: string
          payment_due_date: string
          reminder_type: string
          sent_at?: string | null
          sms_content?: string | null
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          email_content?: string | null
          id?: string
          payment_due_date?: string
          reminder_type?: string
          sent_at?: string | null
          sms_content?: string | null
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      payment_schedules: {
        Row: {
          amount: number
          created_at: string
          currency: string
          end_date: string | null
          frequency: string
          id: string
          next_payment_date: string
          notes: string | null
          payment_method: string | null
          start_date: string
          status: string
          stripe_subscription_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          end_date?: string | null
          frequency: string
          id?: string
          next_payment_date: string
          notes?: string | null
          payment_method?: string | null
          start_date: string
          status?: string
          stripe_subscription_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          end_date?: string | null
          frequency?: string
          id?: string
          next_payment_date?: string
          notes?: string | null
          payment_method?: string | null
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          payment_date: string
          payment_method: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          belt_level: string | null
          created_at: string
          email: string
          emergency_contact: string | null
          first_name: string
          id: string
          last_name: string
          membership_status: string
          parent_id: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          belt_level?: string | null
          created_at?: string
          email: string
          emergency_contact?: string | null
          first_name: string
          id: string
          last_name: string
          membership_status?: string
          parent_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          belt_level?: string | null
          created_at?: string
          email?: string
          emergency_contact?: string | null
          first_name?: string
          id?: string
          last_name?: string
          membership_status?: string
          parent_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          interval_count: number | null
          interval_type: string
          is_active: boolean | null
          name: string
          price: number
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval_count?: number | null
          interval_type: string
          is_active?: boolean | null
          name: string
          price: number
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval_count?: number | null
          interval_type?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_late_fees: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_absent_members: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_payment_analytics: {
        Args: { start_date: string; end_date: string }
        Returns: undefined
      }
      update_user_role: {
        Args: { target_user_id: string; new_role: string }
        Returns: boolean
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
