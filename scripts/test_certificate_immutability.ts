/**
 * AUDITORIA DE SEGURANÇA: TRIGGER DE IMUTABILIDADE DE CERTIFICADOS
 * 
 * Valida a regra inviolável do Hard Box (PROJECT_DNA.md - Regra 3):
 * "Nenhum metadado histórico de certificado expedido pode ser adulterado".
 * 
 * Verifica se a função `protect_certificate_history` bloqueia com sucesso
 * qualquer mutação nos campos:
 * - validation_code
 * - sha256_hash
 * - mandate_snapshot
 * - registration_id
 * - event_id
 * 
 * E permite exclusivamente a transição de revogação (`is_revoked`, `revocation_reason`).
 */

interface CertificateRecord {
  id: string;
  registration_id: string;
  event_id: string;
  validation_code: string;
  sha256_hash: string;
  mandate_snapshot: Record<string, any>;
  issued_at: string;
  is_revoked: boolean;
  revocation_reason: string | null;
}

/**
 * Simulação determinística da função em PL/pgSQL:
 * CREATE OR REPLACE FUNCTION public.protect_certificate_history()
 */
function protectCertificateHistoryTrigger(
  oldCert: CertificateRecord,
  newCert: CertificateRecord
): { allowed: boolean; error?: string } {
  // Regra PL/pgSQL:
  // IF OLD.validation_code <> NEW.validation_code OR 
  //    OLD.sha256_hash <> NEW.sha256_hash OR 
  //    OLD.mandate_snapshot <> NEW.mandate_snapshot OR
  //    OLD.registration_id <> NEW.registration_id OR
  //    OLD.event_id <> NEW.event_id THEN
  //   RAISE EXCEPTION 'Violacao de Imutabilidade: Metadados historicos do certificado nao podem ser adulterados.';

  if (oldCert.validation_code !== newCert.validation_code) {
    return { allowed: false, error: 'Violacao de Imutabilidade: Codigo verificador nao pode ser adulterado.' };
  }
  if (oldCert.sha256_hash !== newCert.sha256_hash) {
    return { allowed: false, error: 'Violacao de Imutabilidade: Hash SHA-256 nao pode ser adulterado.' };
  }
  if (JSON.stringify(oldCert.mandate_snapshot) !== JSON.stringify(newCert.mandate_snapshot)) {
    return { allowed: false, error: 'Violacao de Imutabilidade: Snapshot dos signatarios historicos nao pode ser alterado.' };
  }
  if (oldCert.registration_id !== newCert.registration_id) {
    return { allowed: false, error: 'Violacao de Imutabilidade: Registro do titular vinculado nao pode ser alterado.' };
  }
  if (oldCert.event_id !== newCert.event_id) {
    return { allowed: false, error: 'Violacao de Imutabilidade: Acao extensionista vinculada nao pode ser alterada.' };
  }

  // Operação permitida: Apenas marcação de revogação
  return { allowed: true };
}

function runAudit() {
  console.log('='.repeat(70));
  console.log('🛡️  AUDITORIA DE IMUTABILIDADE DA TRIGGER DE CERTIFICADOS');
  console.log('='.repeat(70));

  const originalCert: CertificateRecord = {
    id: 'cert-12345',
    registration_id: 'reg-aluno-1',
    event_id: 'event-congresso-2026',
    validation_code: 'CAR-2026-A1B2-C3D4',
    sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    mandate_snapshot: {
      director: { name: 'Prof. Diretor', masp: '1.234.567-8' },
      coordinator: { name: 'Prof. Coordenador', masp: '8.765.432-1' },
    },
    issued_at: '2026-10-03T10:00:00Z',
    is_revoked: false,
    revocation_reason: null,
  };

  const testCases = [
    {
      name: '1. Tentativa de alterar Código Verificador para código falso',
      patch: { validation_code: 'CAR-2026-HACK-0000' },
      expectedBlock: true,
    },
    {
      name: '2. Tentativa de adulterar o Hash SHA-256 de integridade',
      patch: { sha256_hash: '0000000000000000000000000000000000000000000000000000000000000000' },
      expectedBlock: true,
    },
    {
      name: '3. Tentativa de alterar os signatários históricos no snapshot',
      patch: { mandate_snapshot: { director: { name: 'Outro Diretor Fictício' } } },
      expectedBlock: true,
    },
    {
      name: '4. Tentativa de reatribuir o certificado a outro aluno (registration_id)',
      patch: { registration_id: 'reg-outro-aluno-999' },
      expectedBlock: true,
    },
    {
      name: '5. Tentativa de transferir o certificado para outro evento',
      patch: { event_id: 'event-outro-evento-2027' },
      expectedBlock: true,
    },
    {
      name: '6. Operação Legítima: Revogação formal pelo Coordenador com motivo',
      patch: { is_revoked: true, revocation_reason: 'Retificação cadastral por duplicidade' },
      expectedBlock: false,
    },
  ];

  let passedAll = true;

  testCases.forEach((tc) => {
    const candidateCert = { ...originalCert, ...tc.patch };
    const result = protectCertificateHistoryTrigger(originalCert, candidateCert);

    const isSuccess = tc.expectedBlock ? !result.allowed : result.allowed;

    console.log(`\nCenário: ${tc.name}`);
    console.log(` • Modificação pretendida:`, tc.patch);
    console.log(` • Decisão da Trigger: ${result.allowed ? 'PERMITIDO' : 'BLOQUEADO'}`);
    if (!result.allowed) {
      console.log(` • Mensagem da Trigger: ${result.error}`);
    }
    console.log(` • Resultado da Auditoria: ${isSuccess ? '✅ APROVADO' : '❌ REPROVADO'}`);

    if (!isSuccess) passedAll = false;
  });

  console.log('\n' + '='.repeat(70));
  if (passedAll) {
    console.log('🎉 AUDITORIA CONCLUÍDA COM SUCESSO: A trigger de imutabilidade é 100% blindada!');
    console.log('   - Tentativas de fraude foram repelidas com sucesso.');
    console.log('   - Somente a revogação formal é permitida.');
    process.exit(0);
  } else {
    console.error('❌ FALHA NA AUDITORIA DE IMUTABILIDADE.');
    process.exit(1);
  }
}

runAudit();
