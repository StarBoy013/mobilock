-- ============================================================
-- NUCLEAR CLEANUP: Remove ALL @utms.edu users from auth + public
-- Run this in the Supabase SQL Editor
-- ============================================================

-- First, find all auth.users with @utms.edu emails and collect their IDs
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all @utms.edu auth users and clean dependencies
    FOR user_record IN 
        SELECT id FROM auth.users WHERE email LIKE '%@utms.edu'
    LOOP
        -- Clean auth dependencies
        DELETE FROM auth.identities WHERE user_id = user_record.id;
        DELETE FROM auth.sessions WHERE user_id = user_record.id;
        DELETE FROM auth.mfa_factors WHERE user_id = user_record.id;
        DELETE FROM auth.one_time_tokens WHERE user_id = user_record.id;
        
        -- Clean refresh_tokens (user_id is text in some versions)
        BEGIN
            DELETE FROM auth.refresh_tokens WHERE user_id = user_record.id::text;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        
        -- Clean public dependencies
        DELETE FROM public.verification_logs WHERE conductor_id = user_record.id;
        DELETE FROM public.renewal_requests WHERE student_id = user_record.id;
        DELETE FROM public.passes WHERE student_id = user_record.id;
        DELETE FROM public.pass_applications WHERE student_id = user_record.id;
        DELETE FROM public.notifications WHERE user_id = user_record.id;
        DELETE FROM public.profiles WHERE id = user_record.id;
    END LOOP;
END $$;

-- Now delete all @utms.edu auth users
DELETE FROM auth.users WHERE email LIKE '%@utms.edu';

-- Also delete any @test.com users left from diagnostic scripts
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@test.com');
DELETE FROM auth.users WHERE email LIKE '%@test.com';

-- Clean any remaining orphaned profiles
DELETE FROM public.profiles WHERE email LIKE '%@utms.edu';

-- Verify: both should be 0
SELECT 'auth.users remaining' AS check, count(*) FROM auth.users WHERE email LIKE '%@utms.edu'
UNION ALL
SELECT 'profiles remaining', count(*) FROM public.profiles WHERE email LIKE '%@utms.edu';
