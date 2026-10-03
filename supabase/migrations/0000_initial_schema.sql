-- ==============================================================================
-- DDL CONSOLIDADO: PORTAL DE EXTENSÃO UEMG CARANGOLA
-- Versão: 1.0 (Conformidade estrita pós-30 de outubro com Supabase / PostgREST)
-- Regra Inviolável: Bloco Quádruplo (CREATE -> ENABLE RLS -> GRANTS -> POLICIES)
-- ==============================================================================

-- 1. EXTENSÕES & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('participante', 'monitor', 'docente', 'admin_extensao');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('rascunho', 'submetido', 'aprovado', 'em_andamento', 'encerrado', 'rejeitado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.modality_type AS ENUM ('presencial', 'remoto', 'hibrido');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.mandate_role AS ENUM ('coordenador_extensao', 'diretor_unidade');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. TABELA: PROFILES (Perfis e Identidade Institucional)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  masp VARCHAR(20),
  role public.user_role NOT NULL DEFAULT 'participante',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO service_role;

DROP POLICY IF EXISTS "Perfis visiveis pelo proprio usuario ou admin" ON public.profiles;
CREATE POLICY "Perfis visiveis pelo proprio usuario ou admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin_extensao')
  );

DROP POLICY IF EXISTS "Usuarios atualizam seu proprio perfil" ON public.profiles;
CREATE POLICY "Usuarios atualizam seu proprio perfil" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- ==============================================================================
-- 3. TABELA: MANDATES (Controle Temporal das Autoridades Signatárias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.mandate_role NOT NULL,
  authority_name TEXT NOT NULL,
  masp VARCHAR(20) NOT NULL,
  official_act TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_mandate_role 
ON public.mandates (role) 
WHERE is_active = true;

ALTER TABLE public.mandates ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mandates TO authenticated;
GRANT SELECT ON TABLE public.mandates TO anon;
GRANT ALL ON TABLE public.mandates TO service_role;

DROP POLICY IF EXISTS "Mandatos visiveis publicamente para validacao" ON public.mandates;
CREATE POLICY "Mandatos visiveis publicamente para validacao" ON public.mandates
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Apenas coordenador gerencia mandatos" ON public.mandates;
CREATE POLICY "Apenas coordenador gerencia mandatos" ON public.mandates
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin_extensao')
  );

-- ==============================================================================
-- 4. TABELA: EVENTS (Ações Extensionistas e Auditoria SIGA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siga_id VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  modality public.modality_type NOT NULL DEFAULT 'presencial',
  location TEXT,
  workload_hours INTEGER NOT NULL DEFAULT 4 CHECK (workload_hours > 0),
  status public.event_status NOT NULL DEFAULT 'submetido',
  coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  siga_mirror_pdf_url TEXT,
  siga_mirror_sha256 VARCHAR(64),
  legal_responsibility_accepted BOOLEAN NOT NULL DEFAULT false,
  legal_accepted_at TIMESTAMPTZ,
  legal_accepted_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT SELECT ON TABLE public.events TO anon;
GRANT ALL ON TABLE public.events TO service_role;

DROP POLICY IF EXISTS "Eventos aprovados sao visiveis publicamente" ON public.events;
CREATE POLICY "Eventos aprovados sao visiveis publicamente" ON public.events
  FOR SELECT TO public
  USING (status IN ('aprovado', 'em_andamento', 'encerrado'));

DROP POLICY IF EXISTS "Docentes e coordenacao visualizam todos os eventos pertinentes" ON public.events;
CREATE POLICY "Docentes e coordenacao visualizam todos os eventos pertinentes" ON public.events
  FOR SELECT TO authenticated
  USING (
    coordinator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin_extensao', 'monitor'))
  );

DROP POLICY IF EXISTS "Docentes cadastram acoes" ON public.events;
CREATE POLICY "Docentes cadastram acoes" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('docente', 'admin_extensao'))
  );

DROP POLICY IF EXISTS "Apenas coordenacao altera status de homologacao" ON public.events;
CREATE POLICY "Apenas coordenacao altera status de homologacao" ON public.events
  FOR UPDATE TO authenticated
  USING (
    coordinator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin_extensao')
  );

-- ==============================================================================
-- 5. TABELA: EVENT_SESSIONS (Sessões e Programação de Horários)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  workload_session_hours NUMERIC(4, 2) NOT NULL DEFAULT 2.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_sessions TO authenticated;
GRANT SELECT ON TABLE public.event_sessions TO anon;
GRANT ALL ON TABLE public.event_sessions TO service_role;

DROP POLICY IF EXISTS "Sessoes visiveis publicamente" ON public.event_sessions;
CREATE POLICY "Sessoes visiveis publicamente" ON public.event_sessions
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Docente ou coordenacao gerenciam sessoes" ON public.event_sessions;
CREATE POLICY "Docente ou coordenacao gerenciam sessoes" ON public.event_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_sessions.event_id AND 
      (e.coordinator_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin_extensao'))
    )
  );

-- ==============================================================================
-- 6. TABELA: REGISTRATIONS (Inscrições, Presença & CRDT Monotônico)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  participant_cpf VARCHAR(14) NOT NULL,
  attended BOOLEAN NOT NULL DEFAULT false,
  checkin_at TIMESTAMPTZ,
  synced_by_monitor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  audit_trail JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_event_participant_cpf UNIQUE (event_id, participant_cpf)
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.registrations TO authenticated;
GRANT SELECT, INSERT ON TABLE public.registrations TO anon;
GRANT ALL ON TABLE public.registrations TO service_role;

