ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS is_price_public boolean NOT NULL DEFAULT false;

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
    'date_received', date_received,
    'price', price,
    'is_price_public', is_price_public
  )
  FROM public.tickets
  WHERE token_id = p_token_id
  LIMIT 1;
$$;

