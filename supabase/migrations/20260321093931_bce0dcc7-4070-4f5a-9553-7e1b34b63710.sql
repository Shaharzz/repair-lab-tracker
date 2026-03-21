-- Tickets table
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text DEFAULT '',
  device_model text NOT NULL,
  os_passcode text DEFAULT '',
  issue_description text DEFAULT '',
  internal_notes text DEFAULT '',
  public_updates jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Received',
  date_received date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Authenticated (admin) full access
CREATE POLICY "Authenticated users can select tickets"
  ON public.tickets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tickets"
  ON public.tickets FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
  ON public.tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tickets"
  ON public.tickets FOR DELETE TO authenticated USING (true);

-- Security definer function for public tracking (returns only safe fields)
CREATE OR REPLACE FUNCTION public.get_ticket_by_token(p_token_id text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', id,
    'token_id', token_id,
    'customer_name', customer_name,
    'device_model', device_model,
    'public_updates', public_updates,
    'status', status,
    'date_received', date_received
  )
  FROM public.tickets
  WHERE token_id = p_token_id
  LIMIT 1;
$$;

-- Seed mock data
INSERT INTO public.tickets (token_id, customer_name, customer_phone, device_model, os_passcode, issue_description, internal_notes, public_updates, status, date_received)
VALUES
  ('xK9p2mQv1L', 'Sarah Mitchell', '+1 (555) 234-8901', 'MacBook Air M2 (A2681)', '4829', 'Dead, no power', 'Board swap needed. Sourced replacement C-shell + display for approx $230.',
   '[{"date":"2024-03-15","message":"Device received and inspection started."},{"date":"2024-03-16","message":"Diagnosis complete — logic board failure confirmed. Ordering replacement parts."}]'::jsonb,
   'Waiting for Parts', '2024-03-15'),
  ('Rj7wN3kY5d', 'Marcus Chen', '+1 (555) 876-4320', 'Custom PC (R7 5700X, 32GB RAM, RX 5700 XT)', '', 'Drive clicking, missing files', 'Data recovery in progress. Repairing corrupted video frames.',
   '[{"date":"2024-03-12","message":"System received. Running initial diagnostics."},{"date":"2024-03-13","message":"Hard drive failure detected. Starting data recovery process."},{"date":"2024-03-14","message":"Recovery underway — approximately 78% of data retrieved so far."}]'::jsonb,
   'In Repair', '2024-03-12');
