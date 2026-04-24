CREATE TABLE public.customer_crates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  given INTEGER NOT NULL DEFAULT 0,
  returned INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_crates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own customer_crates select" ON public.customer_crates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own customer_crates insert" ON public.customer_crates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own customer_crates update" ON public.customer_crates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own customer_crates delete" ON public.customer_crates FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_customer_crates_customer ON public.customer_crates(customer_id, date DESC);
CREATE INDEX idx_customer_crates_user ON public.customer_crates(user_id);