DROP POLICY IF EXISTS "Inscricao publica em eventos homologados" ON public.registrations;
CREATE POLICY "Inscricao publica em eventos homologados" ON public.registrations
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status IN ('aprovado', 'em_andamento'))
  );

DROP POLICY IF EXISTS "Participante visualiza sua propria inscricao" ON public.registrations;
CREATE POLICY "Participante visualiza sua propria inscricao" ON public.registrations
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin_extensao', 'monitor', 'docente'))
  );

DROP POLICY IF EXISTS "Monitores e Coordenadores atualizam presencas" ON public.registrations;
CREATE POLICY "Monitores e Coordenadores atualizam presencas" ON public.registrations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin_extensao', 'monitor', 'docente'))
  );

-- ==============================================================================
-- 7. TABELA: CERTIFICATES (Certidões sob Demanda & Chancela Oficial)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID UNIQUE NOT NULL REFERENCES public.registrations(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  validation_code VARCHAR(32) UNIQUE NOT NULL,
  sha256_hash VARCHAR(64) NOT NULL,
  mandate_snapshot JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.certificates TO authenticated;
GRANT SELECT ON TABLE public.certificates TO anon;
GRANT ALL ON TABLE public.certificates TO service_role;

DROP POLICY IF EXISTS "Certificados sao validaveis publicamente por codigo" ON public.certificates;
CREATE POLICY "Certificados sao validaveis publicamente por codigo" ON public.certificates
  FOR SELECT TO public
  USING (true);

-- ==============================================================================
-- 8. TABELA: EVENT_AUDIT_LOGS (Trilha de Auditoria Imutável do SIGA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  auditor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  previous_status public.event_status NOT NULL,
  new_status public.event_status NOT NULL,
  justification TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.event_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON TABLE public.event_audit_logs TO authenticated;
GRANT SELECT ON TABLE public.event_audit_logs TO anon;
GRANT ALL ON TABLE public.event_audit_logs TO service_role;

DROP POLICY IF EXISTS "Logs de auditoria visiveis por administradores" ON public.event_audit_logs;
CREATE POLICY "Logs de auditoria visiveis por administradores" ON public.event_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin_extensao')
  );

-- ==============================================================================
-- 9. TABELA: KEEPALIVE (Mecanismo Antidesligamento do Supabase)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.keepalive (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_ping TIMESTAMPTZ NOT NULL DEFAULT now(),
  ping_count BIGINT NOT NULL DEFAULT 1,
  source TEXT DEFAULT 'github_action',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT keepalive_singleton CHECK (id = 1)
);

ALTER TABLE public.keepalive ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE public.keepalive TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.keepalive TO authenticated;
GRANT ALL ON TABLE public.keepalive TO service_role;

DROP POLICY IF EXISTS "Leitura publica do keepalive" ON public.keepalive;
CREATE POLICY "Leitura publica do keepalive" ON public.keepalive
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Atualizacao do keepalive via automacao" ON public.keepalive;
CREATE POLICY "Atualizacao do keepalive via automacao" ON public.keepalive
  FOR UPDATE TO public
  USING (id = 1)
  WITH CHECK (id = 1);

-- Inicializa a linha singleton do keepalive
INSERT INTO public.keepalive (id, last_ping, ping_count, source)
VALUES (1, now(), 1, 'initial_seed')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 10. TRIGGERS INVIOLÁVEIS (The Hard Box & Imutabilidade)
-- ==============================================================================

-- A. Trava Transacional do SIGA (PROJECT_DNA.md - Regra 1)
CREATE OR REPLACE FUNCTION public.check_event_siga_compliance()
RETURNS TRIGGER AS $$
DECLARE
  v_event_status public.event_status;
  v_siga_id VARCHAR;
BEGIN
  SELECT status, siga_id INTO v_event_status, v_siga_id
  FROM public.events
  WHERE id = NEW.event_id;

  IF v_siga_id IS NULL OR TRIM(v_siga_id) = '' THEN
    RAISE EXCEPTION 'Violacao do Cordao Umbilical do SIGA: O evento nao possui ID SIGA homologado.';
  END IF;

  IF v_event_status NOT IN ('aprovado', 'encerrado') THEN
    RAISE EXCEPTION 'Violacao de Seguranca: Certificados so podem ser gerados para eventos homologados pelo SIGA (status: aprovado ou encerrado). Status atual: %', v_event_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_certificate_siga ON public.certificates;
CREATE TRIGGER trg_validate_certificate_siga
BEFORE INSERT ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.check_event_siga_compliance();

-- B. Trava de Imutabilidade dos Certificados (PROJECT_DNA.md - Regra 3)
CREATE OR REPLACE FUNCTION public.protect_certificate_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.validation_code <> NEW.validation_code OR 
       OLD.sha256_hash <> NEW.sha256_hash OR 
       OLD.mandate_snapshot <> NEW.mandate_snapshot OR
       OLD.registration_id <> NEW.registration_id OR
       OLD.event_id <> NEW.event_id THEN
      RAISE EXCEPTION 'Violacao de Imutabilidade: Metadados historicos do certificado nao podem ser adulterados.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_certificate_history ON public.certificates;
CREATE TRIGGER trg_protect_certificate_history
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.protect_certificate_history();
