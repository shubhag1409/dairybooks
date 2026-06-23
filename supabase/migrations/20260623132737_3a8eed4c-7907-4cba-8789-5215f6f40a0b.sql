
-- Add explicit cost vs selling price tracking
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS selling_price numeric NOT NULL DEFAULT 0;

-- Backfill selling_price from existing rate (which was being treated as the sell rate)
UPDATE public.products SET selling_price = rate WHERE selling_price = 0;

-- Per-line selling price actually used on each sale (may differ from product default)
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS unit_price numeric NOT NULL DEFAULT 0;

UPDATE public.sale_items
SET unit_price = CASE WHEN quantity > 0 THEN amount / quantity ELSE 0 END
WHERE unit_price = 0;
