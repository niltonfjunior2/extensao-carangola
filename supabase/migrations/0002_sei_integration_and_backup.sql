-- ==============================================================================
-- MIGRATION 0002: DESACOPLAMENTO SEI-MG, COLD LEDGER & RASTREABILIDADE PROCESSUAL
-- Portal de Extensão Universitária - UEMG Unidade Carangola
-- ==============================================================================

-- 1. DDL: ADIÇÃO DOS CAMPOS DE PROTOCOLO E PROCESSO SEI-MG
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS sei_process_number VARCHAR(64),
ADD COLUMN IF NOT EXISTS sei_document_id VARCHAR(64);

COMMENT ON COLUMN public.events.sei_process_number IS 'Número oficial do Processo autuado no Sistema Eletrônico de Informações do Estado de Minas Gerais (SEI-MG)';
COMMENT ON COLUMN public.events.sei_document_id IS 'Identificador único do documento ou despacho comprobatório assinado no SEI-MG';

-- 2. DDL: TABELA DE CUSTÓDIA E LOGS DE BACKUP DO SISTEMA
CREATE TABLE IF NOT EXISTS public.system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  checksum_sha256 VARCHAR(64) NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  backup_type VARCHAR(32) NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.system_backups IS 'Registro histórico e imutável de backups e exportações de soberania de dados do NUPEX';

-- 3. RLS: HABILITAÇÃO COMPULSÓRIA
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- 4. DCL: CONFIRMAÇÃO DE GRANTS EXPLÍCITOS (BLOCO QUÁDRUPLO)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT SELECT ON TABLE public.events TO anon;
GRANT ALL ON TABLE public.events TO service_role;

GRANT SELECT, INSERT ON TABLE public.system_backups TO authenticated;
GRANT ALL ON TABLE public.system_backups TO service_role;

-- 5. POLICIES: SEGURANÇA E ACESSO RESTRITO
DROP POLICY IF EXISTS "Apenas coordenador gerencia backups" ON public.system_backups;
CREATE POLICY "Apenas coordenador gerencia backups" ON public.system_backups
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin_extensao')
  );
