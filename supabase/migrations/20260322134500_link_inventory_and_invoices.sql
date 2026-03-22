-- Link inventory and invoices modules to concrete database tables.
-- Safe to run even if tables already exist.

CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  fit_for text,
  category text,
  sku text,
  quantity integer NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 0,
  cost_price numeric,
  retail_price numeric,
  supplier text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS fit_for text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_price numeric,
  ADD COLUMN IF NOT EXISTS retail_price numeric,
  ADD COLUMN IF NOT EXISTS supplier text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Backfill from older inventory schema if those columns exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory'
      AND column_name = 'device_model'
  ) THEN
    EXECUTE 'UPDATE public.inventory
             SET item_name = COALESCE(item_name, device_model)
             WHERE item_name IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory'
      AND column_name = 'stock_quantity'
  ) THEN
    EXECUTE 'UPDATE public.inventory
             SET quantity = COALESCE(quantity, stock_quantity)
             WHERE quantity IS NULL';
  END IF;
END $$;

ALTER TABLE public.inventory
  ALTER COLUMN item_name SET NOT NULL,
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN quantity SET DEFAULT 0,
  ALTER COLUMN min_quantity SET NOT NULL,
  ALTER COLUMN min_quantity SET DEFAULT 0,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS inventory_sku_key
  ON public.inventory (sku)
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS inventory_item_name_idx
  ON public.inventory (item_name);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inventory'
      AND policyname = 'Authenticated users can select inventory'
  ) THEN
    CREATE POLICY "Authenticated users can select inventory"
      ON public.inventory FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inventory'
      AND policyname = 'Authenticated users can insert inventory'
  ) THEN
    CREATE POLICY "Authenticated users can insert inventory"
      ON public.inventory FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inventory'
      AND policyname = 'Authenticated users can update inventory'
  ) THEN
    CREATE POLICY "Authenticated users can update inventory"
      ON public.inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inventory'
      AND policyname = 'Authenticated users can delete inventory'
  ) THEN
    CREATE POLICY "Authenticated users can delete inventory"
      ON public.inventory FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  total_amount numeric,
  status text NOT NULL DEFAULT 'generated',
  payment_method text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS total_amount numeric,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS issue_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Backfill from older invoices schema if those columns exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'amount'
  ) THEN
    EXECUTE 'UPDATE public.invoices
             SET total_amount = COALESCE(total_amount, amount)
             WHERE total_amount IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'issued_at'
  ) THEN
    EXECUTE 'UPDATE public.invoices
             SET issue_date = COALESCE(issue_date, issued_at::date)
             WHERE issue_date IS NULL';
  END IF;
END $$;

ALTER TABLE public.invoices
  ALTER COLUMN invoice_number SET NOT NULL,
  ALTER COLUMN customer_name SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'generated',
  ALTER COLUMN line_items SET NOT NULL,
  ALTER COLUMN line_items SET DEFAULT '[]'::jsonb,
  ALTER COLUMN issue_date SET NOT NULL,
  ALTER COLUMN issue_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.invoices
SET invoice_number = COALESCE(invoice_number, 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substring(id::text, 1, 8))
WHERE invoice_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_number_key
  ON public.invoices (invoice_number);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_ticket_id_key
  ON public.invoices (ticket_id)
  WHERE ticket_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS invoices_issue_date_idx
  ON public.invoices (issue_date);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invoices'
      AND policyname = 'Authenticated users can select invoices'
  ) THEN
    CREATE POLICY "Authenticated users can select invoices"
      ON public.invoices FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invoices'
      AND policyname = 'Authenticated users can insert invoices'
  ) THEN
    CREATE POLICY "Authenticated users can insert invoices"
      ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invoices'
      AND policyname = 'Authenticated users can update invoices'
  ) THEN
    CREATE POLICY "Authenticated users can update invoices"
      ON public.invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invoices'
      AND policyname = 'Authenticated users can delete invoices'
  ) THEN
    CREATE POLICY "Authenticated users can delete invoices"
      ON public.invoices FOR DELETE TO authenticated USING (true);
  END IF;
END $$;





