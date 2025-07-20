-- Add membership_plan_id column to profiles table to track assigned membership plans
ALTER TABLE public.profiles 
ADD COLUMN membership_plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL;