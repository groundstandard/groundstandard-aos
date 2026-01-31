-- Add ON DELETE CASCADE to key foreign keys referencing public.profiles(id)

ALTER TABLE public.academy_invitations
  DROP CONSTRAINT IF EXISTS academy_invitations_inviter_id_fkey,
  ADD CONSTRAINT academy_invitations_inviter_id_fkey
    FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.account_credits
  DROP CONSTRAINT IF EXISTS account_credits_student_id_fkey,
  ADD CONSTRAINT account_credits_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.account_credits
  DROP CONSTRAINT IF EXISTS account_credits_created_by_fkey,
  ADD CONSTRAINT account_credits_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_student_id_fkey,
  ADD CONSTRAINT attendance_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.belt_tests
  DROP CONSTRAINT IF EXISTS belt_tests_evaluated_by_fkey,
  ADD CONSTRAINT belt_tests_evaluated_by_fkey
    FOREIGN KEY (evaluated_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_instructor_id_fkey,
  ADD CONSTRAINT calendar_events_instructor_id_fkey
    FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_created_by_fkey,
  ADD CONSTRAINT calendar_events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.channel_memberships
  DROP CONSTRAINT IF EXISTS channel_memberships_user_id_fkey,
  ADD CONSTRAINT channel_memberships_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.channel_memberships
  DROP CONSTRAINT IF EXISTS channel_memberships_invited_by_fkey,
  ADD CONSTRAINT channel_memberships_invited_by_fkey
    FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.chat_channels
  DROP CONSTRAINT IF EXISTS chat_channels_created_by_fkey,
  ADD CONSTRAINT chat_channels_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey,
  ADD CONSTRAINT chat_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.communication_logs
  DROP CONSTRAINT IF EXISTS communication_logs_contact_id_fkey,
  ADD CONSTRAINT communication_logs_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.communication_logs
  DROP CONSTRAINT IF EXISTS communication_logs_sent_by_fkey,
  ADD CONSTRAINT communication_logs_sent_by_fkey
    FOREIGN KEY (sent_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.contact_activities
  DROP CONSTRAINT IF EXISTS contact_activities_contact_id_fkey,
  ADD CONSTRAINT contact_activities_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.contact_activities
  DROP CONSTRAINT IF EXISTS contact_activities_created_by_fkey,
  ADD CONSTRAINT contact_activities_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.contact_imports
  DROP CONSTRAINT IF EXISTS contact_imports_imported_by_fkey,
  ADD CONSTRAINT contact_imports_imported_by_fkey
    FOREIGN KEY (imported_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.contact_notes
  DROP CONSTRAINT IF EXISTS contact_notes_contact_id_fkey,
  ADD CONSTRAINT contact_notes_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.custom_field_values
  DROP CONSTRAINT IF EXISTS custom_field_values_contact_id_fkey,
  ADD CONSTRAINT custom_field_values_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.direct_message_channels
  DROP CONSTRAINT IF EXISTS direct_message_channels_user1_id_fkey,
  ADD CONSTRAINT direct_message_channels_user1_id_fkey
    FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.direct_message_channels
  DROP CONSTRAINT IF EXISTS direct_message_channels_user2_id_fkey,
  ADD CONSTRAINT direct_message_channels_user2_id_fkey
    FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_student_id_fkey,
  ADD CONSTRAINT event_registrations_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.membership_subscriptions
  DROP CONSTRAINT IF EXISTS membership_subscriptions_profile_id_fkey,
  ADD CONSTRAINT membership_subscriptions_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.membership_subscriptions
  DROP CONSTRAINT IF EXISTS membership_subscriptions_cancelled_by_fkey,
  ADD CONSTRAINT membership_subscriptions_cancelled_by_fkey
    FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.refunds
  DROP CONSTRAINT IF EXISTS refunds_student_id_fkey,
  ADD CONSTRAINT refunds_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.refunds
  DROP CONSTRAINT IF EXISTS refunds_processed_by_fkey,
  ADD CONSTRAINT refunds_processed_by_fkey
    FOREIGN KEY (processed_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
