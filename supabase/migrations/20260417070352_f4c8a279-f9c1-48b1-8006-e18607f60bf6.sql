
-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pouch',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own products select" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own products insert" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own products update" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own products delete" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Customers
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own customers select" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own customers insert" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own customers update" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own customers delete" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Purchases (one row per date per user)
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  invoice_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases select" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own purchases insert" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own purchases update" ON public.purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own purchases delete" ON public.purchases FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  price NUMERIC(12,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchase_items select" ON public.purchase_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own purchase_items insert" ON public.purchase_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own purchase_items update" ON public.purchase_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own purchase_items delete" ON public.purchase_items FOR DELETE USING (auth.uid() = user_id);

-- Sales (one row per date+customer per user)
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, customer_id)
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sales select" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sales insert" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sales update" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own sales delete" ON public.sales FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sale_items select" ON public.sale_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sale_items insert" ON public.sale_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sale_items update" ON public.sale_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own sale_items delete" ON public.sale_items FOR DELETE USING (auth.uid() = user_id);

-- Crates
CREATE TABLE public.crates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  opening_stock INTEGER NOT NULL DEFAULT 0,
  received INTEGER NOT NULL DEFAULT 0,
  given INTEGER NOT NULL DEFAULT 0,
  closing_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.crates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own crates select" ON public.crates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own crates insert" ON public.crates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own crates update" ON public.crates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own crates delete" ON public.crates FOR DELETE USING (auth.uid() = user_id);

-- Business settings
CREATE TABLE public.business_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  ca_email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings select" ON public.business_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.business_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.business_settings FOR UPDATE USING (auth.uid() = user_id);

-- Invoices storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own invoices read" ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own invoices upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own invoices update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own invoices delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
