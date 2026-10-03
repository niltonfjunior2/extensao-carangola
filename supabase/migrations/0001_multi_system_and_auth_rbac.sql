-- ==============================================================================
-- MIGRATION 0001: SUPORTE A MÚLTIPLOS SISTEMAS INSTITUCIONAIS & SEGURANÇA RBAC
-- Versão: 1.1 | Pós-30 de Outubro Supabase Compliant
-- Regra Inviolável: Bloco Quádruplo (CREATE/ALTER -> ENABLE RLS -> GRANTS -> POLICIES)
-- ==============================================================================

-- 1. NOVO ENUM: SISTEMAS INSTITUCIONAIS DE REGISTRO ACADÊMICO
DO $$ BEGIN
  CREATE TYPE public.academic_system_type AS ENUM ('siga', 'suap', 'sigaa', 'outro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ADEQUAÇÃO DA TABELA EVENTS (Desacoplamento do SIGA)
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS registry_system public.academic_system_type NOT NULL DEFAULT 'siga',
  ADD COLUMN IF NOT EXISTS external_registry_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS external_mirror_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS external_mirror_sha256 VARCHAR(64);

-- Migração de dados de compatibilidade retroativa
UPDATE public.events 
SET external_registry_id = siga_id 
WHERE external_registry_id IS NULL AND siga_id IS NOT NULL;

-- Garante constraint de obrigatoriedade do registro externo
ALTER TABLE public.events 
  ALTER COLUMN external_registry_id SET NOT NULL;

-- 3. TRIGGER ATUALIZADA: CONFORMIDADE DE REGISTRO INSTITUCIONAL (The Hard Box)
CREATE OR REPLACE FUNCTION public.check_event_compliance()
RETURNS TRIGGER AS $$
DECLARE
  v_event_status public.event_status;
  v_ext_id VARCHAR;
  v_system public.academic_system_type;
BEGIN
  SELECT status, external_registry_id, registry_system 
  INTO v_event_status, v_ext_id, v_system
  FROM public.events
  WHERE id = NEW.event_id;

  IF v_ext_id IS NULL OR TRIM(v_ext_id) = '' THEN
    RAISE EXCEPTION 'Violacao do Cordao Umbilical Institucional: O evento nao possui codigo de registro no sistema (%) informado.', v_system;
  END IF;

  IF v_event_status NOT IN ('aprovado', 'encerrado') THEN
    RAISE EXCEPTION 'Violacao de Seguranca: Certificados so podem ser expedidos para eventos homologados (status atual: %).', v_event_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove a trigger anterior atrelada ao nome legado e ativa a nova
DROP TRIGGER IF EXISTS trg_validate_certificate_siga ON public.certificates;
DROP TRIGGER IF EXISTS trg_validate_certificate_compliance ON public.certificates;

CREATE TRIGGER trg_validate_certificate_compliance
BEFORE INSERT ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.check_event_compliance();

-- 4. SEGURANÇA RBAC: TRIGGER DE AUTO-CRIAÇÃO DE PERFIL COM ROLE PADRÃO PARTICIPANTE
-- Impede escalação de privilégios no ato de cadastro no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, cpf, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'cpf', '000.000.000-00'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'participante' -- Regra Zero Trust: Ninguém se auto-cadastra como admin ou docente
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. BLOC0 QUÁDRUPLO: CONFIRMAÇÃO DE GRANTS E POLÍTICAS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT SELECT ON TABLE public.events TO anon;
GRANT ALL ON TABLE public.events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mandates TO authenticated;
GRANT SELECT ON TABLE public.mandates TO anon;
GRANT ALL ON TABLE public.mandates TO service_role;
