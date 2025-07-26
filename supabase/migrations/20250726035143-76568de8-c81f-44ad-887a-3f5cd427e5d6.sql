-- Fix the payments RLS policy to allow admins to see all payments without academy membership constraints
-- This will allow the payments page to show all payments for admin users

-- First, let's add a simpler admin access policy that doesn't require academy membership validation
CREATE POLICY "Admins can view all payments without academy constraints" ON public.payments
FOR SELECT
TO authenticated
USING (
  -- Allow if user is an admin/owner regardless of academy membership
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'owner')
);

-- Also update the payment processing queries to handle missing profiles gracefully
-- by allowing the profiles queries to work for admin users