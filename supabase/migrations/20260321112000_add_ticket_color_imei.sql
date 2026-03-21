ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS imei text;