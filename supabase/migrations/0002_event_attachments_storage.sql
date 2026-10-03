-- ==============================================================================
-- MIGRATION 0002: BUCKET PRIVADO PARA COMPROVANTES DE REGISTRO INSTITUCIONAL
-- Supabase Storage & RLS
-- ==============================================================================

-- 1. CRIAÇÃO DO BUCKET PRIVADO PARA ESPELHOS DE EVENTOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-mirrors',
  'event-mirrors',
  false, -- Estritamente PRIVADO (Proteção de PII e documentos internos)
  10485760, -- Limite de 10 MB por arquivo
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- 2. POLÍTICAS DE ACESSO (RLS NO STORAGE.OBJECTS)

-- A. Upload de comprovantes (Apenas docentes e coordenação)
DROP POLICY IF EXISTS "Docentes e coordenadores enviam espelhos" ON storage.objects;
CREATE POLICY "Docentes e coordenadores enviam espelhos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-mirrors' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('docente', 'admin_extensao')
    )
  );

-- B. Leitura de comprovantes (Coordenação ou docente proponente)
DROP POLICY IF EXISTS "Apenas coordenador ou proponente le comprovante" ON storage.objects;
CREATE POLICY "Apenas coordenador ou proponente le comprovante" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'event-mirrors' AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin_extensao') OR
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );
