-- Create contact notes table for detailed contact notes and interactions
CREATE TABLE public.contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'medical', 'behavioral', 'emergency', 'payment', 'attendance', 'family')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for contact notes
CREATE POLICY "Admins and owners can manage all contact notes" 
ON public.contact_notes 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE POLICY "Users can view their own contact notes" 
ON public.contact_notes 
FOR SELECT 
USING (contact_id = auth.uid());

CREATE POLICY "Staff can view non-private notes" 
ON public.contact_notes 
FOR SELECT 
USING (
  get_current_user_role() = ANY (ARRAY['instructor'::text, 'staff'::text]) 
  AND is_private = false
);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_notes_updated_at
BEFORE UPDATE ON public.contact_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_contact_notes_contact_id ON public.contact_notes(contact_id);
CREATE INDEX idx_contact_notes_created_at ON public.contact_notes(created_at DESC);
CREATE INDEX idx_contact_notes_note_type ON public.contact_notes(note_type);
CREATE INDEX idx_contact_notes_priority ON public.contact_notes(priority);