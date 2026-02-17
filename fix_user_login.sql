-- ============================================
-- Fix User Login Issue - Run This Now
-- ============================================
-- This script:
-- 1. Creates a function to auto-confirm admin-created users
-- 2. Optionally confirms all existing users (uncomment to use)
-- ============================================

-- Step 1: Create function to auto-confirm users (admin only)
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if the current user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can confirm user emails';
  END IF;

  -- Update the user's email_confirmed_at to NOW()
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = p_user_id;

  -- Check if user was found and updated
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'message', 'User email confirmed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users (RLS will check admin role)
GRANT EXECUTE ON FUNCTION public.auto_confirm_user_email TO authenticated;

-- ============================================
-- Step 2: (OPTIONAL) Confirm all existing users
-- Uncomment the following if you want to confirm all existing users at once
-- ============================================

/*
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
*/

-- ============================================
-- Done! 
-- ============================================
-- Now all new users created by admins will be auto-confirmed.
-- Existing users that can't log in can be confirmed individually
-- by running this SQL (replace 'user@example.com' with actual email):
--
-- UPDATE auth.users
-- SET email_confirmed_at = NOW(), confirmed_at = NOW()
-- WHERE email = 'user@example.com';
-- ============================================


