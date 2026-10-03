-- ==============================================================================
-- SCRIPT IDEMPOTENTE: PROMOÇÃO DO ADMINISTRADOR / COORDENADOR DE EXTENSÃO
-- Sistema de Extensão Universitária - UEMG Unidade Carangola
-- ==============================================================================
-- Instruções de Execução:
-- 1. Acesse o painel do Supabase -> SQL Editor (ou via psql com service_role).
-- 2. Altere o valor da variável 'target_email' abaixo com o e-mail institucional
--    do Coordenador de Extensão após o primeiro cadastro via tela de login.
-- 3. Execute o script.
-- ==============================================================================

DO $$
DECLARE
  target_email TEXT := 'extensao.carangola@uemg.br'; -- Substitua pelo e-mail do Coordenador
  found_user_id UUID;
BEGIN
  -- 1. Localiza o usuário correspondente no schema de autenticação do Supabase
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(target_email));

  IF found_user_id IS NULL THEN
    RAISE NOTICE 'Atenção: O usuário com o e-mail "%" ainda não foi cadastrado no Supabase Auth. Solicite que o usuário efetue o cadastro/login primeiro.', target_email;
    RETURN;
  END IF;

  -- 2. Atualiza ou insere o perfil público com a role 'admin_extensao'
  UPDATE public.profiles
  SET 
    role = 'admin_extensao',
    updated_at = NOW()
  WHERE id = found_user_id;

  -- 3. Caso não exista perfil por alguma razão anômala, cria explicitamente
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      found_user_id,
      'Coordenador de Extensão (NUPEX)',
      'admin_extensao'
    );
  END IF;

  RAISE NOTICE 'Sucesso: Usuário % (ID: %) promovido para "admin_extensao" com fé pública.', target_email, found_user_id;
END $$;
