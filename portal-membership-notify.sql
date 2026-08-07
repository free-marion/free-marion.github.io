-- ============================================
-- Cherrywood Portal — Membership Application Notify
-- Run in Supabase SQL Editor
-- ============================================
-- Adds the replay-guard column the notify-membership-application
-- edge function uses to avoid sending duplicate staff emails.
-- ============================================

alter table membership_applications add column if not exists notified_at timestamptz;
