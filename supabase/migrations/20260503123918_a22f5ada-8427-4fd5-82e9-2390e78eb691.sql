
CREATE TABLE public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  reason text NOT NULL,
  reference_id uuid,
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own inventory select" ON public.inventory_adjustments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own inventory insert" ON public.inventory_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own inventory delete" ON public.inventory_adjustments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "own inventory update" ON public.inventory_adjustments FOR UPDATE USING (auth.uid() = user_id);
