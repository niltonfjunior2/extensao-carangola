-- ==============================================================================
-- SEED INICIAL: MANDATOS DAS AUTORIDADES INSTITUCIONAIS
-- UEMG Unidade Carangola
-- ==============================================================================

INSERT INTO public.mandates (role, authority_name, masp, official_act, start_date, is_active)
VALUES 
  (
    'coordenador_extensao',
    'Prof. Coordenador de Extensão',
    '1.234.567-8',
    'Portaria UEMG Carangola nº 01/2026',
    '2026-01-01',
    true
  ),
  (
    'diretor_unidade',
    'Prof. Diretor da Unidade Carangola',
    '8.765.432-1',
    'Resolução CONUN/UEMG nº 123/2025',
    '2025-01-01',
    true
  )
ON CONFLICT DO NOTHING;
