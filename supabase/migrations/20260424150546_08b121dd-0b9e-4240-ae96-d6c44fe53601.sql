ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS taxed boolean NOT NULL DEFAULT false;