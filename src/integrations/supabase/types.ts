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
      academies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_setup_complete: boolean | null
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string | null
          state: string | null
          timezone: string | null
          updated_at: string
          website_url: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_setup_complete?: boolean | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          website_url?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_setup_complete?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          website_url?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      academy_invitations: {
        Row: {
          academy_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_code: string | null
          inviter_id: string
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invitation_code?: string | null
          inviter_id: string
          role: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_code?: string | null
          inviter_id?: string
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_invitations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_memberships: {
        Row: {
          academy_id: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          academy_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          academy_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_memberships_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_setup_progress: {
        Row: {
          academy_id: string
          completed_at: string
          completed_by: string | null
          id: string
          step_completed: string
        }
        Insert: {
          academy_id: string
          completed_at?: string
          completed_by?: string | null
          id?: string
          step_completed: string
        }
        Update: {
          academy_id?: string
          completed_at?: string
          completed_by?: string | null
          id?: string
          step_completed?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_setup_progress_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_subscriptions: {
        Row: {
          academy_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          features: Json | null
          id: string
          max_instructors: number | null
          max_students: number | null
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          features?: Json | null
          id?: string
          max_instructors?: number | null
          max_students?: number | null
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          features?: Json | null
          id?: string
          max_instructors?: number | null
          max_students?: number | null
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_subscriptions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: true
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_switches: {
        Row: {
          from_academy_id: string | null
          id: string
          ip_address: unknown | null
          switched_at: string | null
          to_academy_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          from_academy_id?: string | null
          id?: string
          ip_address?: unknown | null
          switched_at?: string | null
          to_academy_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          from_academy_id?: string | null
          id?: string
          ip_address?: unknown | null
          switched_at?: string | null
          to_academy_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_switches_from_academy_id_fkey"
            columns: ["from_academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_switches_to_academy_id_fkey"
            columns: ["to_academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      account_credits: {
        Row: {
          amount: number
          balance: number
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          source: string
          source_reference_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          balance?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          source: string
          source_reference_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          source?: string
          source_reference_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_credits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_credits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          academy_id: string | null
          class_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          academy_id?: string | null
          class_id: string
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          status: string
          student_id: string
        }
        Update: {
          academy_id?: string | null
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
            foreignKeyName: "attendance_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
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
      attendance_notifications: {
        Row: {
          academy_id: string
          admin_notification_enabled: boolean | null
          consecutive_absence_threshold: number | null
          created_at: string | null
          id: string
          instructor_notification_enabled: boolean | null
          notification_methods: string[] | null
          notify_absences: boolean | null
          notify_late_arrivals: boolean | null
          parent_notification_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          admin_notification_enabled?: boolean | null
          consecutive_absence_threshold?: number | null
          created_at?: string | null
          id?: string
          instructor_notification_enabled?: boolean | null
          notification_methods?: string[] | null
          notify_absences?: boolean | null
          notify_late_arrivals?: boolean | null
          parent_notification_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          admin_notification_enabled?: boolean | null
          consecutive_absence_threshold?: number | null
          created_at?: string | null
          id?: string
          instructor_notification_enabled?: boolean | null
          notification_methods?: string[] | null
          notify_absences?: boolean | null
          notify_late_arrivals?: boolean | null
          parent_notification_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_notifications_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_streaks: {
        Row: {
          class_id: string
          created_at: string | null
          current_streak: number | null
          id: string
          last_updated_date: string | null
          longest_streak: number | null
          streak_type: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_updated_date?: string | null
          longest_streak?: number | null
          streak_type: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_updated_date?: string | null
          longest_streak?: number | null
          streak_type?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_streaks_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_streaks_student_id_fkey"
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
      billing_cycles: {
        Row: {
          amount_cents: number
          created_at: string
          cycle_end_date: string
          cycle_start_date: string
          discount_applied_cents: number | null
          due_date: string
          failure_reason: string | null
          id: string
          membership_subscription_id: string
          next_retry_date: string | null
          paid_date: string | null
          payment_method: string | null
          retry_count: number | null
          status: string
          stripe_invoice_id: string | null
          tax_amount_cents: number | null
          total_amount_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          cycle_end_date: string
          cycle_start_date: string
          discount_applied_cents?: number | null
          due_date: string
          failure_reason?: string | null
          id?: string
          membership_subscription_id: string
          next_retry_date?: string | null
          paid_date?: string | null
          payment_method?: string | null
          retry_count?: number | null
          status?: string
          stripe_invoice_id?: string | null
          tax_amount_cents?: number | null
          total_amount_cents: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          cycle_end_date?: string
          cycle_start_date?: string
          discount_applied_cents?: number | null
          due_date?: string
          failure_reason?: string | null
          id?: string
          membership_subscription_id?: string
          next_retry_date?: string | null
          paid_date?: string | null
          payment_method?: string | null
          retry_count?: number | null
          status?: string
          stripe_invoice_id?: string | null
          tax_amount_cents?: number | null
          total_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycles_membership_subscription_id_fkey"
            columns: ["membership_subscription_id"]
            isOneToOne: false
            referencedRelation: "membership_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_memberships: {
        Row: {
          channel_id: string
          id: string
          invited_by: string | null
          joined_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_memberships_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_admin_only: boolean | null
          member_count: number | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_admin_only?: boolean | null
          member_count?: number | null
          name: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_admin_only?: boolean | null
          member_count?: number | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          channel_id: string | null
          content: string | null
          created_at: string | null
          dm_channel_id: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          mentioned_users: string[] | null
          message_type: string | null
          parent_message_id: string | null
          sender_id: string
          thread_count: number | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          dm_channel_id?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentioned_users?: string[] | null
          message_type?: string | null
          parent_message_id?: string | null
          sender_id: string
          thread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          dm_channel_id?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentioned_users?: string[] | null
          message_type?: string | null
          parent_message_id?: string | null
          sender_id?: string
          thread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_dm_channel_id_fkey"
            columns: ["dm_channel_id"]
            isOneToOne: false
            referencedRelation: "direct_message_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      check_in_settings: {
        Row: {
          auto_checkout_hours: number | null
          created_at: string | null
          id: string
          kiosk_mode_enabled: boolean | null
          require_class_selection: boolean | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          auto_checkout_hours?: number | null
          created_at?: string | null
          id?: string
          kiosk_mode_enabled?: boolean | null
          require_class_selection?: boolean | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          auto_checkout_hours?: number | null
          created_at?: string | null
          id?: string
          kiosk_mode_enabled?: boolean | null
          require_class_selection?: boolean | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      class_access_permissions: {
        Row: {
          access_type: string
          additional_fee_cents: number | null
          class_id: string
          created_at: string
          id: string
          max_sessions_per_period: number | null
          membership_plan_id: string
          period_type: string | null
        }
        Insert: {
          access_type?: string
          additional_fee_cents?: number | null
          class_id: string
          created_at?: string
          id?: string
          max_sessions_per_period?: number | null
          membership_plan_id: string
          period_type?: string | null
        }
        Update: {
          access_type?: string
          additional_fee_cents?: number | null
          class_id?: string
          created_at?: string
          id?: string
          max_sessions_per_period?: number | null
          membership_plan_id?: string
          period_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_access_permissions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_access_permissions_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          enrollment_type: string | null
          id: string
          membership_subscription_id: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          enrollment_type?: string | null
          id?: string
          membership_subscription_id?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          enrollment_type?: string | null
          id?: string
          membership_subscription_id?: string | null
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
            foreignKeyName: "class_enrollments_membership_subscription_id_fkey"
            columns: ["membership_subscription_id"]
            isOneToOne: false
            referencedRelation: "membership_subscriptions"
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
      class_pack_usage: {
        Row: {
          attendance_id: string | null
          class_pack_id: string
          created_at: string
          id: string
          notes: string | null
          used_date: string
        }
        Insert: {
          attendance_id?: string | null
          class_pack_id: string
          created_at?: string
          id?: string
          notes?: string | null
          used_date?: string
        }
        Update: {
          attendance_id?: string | null
          class_pack_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          used_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_pack_usage_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_pack_usage_class_pack_id_fkey"
            columns: ["class_pack_id"]
            isOneToOne: false
            referencedRelation: "class_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      class_packs: {
        Row: {
          auto_renewal: boolean | null
          created_at: string
          expiry_date: string
          id: string
          membership_plan_id: string
          notes: string | null
          profile_id: string
          purchase_date: string
          remaining_classes: number
          renewal_discount_percentage: number | null
          status: string
          stripe_subscription_id: string | null
          total_classes: number
          updated_at: string
        }
        Insert: {
          auto_renewal?: boolean | null
          created_at?: string
          expiry_date: string
          id?: string
          membership_plan_id: string
          notes?: string | null
          profile_id: string
          purchase_date?: string
          remaining_classes: number
          renewal_discount_percentage?: number | null
          status?: string
          stripe_subscription_id?: string | null
          total_classes: number
          updated_at?: string
        }
        Update: {
          auto_renewal?: boolean | null
          created_at?: string
          expiry_date?: string
          id?: string
          membership_plan_id?: string
          notes?: string | null
          profile_id?: string
          purchase_date?: string
          remaining_classes?: number
          renewal_discount_percentage?: number | null
          status?: string
          stripe_subscription_id?: string | null
          total_classes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_packs_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_packs_profile_id_fkey"
            columns: ["profile_id"]
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
      contact_discounts: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          contact_id: string
          created_at: string
          discount_type_id: string
          expires_at: string | null
          id: string
          max_usage: number | null
          notes: string | null
          status: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          contact_id: string
          created_at?: string
          discount_type_id: string
          expires_at?: string | null
          id?: string
          max_usage?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          contact_id?: string
          created_at?: string
          discount_type_id?: string
          expires_at?: string | null
          id?: string
          max_usage?: number | null
          notes?: string | null
          status?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_discounts_discount_type_id_fkey"
            columns: ["discount_type_id"]
            isOneToOne: false
            referencedRelation: "discount_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_drop_ins: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          contact_id: string
          created_at: string
          drop_in_option_id: string
          expiry_date: string | null
          id: string
          notes: string | null
          purchase_date: string
          status: string
          updated_at: string
          used_date: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          contact_id: string
          created_at?: string
          drop_in_option_id: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string
          status?: string
          updated_at?: string
          used_date?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          contact_id?: string
          created_at?: string
          drop_in_option_id?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string
          status?: string
          updated_at?: string
          used_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_drop_ins_drop_in_option_id_fkey"
            columns: ["drop_in_option_id"]
            isOneToOne: false
            referencedRelation: "drop_in_options"
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
      contact_memberships: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          contact_id: string
          created_at: string
          end_date: string | null
          id: string
          membership_plan_id: string
          monthly_price_cents: number | null
          notes: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          contact_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          membership_plan_id: string
          monthly_price_cents?: number | null
          notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          contact_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          membership_plan_id?: string
          monthly_price_cents?: number | null
          notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_memberships_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_notes: {
        Row: {
          contact_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_private: boolean | null
          note_type: string | null
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          note_type?: string | null
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          note_type?: string | null
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_message_channels: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_message_channels_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_message_channels_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_types: {
        Row: {
          applies_to: string | null
          created_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          applies_to?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          applies_to?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      drop_in_options: {
        Row: {
          age_group: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          option_type: string | null
          price_cents: number
          trial_duration_days: number | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          option_type?: string | null
          price_cents: number
          trial_duration_days?: number | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          option_type?: string | null
          price_cents?: number
          trial_duration_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      family_discount_plans: {
        Row: {
          applies_to: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          applies_to?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          applies_to?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_discount_tiers: {
        Row: {
          created_at: string
          discount_type: string
          discount_value: number | null
          family_member_position: number
          family_plan_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_type: string
          discount_value?: number | null
          family_member_position: number
          family_plan_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_type?: string
          discount_value?: number | null
          family_member_position?: number
          family_plan_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_discount_tiers_family_plan_id_fkey"
            columns: ["family_plan_id"]
            isOneToOne: false
            referencedRelation: "family_discount_plans"
            referencedColumns: ["id"]
          },
        ]
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
          academy_id: string | null
          api_key: string | null
          created_at: string
          id: string
          is_connected: boolean
          subaccount_id: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          academy_id?: string | null
          api_key?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          subaccount_id?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          academy_id?: string | null
          api_key?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          subaccount_id?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highlevel_config_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          auto_pay: boolean | null
          created_at: string
          description: string | null
          frequency: string
          id: string
          installment_amount: number
          installments_count: number
          next_payment_date: string
          preferred_payment_method: string | null
          start_date: string
          status: string
          stripe_setup_intent_id: string | null
          student_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          auto_pay?: boolean | null
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          installment_amount: number
          installments_count: number
          next_payment_date: string
          preferred_payment_method?: string | null
          start_date: string
          status?: string
          stripe_setup_intent_id?: string | null
          student_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          auto_pay?: boolean | null
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          installment_amount?: number
          installments_count?: number
          next_payment_date?: string
          preferred_payment_method?: string | null
          start_date?: string
          status?: string
          stripe_setup_intent_id?: string | null
          student_id?: string
          total_amount?: number
          updated_at?: string
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
      invoice_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean | null
          template_css: string | null
          template_html: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          template_css?: string | null
          template_html: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          template_css?: string | null
          template_html?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          pdf_url: string | null
          sent_at: string | null
          status: string
          stripe_invoice_id: string | null
          subtotal_amount: number | null
          tax_amount: number | null
          template_id: string | null
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
          pdf_url?: string | null
          sent_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subtotal_amount?: number | null
          tax_amount?: number | null
          template_id?: string | null
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
          pdf_url?: string | null
          sent_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subtotal_amount?: number | null
          tax_amount?: number | null
          template_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
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
      membership_plan_types: {
        Row: {
          contract_length_months: number | null
          created_at: string | null
          description: string | null
          has_contract: boolean | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          contract_length_months?: number | null
          created_at?: string | null
          description?: string | null
          has_contract?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          contract_length_months?: number | null
          created_at?: string | null
          description?: string | null
          has_contract?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          age_group: string | null
          allowed_class_types: string[] | null
          auto_billing: boolean | null
          auto_renewal_default: boolean | null
          base_price_cents: number
          billing_cycle: string | null
          billing_frequency: string | null
          class_pack_size: number | null
          classes_per_week: number | null
          created_at: string | null
          cycle_length_months: number | null
          description: string | null
          id: string
          includes_classes: boolean | null
          is_active: boolean | null
          is_class_pack: boolean | null
          is_unlimited: boolean | null
          max_classes_per_week: number | null
          name: string
          pack_expiry_days: number | null
          payment_frequency: string | null
          plan_type_id: string | null
          renewal_discount_percentage: number | null
          renewal_enabled: boolean | null
          renewal_new_rate_cents: number | null
          renewal_new_rate_enabled: boolean | null
          setup_fee_cents: number | null
          stripe_price_id: string | null
          trial_days: number | null
          trial_period_days: number | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          allowed_class_types?: string[] | null
          auto_billing?: boolean | null
          auto_renewal_default?: boolean | null
          base_price_cents: number
          billing_cycle?: string | null
          billing_frequency?: string | null
          class_pack_size?: number | null
          classes_per_week?: number | null
          created_at?: string | null
          cycle_length_months?: number | null
          description?: string | null
          id?: string
          includes_classes?: boolean | null
          is_active?: boolean | null
          is_class_pack?: boolean | null
          is_unlimited?: boolean | null
          max_classes_per_week?: number | null
          name: string
          pack_expiry_days?: number | null
          payment_frequency?: string | null
          plan_type_id?: string | null
          renewal_discount_percentage?: number | null
          renewal_enabled?: boolean | null
          renewal_new_rate_cents?: number | null
          renewal_new_rate_enabled?: boolean | null
          setup_fee_cents?: number | null
          stripe_price_id?: string | null
          trial_days?: number | null
          trial_period_days?: number | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          allowed_class_types?: string[] | null
          auto_billing?: boolean | null
          auto_renewal_default?: boolean | null
          base_price_cents?: number
          billing_cycle?: string | null
          billing_frequency?: string | null
          class_pack_size?: number | null
          classes_per_week?: number | null
          created_at?: string | null
          cycle_length_months?: number | null
          description?: string | null
          id?: string
          includes_classes?: boolean | null
          is_active?: boolean | null
          is_class_pack?: boolean | null
          is_unlimited?: boolean | null
          max_classes_per_week?: number | null
          name?: string
          pack_expiry_days?: number | null
          payment_frequency?: string | null
          plan_type_id?: string | null
          renewal_discount_percentage?: number | null
          renewal_enabled?: boolean | null
          renewal_new_rate_cents?: number | null
          renewal_new_rate_enabled?: boolean | null
          setup_fee_cents?: number | null
          stripe_price_id?: string | null
          trial_days?: number | null
          trial_period_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_plan_type_id_fkey"
            columns: ["plan_type_id"]
            isOneToOne: false
            referencedRelation: "membership_plan_types"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_subscriptions: {
        Row: {
          auto_renewal: boolean | null
          billing_amount_cents: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          cycle_length_months: number | null
          cycle_number: number | null
          discount_expires_at: string | null
          discount_percentage: number | null
          end_date: string | null
          id: string
          membership_plan_id: string
          next_billing_date: string | null
          notes: string | null
          pause_end_date: string | null
          pause_reason: string | null
          pause_start_date: string | null
          profile_id: string
          renewal_discount_percentage: number | null
          start_date: string
          status: string
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          auto_renewal?: boolean | null
          billing_amount_cents?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          cycle_length_months?: number | null
          cycle_number?: number | null
          discount_expires_at?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          membership_plan_id: string
          next_billing_date?: string | null
          notes?: string | null
          pause_end_date?: string | null
          pause_reason?: string | null
          pause_start_date?: string | null
          profile_id: string
          renewal_discount_percentage?: number | null
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_renewal?: boolean | null
          billing_amount_cents?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          cycle_length_months?: number | null
          cycle_number?: number | null
          discount_expires_at?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          membership_plan_id?: string
          next_billing_date?: string | null
          notes?: string | null
          pause_end_date?: string | null
          pause_reason?: string | null
          pause_start_date?: string | null
          profile_id?: string
          renewal_discount_percentage?: number | null
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_subscriptions_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_subscriptions_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      payment_taxes: {
        Row: {
          created_at: string
          id: string
          payment_id: string
          tax_amount: number
          tax_rate: number
          tax_setting_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id: string
          tax_amount: number
          tax_rate: number
          tax_setting_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string
          tax_amount?: number
          tax_rate?: number
          tax_setting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_taxes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_taxes_tax_setting_id_fkey"
            columns: ["tax_setting_id"]
            isOneToOne: false
            referencedRelation: "tax_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          failure_reason: string | null
          id: string
          payment_method: string | null
          receipt_url: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscriber_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          payment_method?: string | null
          receipt_url?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscriber_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscriber_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          ach_bank_name: string | null
          ach_last4: string | null
          amount: number
          applied_credits: number | null
          created_at: string
          description: string | null
          failure_reason: string | null
          id: string
          installment_number: number | null
          installment_plan_id: string | null
          next_retry_date: string | null
          payment_date: string
          payment_method: string
          payment_method_type: string | null
          retry_count: number | null
          status: string
          stripe_invoice_id: string | null
          student_id: string
          subtotal_amount: number | null
          tax_amount: number | null
          total_installments: number | null
          updated_at: string
        }
        Insert: {
          ach_bank_name?: string | null
          ach_last4?: string | null
          amount: number
          applied_credits?: number | null
          created_at?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          installment_number?: number | null
          installment_plan_id?: string | null
          next_retry_date?: string | null
          payment_date?: string
          payment_method: string
          payment_method_type?: string | null
          retry_count?: number | null
          status?: string
          stripe_invoice_id?: string | null
          student_id: string
          subtotal_amount?: number | null
          tax_amount?: number | null
          total_installments?: number | null
          updated_at?: string
        }
        Update: {
          ach_bank_name?: string | null
          ach_last4?: string | null
          amount?: number
          applied_credits?: number | null
          created_at?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          installment_number?: number | null
          installment_plan_id?: string | null
          next_retry_date?: string | null
          payment_date?: string
          payment_method?: string
          payment_method_type?: string | null
          retry_count?: number | null
          status?: string
          stripe_invoice_id?: string | null
          student_id?: string
          subtotal_amount?: number | null
          tax_amount?: number | null
          total_installments?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      performance_targets: {
        Row: {
          academy_id: string | null
          capacity_adults: number
          capacity_after_30_days: number
          capacity_first_30_days: number
          capacity_youth: number
          created_at: string
          id: string
          retention_12_months: number
          retention_3_months: number
          retention_6_months: number
          retention_9_months: number
          revenue_half_yearly: number
          revenue_monthly: number
          revenue_quarterly: number
          revenue_yearly: number
          updated_at: string
        }
        Insert: {
          academy_id?: string | null
          capacity_adults?: number
          capacity_after_30_days?: number
          capacity_first_30_days?: number
          capacity_youth?: number
          created_at?: string
          id?: string
          retention_12_months?: number
          retention_3_months?: number
          retention_6_months?: number
          retention_9_months?: number
          revenue_half_yearly?: number
          revenue_monthly?: number
          revenue_quarterly?: number
          revenue_yearly?: number
          updated_at?: string
        }
        Update: {
          academy_id?: string | null
          capacity_adults?: number
          capacity_after_30_days?: number
          capacity_first_30_days?: number
          capacity_youth?: number
          created_at?: string
          id?: string
          retention_12_months?: number
          retention_3_months?: number
          retention_6_months?: number
          retention_9_months?: number
          revenue_half_yearly?: number
          revenue_monthly?: number
          revenue_quarterly?: number
          revenue_yearly?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_targets_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      private_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          name: string
          package_size: number | null
          price_per_session_cents: number
          session_type: string | null
          total_price_cents: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          name: string
          package_size?: number | null
          price_per_session_cents: number
          session_type?: string | null
          total_price_cents: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          name?: string
          package_size?: number | null
          price_per_session_cents?: number
          session_type?: string | null
          total_price_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academy_id: string | null
          address: string | null
          belt_level: string | null
          check_in_pin: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          highlevel_contact_id: string | null
          id: string
          last_academy_id: string | null
          last_name: string
          membership_plan_id: string | null
          membership_status: string
          notes: string | null
          parent_id: string | null
          phone: string | null
          role: string
          state: string | null
          stripe_customer_id: string | null
          student_id: string | null
          updated_at: string
          zipcode: string | null
        }
        Insert: {
          academy_id?: string | null
          address?: string | null
          belt_level?: string | null
          check_in_pin?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          highlevel_contact_id?: string | null
          id: string
          last_academy_id?: string | null
          last_name: string
          membership_plan_id?: string | null
          membership_status?: string
          notes?: string | null
          parent_id?: string | null
          phone?: string | null
          role?: string
          state?: string | null
          stripe_customer_id?: string | null
          student_id?: string | null
          updated_at?: string
          zipcode?: string | null
        }
        Update: {
          academy_id?: string | null
          address?: string | null
          belt_level?: string | null
          check_in_pin?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          highlevel_contact_id?: string | null
          id?: string
          last_academy_id?: string | null
          last_name?: string
          membership_plan_id?: string | null
          membership_status?: string
          notes?: string | null
          parent_id?: string | null
          phone?: string | null
          role?: string
          state?: string | null
          stripe_customer_id?: string | null
          student_id?: string | null
          updated_at?: string
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_last_academy_id_fkey"
            columns: ["last_academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          refund_type: string
          status: string
          stripe_refund_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          refund_type?: string
          status?: string
          stripe_refund_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          refund_type?: string
          status?: string
          stripe_refund_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_payment_methods: {
        Row: {
          bank_last4: string | null
          bank_name: string | null
          card_brand: string | null
          card_last4: string | null
          created_at: string
          id: string
          is_default: boolean | null
          payment_type: string
          status: string | null
          stripe_payment_method_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_last4?: string | null
          bank_name?: string | null
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          payment_type: string
          status?: string | null
          stripe_payment_method_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_last4?: string | null
          bank_name?: string | null
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          payment_type?: string
          status?: string | null
          stripe_payment_method_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          email: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          processed: boolean | null
          stripe_event_id: string | null
          subscriber_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          processed?: boolean | null
          stripe_event_id?: string | null
          subscriber_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          processed?: boolean | null
          stripe_event_id?: string | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_settings: {
        Row: {
          applicable_services: string[] | null
          created_at: string
          effective_date: string
          id: string
          is_active: boolean
          jurisdiction: string
          tax_name: string
          tax_rate: number
          tax_type: string
          updated_at: string
        }
        Insert: {
          applicable_services?: string[] | null
          created_at?: string
          effective_date?: string
          id?: string
          is_active?: boolean
          jurisdiction: string
          tax_name: string
          tax_rate: number
          tax_type?: string
          updated_at?: string
        }
        Update: {
          applicable_services?: string[] | null
          created_at?: string
          effective_date?: string
          id?: string
          is_active?: boolean
          jurisdiction?: string
          tax_name?: string
          tax_rate?: number
          tax_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_login_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_login_role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_login_role?: string
          updated_at?: string
          user_id?: string
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
      can_contact_enroll_in_class: {
        Args: { contact_uuid: string; class_uuid: string }
        Returns: Json
      }
      check_absent_members: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_in_with_pin: {
        Args: { pin_code: string; class_id_param?: string }
        Returns: Json
      }
      check_subscription_access: {
        Args: { required_tier: string }
        Returns: boolean
      }
      check_subscription_limits: {
        Args: { academy_uuid: string; limit_type: string }
        Returns: number
      }
      create_academy_invitation: {
        Args: {
          academy_uuid: string
          invitee_email: string
          invitee_role?: string
        }
        Returns: string
      }
      create_next_billing_cycle: {
        Args: { subscription_uuid: string }
        Returns: string
      }
      generate_check_in_pin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_academy_usage: {
        Args: { academy_uuid: string }
        Returns: Json
      }
      get_class_enrolled_students: {
        Args: { class_uuid: string }
        Returns: {
          student_id: string
          first_name: string
          last_name: string
          email: string
          belt_level: string
          enrollment_status: string
        }[]
      }
      get_contact_class_access: {
        Args: { contact_uuid: string }
        Returns: {
          class_id: string
          class_name: string
          access_type: string
          additional_fee_cents: number
          max_sessions_per_period: number
          period_type: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_family_members: {
        Args: { contact_uuid: string }
        Returns: {
          contact_id: string
          first_name: string
          last_name: string
          email: string
          relationship_type: string
          is_emergency_contact: boolean
        }[]
      }
      get_instructor_classes_today: {
        Args: { instructor_uuid: string }
        Returns: {
          class_id: string
          class_name: string
          start_time: string
          end_time: string
          max_students: number
          day_of_week: number
        }[]
      }
      get_or_create_dm_channel: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_user_academies: {
        Args: { target_user_id?: string }
        Returns: {
          academy_id: string
          role: string
          academy_name: string
          city: string
          state: string
        }[]
      }
      get_user_academies_by_role: {
        Args: { target_user_id?: string; role_filter?: string }
        Returns: {
          academy_id: string
          role: string
          academy_name: string
          city: string
          state: string
        }[]
      }
      get_user_role_in_academy: {
        Args: { target_academy_id: string; target_user_id?: string }
        Returns: string
      }
      join_academy: {
        Args: { academy_uuid: string }
        Returns: boolean
      }
      join_academy_with_code: {
        Args: { code: string }
        Returns: Json
      }
      process_expired_class_packs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      switch_user_academy: {
        Args: { target_academy_id: string }
        Returns: Json
      }
      test_profile_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_payment_analytics: {
        Args: { start_date: string; end_date: string }
        Returns: undefined
      }
      update_user_role: {
        Args: { target_user_id: string; new_role: string }
        Returns: boolean
      }
      user_has_academy_access: {
        Args: { target_academy_id: string; target_user_id?: string }
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
