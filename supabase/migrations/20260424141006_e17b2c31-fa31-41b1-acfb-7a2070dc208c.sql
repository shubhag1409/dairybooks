-- Payments against sales (bills). One sale can have multiple partial payments.
CREATE TABLE public.sale_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sale_payments select" ON public.sale_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sale_payments insert" ON public.sale_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sale_payments update" ON public.sale_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own sale_payments delete" ON public.sale_payments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_sale_payments_customer ON public.sale_payments(user_id, customer_id, date DESC);
CREATE INDEX idx_sale_payments_sale ON public.sale_payments(sale_id);
