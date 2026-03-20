-- electricAcasa.ro — Storage buckets for product images, datasheets, package attachments

-- =============================================================================
-- BUCKETS
-- =============================================================================

-- Product images: public read, server-side upload (service role)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Datasheets (PDF): public read, server-side upload (service role)
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasheets', 'datasheets', true);

-- Package request attachments: private, authenticated upload
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-attachments', 'package-attachments', false);

-- =============================================================================
-- POLICIES: product-images (public read, service role write)
-- =============================================================================

-- Anyone can view product images
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- =============================================================================
-- POLICIES: datasheets (public read, service role write)
-- =============================================================================

-- Anyone can download datasheets
CREATE POLICY "Public can view datasheets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'datasheets');

-- =============================================================================
-- POLICIES: package-attachments (authenticated upload, owner + admin read)
-- Path convention: {user_id}/{request_id}/{filename}
-- =============================================================================

-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload package attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'package-attachments'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view own attachments
CREATE POLICY "Users can view own package attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'package-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can view all attachments
CREATE POLICY "Admins can view all package attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'package-attachments'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete attachments
CREATE POLICY "Admins can delete package attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'package-attachments'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
