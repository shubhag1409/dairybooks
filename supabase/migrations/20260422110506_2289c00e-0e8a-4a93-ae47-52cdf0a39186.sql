-- Ensure authenticated users can manage only their own invoice files
DROP POLICY IF EXISTS "Users can view own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own invoices" ON storage.objects;

CREATE POLICY "Users can view own invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own invoices"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own invoices"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);