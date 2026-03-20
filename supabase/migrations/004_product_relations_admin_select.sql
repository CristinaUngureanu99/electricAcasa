-- Admin can view all product relations (including those to inactive products)
CREATE POLICY "Admins can view all product relations" ON public.product_relations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
