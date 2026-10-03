# 🏛️ Manual do Usuário — Coordenador de Extensão (Administrador)

> **Perfil:** `admin_extensao` | **Sistema:** Portal de Extensão UEMG Carangola  
> **Status:** Versão 1.7 (Atualizado na conclusão da Fase 7 • Desacoplamento SEI-MG, Cold Ledger & Transição de Mandatos)

Este manual orienta a Coordenação de Extensão (NUPEX / Carangola) no exercício da governança, homologação de ações extensionistas, controle de mandatos institucionais, expedição de certidões oficiais, autuação no SEI-MG e salvaguardas de soberania de dados.

---

## 🧭 Menu Dinâmico do Coordenador

- [1. Visão Geral e Responsabilidades](#1-visão-geral-e-responsabilidades)
- [2. Acesso ao Sistema e Autenticação Segura](#2-acesso-ao-sistema-e-autenticação-segura)
- [3. Gestão e Auditoria Multissistema (SIGA, SUAP, SIGAA e outros)](#3-gestão-e-auditoria-multissistema-siga-suap-sigaa-e-outros)
- [4. Painel Administrativo de Mandatos das Autoridades (/admin/mandatos)](#4-painel-administrativo-de-mandatos-das-autoridades-adminmandatos)
- [5. Motor de Certificados sob Demanda e Chancela Eletrônica](#5-motor-de-certificados-sob-demanda-e-chancela-eletrônica)
- [6. Protocolo de Revogação Administrativa de Certidões](#6-protocolo-de-revogação-administrativa-de-certidões)
- [7. Pacote de Protocolo SEI-MG (Air-Gapped)](#7-pacote-de-protocolo-sei-mg-air-gapped)
- [8. Soberania de Dados: Backups, Cold Ledger e Validador Offline (/admin/dados)](#8-soberania-de-dados-backups-cold-ledger-e-validador-offline-admindados)
- [9. Protocolo Físico do Cofre de Contingência & Passagem de Bastão](#9-protocolo-físico-do-cofre-de-contingência--passagem-de-bastão)
- [10. Provisionamento Inicial & Segurança de Acesso](#10-provisionamento-inicial--segurança-de-acesso)
- [11. Dúvidas Frequentes e Suporte](#11-dúvidas-frequentes-e-suporte)

---

## 1. Visão Geral e Responsabilidades

O Coordenador de Extensão atua como a **autoridade certificadora e homologadora** da Unidade Carangola. Suas principais atribuições no portal são:
* **Auditar a conformidade institucional multissistema:** Assegurar que nenhuma ação emita certificados sem aprovação oficial nos sistemas corporativos da UEMG (seja SIGA, SUAP, SIGAA ou outros adotados pela Instituição).
* **Gerenciar a posse e mandatos vigentes:** Registrar tempestivamente novos coordenadores e diretores através da rota administrativa `/admin/mandatos`, mantendo a chancela tipográfica eletrônica alinhada às portarias estaduais.
* **Fiscalizar a emissão de certificados:** Acompanhar a expedição de certidões e revogar formalmente documentos com inconsistências cadastrais ou irregularidades.
* **Autuar no SEI-MG:** Gerar o Pacote de Protocolo e vincular o número de processo aos eventos.
* **Garantir a soberania institucional:** Exportar regularmente os backups em JSON, o Cold Ledger e manter o Cofre de Contingência atualizado.

---

## 2. Acesso ao Sistema e Autenticação Segura

1. Acesse o portal em `https://extensao.carangola.uemg.br` e clique no botão **"Acesso Restrito"** no canto superior direito.
2. Insira seu e-mail institucional `@uemg.br` e sua credencial cadastrada.
3. O sistema valida seu perfil administrativo (`admin_extensao`) e direciona automaticamente para o **Painel da Coordenação**.

> ⚠️ **Atenção:** O cadastro com perfil de Coordenador é controlado diretamente pela administração do banco; não é permitido o auto-cadastro com privilégios administrativos.

---

## 3. Gestão e Auditoria Multissistema (/dashboard/auditoria)

O Gate de Auditoria é o ponto de controle transacional da Universidade:

1. No menu principal, acesse **Auditoria Institucional** (`/dashboard/auditoria`).
2. O painel disponibiliza duas abas principais:
   - **Fila de Análise:** Propostas pendentes de homologação (`submetido`).
   - **Ações Homologadas & Pacotes SEI:** Eventos aprovados, em andamento ou encerrados, com ferramentas de protocolo e geração do despacho SEI.
3. **Conferência Lado a Lado:**
   - Clique em **"Auditar Conformidade"**.
   - O sistema abre o modal comparando os dados declarados com o arquivo PDF original anexado.
   - O checksum SHA-256 do espelho é confrontado com a folha original.
4. **Decisão do Auditor:**
   - **Confirmar Conformidade e Homologar Ação:** Altera o status para `aprovado`, gravando log imutável com MASP, data e IP em `event_audit_logs`. Libera a ação para inscrições públicas e futuro credenciamento.
   - **Recusar e Devolver ao Docente:** Exige preenchimento obrigatório de parecer técnico explicativo e retorna a proposta ao status `rejeitado` para que o docente providencie a correção.

---

## 4. Painel Administrativo de Mandatos das Autoridades (/admin/mandatos)

A tela `/admin/mandatos` foi desenvolvida para assegurar a perenidade jurídica e a transição transparente entre gestões:

1. Acesse **Mandatos Institucionais** (`/admin/mandatos`) no menu administrativo.
2. **Autoridades em Exercício:** O painel exibe os titulares ativos para Coordenador de Extensão e Diretor da Unidade Carangola com seus respectivos MASP e Atos de Designação.
3. **Registrar Posse de Novo Titular:**
   - Preencha o cargo (`Coordenador de Extensão` ou `Diretor da Unidade`).
   - Insira o nome completo com titulação acadêmica (ex: "Prof. Dr. Fulano de Tal").
   - Digite o MASP institucional oficial.
   - Indique o ato normativo legal (ex: "Portaria UEMG Carangola nº 05/2026").
   - Selecione a data de início da posse.
   - Ao clicar em **"Confirmar Posse e Ativar Mandato"**, o sistema encerra automaticamente o mandato anterior e passa a assinar as certidões com os novos dados.
4. **Histórico e Fé Pública:** A tabela inferior preserva todo o histórico das gestões passadas, garantindo que qualquer certidão emitida no passado mantenha seu snapshot legal original intacto.

---

## 5. Motor de Certificados sob Demanda e Chancela Eletrônica

O portal implementa uma arquitetura de certificação inovadora com **Custo Zero de Armazenamento (R$ 0,00)**:
1. **Renderização sob Demanda em Memória:**  
   Nenhum arquivo PDF de certificado fica armazenado nos servidores ou no bucket do Supabase. O documento é gerado dinamicamente no navegador do participante a partir dos dados do banco.
2. **Snapshot de Mandatos:**  
   No ato da emissão, o sistema congela um registro JSONB (`mandate_snapshot`) com os nomes, MASP e portarias dos titulares em exercício naquele exato instante, assegurando que o documento permaneça historicamente fiel mesmo após trocas de gestão.
3. **Chancela Tipográfica Oficial:**  
   Em conformidade com o Decreto Estadual nº 47.222/2017 e a Lei Federal nº 14.063/2020, o portal aboliu o uso de imagens de assinaturas manuais. Todas as certidões possuem um bloco tipográfico monoespaçado com o Código Verificador, Hash SHA-256 e QR Code apontando para a rota pública de validação.

---

## 6. Protocolo de Revogação Administrativa de Certidões

Na hipótese de constatação de fraude, duplicidade ou retificação formal:
1. O Coordenador de Extensão pode executar a revogação de qualquer certidão emitida utilizando a Server Action `revokeCertificateAction` informando o ID do certificado e uma justificativa detalhada.
2. O campo `is_revoked` é marcado como `true` e a justificativa é gravada em `revocation_reason`.
3. Por força da regra de imutabilidade jurídica (`protect_certificate_history`), os metadados originais (participante, horas, evento, hash) não são apagados nem alterados.
4. Ao consultar a certidão na página `/validar/[CODIGO]`, o validador público exibirá imediatamente uma **tarja vermelha de revogação**, alertando sobre a anulação do documento perante terceiros.

---

## 7. Pacote de Protocolo SEI-MG (Air-Gapped)

O módulo de protocolo desacoplado permite despachar o encerramento do evento no sistema estadual em menos de 2 minutos:

1. Na aba **Ações Homologadas** (`/dashboard/auditoria`), localize a ação desejada e clique em **"Gerar Pacote SEI"**.
2. **Minuta de Despacho Pronta:** Clique em **"Copiar Minuta de Despacho"** para transferir o texto formatado no padrão da Reitoria para a área de transferência do seu computador.
3. **Relação Nominal Consolidada:** Clique em **"Imprimir / PDF/A"** para exportar o relatório com a lista de concluintes, CPFs mascarados e os respectivos hashes SHA-256 de cada certidão.
4. **Autuação no SEI-MG:** No navegador corporativo, abra o SEI-MG, inicie o processo de certificação da extensão, cole a minuta e anexe a relação em PDF/A.
5. **Vinculação do Número SEI:** No modal do portal, insira o número do processo (ex: `1234.01.0001234/2026-55`) e clique em **"Salvar Vinculação SEI"**. O evento passará a exibir o selo com o número do processo público permanente.

---

## 8. Soberania de Dados: Backups, Cold Ledger e Validador Offline (/admin/dados)

Acesse **Gestão de Dados, Cold Ledger & Backups** (`/admin/dados`):
1. **Download do Backup Completo (.JSON Assinado):**  
   Extrai um dump integral de todas as tabelas com injeção do checksum SHA-256 e gravação automática na tabela de custódia `system_backups`.
2. **Exportar Validador Offline (.HTML Autocontido):**  
   Arquivo HTML/JS puro independente de conexão que permite consultar e validar certidões em qualquer computador desconectado da internet.
3. **Exportar Livro de Registro Geral (.CSV):**  
   Arquivo tabular perene contendo todas as certidões, processos SEI vinculados e chaves criptográficas com proteção de privacidade LGPD.
4. **Verificador de Integridade Criptográfica:**  
   Selecione qualquer arquivo de backup previamente gerado para recalcular o hash SHA-256 em memória e verificar se houve adulteração ou corrupção de dados.

---

## 9. Protocolo Físico do Cofre de Contingência & Passagem de Bastão

A UEMG Unidade Carangola mantém o protocolo físico de transição de gestão documentado em `docs/contingencia/COFRE_DE_CONTINGENCIA.md`:
* **Custódia na Unidade:** Envelope numerado com lacre destrutível guardado no cofre corta-fogo da Unidade Carangola.
* **Conteúdo:** Mídia física com o último backup JSON, `livro_registro.csv`, `validador_offline.html` e a folha de rosto impressa com os hashes conferidos.
* **Transição de Gestão:** A cada novo mandato cadastrado, um novo backup de transição é gerado e autuado no SEI-MG, com substituição do envelope na presença do Diretor e testemunhas com MASP.

---

## 10. Provisionamento Inicial & Segurança de Acesso

* **Promoção Inicial do Coordenador:**  
  O primeiro perfil de Coordenador deve ser promovido via script SQL idempotente executando `supabase/promote_admin.sql` no SQL Editor do Supabase, informando o e-mail institucional `extensao.carangola@uemg.br`.
* **Proteção Antecipada de Rotas:**  
  Todas as rotas sob `/admin/*` e `/dashboard/*` possuem guarda ativa no Edge Middleware. Tentativas de acesso não autenticadas são redirecionadas compulsoriamente para `/login?denied=true`.

---

## 11. Dúvidas Frequentes e Suporte

* **P: Um aluno solicitou correção de nome no certificado após a emissão. O que fazer?**  
  *R:* Por força da regra de imutabilidade jurídica, o certificado anterior deve ser formalmente revogado com justificativa expressa registrada em log e uma nova certidão emitida.
* **P: Onde fica a sala do NUPEX para suporte presencial?**  
  *R:* Praça dos Estudantes, 23 — Santa Emília, Carangola - MG.
