# Supabase RLS and canonical-email template

The optional SQL template at `templates/supabase/webapp-login-rls.sql` creates a profile table linked to `auth.users`, canonicalizes Gmail/Googlemail aliases, applies a unique constraint, and enables Row Level Security policies for the profile table.

It is a starter template, not an automatic security guarantee. Review table names and policies, back up production data, and add an owner-based RLS policy to every application data table. Do not run the template unchanged if you already have a user/profile schema without first planning migration and duplicate-email handling.
