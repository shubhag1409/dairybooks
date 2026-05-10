ALTER TABLE public.sale_payments
ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'cash';

CREATE INDEX IF NOT EXISTS idx_sale_payments_method ON public.sale_payments(method);
CREATE INDEX IF NOT EXISTS idx_sale_payments_user_date ON public.sale_payments(user_id, date);