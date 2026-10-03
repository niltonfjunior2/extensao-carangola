# 👨‍🏫 Manual do Usuário — Professor / Docente Proponente

> **Perfil:** `docente` | **Sistema:** Portal de Extensão UEMG Carangola  
> **Status:** Versão 1.5 (Atualizado na conclusão da Fase 5 • Motor de Certificados sob Demanda com Chancela Eletrônica)

Este manual orienta os docentes da UEMG Unidade Carangola no cadastro de ações extensionistas (cursos, palestras, eventos e workshops), submissão do comprovante do SIGA, programação de sessões, fechamento de presenças e acompanhamento da emissão de certidões.

---

## 🧭 Menu Dinâmico do Docente

- [1. Visão Geral do Fluxo Extensionista](#1-visão-geral-do-fluxo-extensionista)
- [2. Painel do Docente (/dashboard/docente)](#2-painel-do-docente-dashboarddocente)
- [3. Formulário de Submissão de Ação Extensionista (/dashboard/docente/nova-acao)](#3-formulário-de-submissão-de-ação-extensionista-dashboarddocentenova-acao)
- [4. O Requisito do Espelho do Sistema Institucional e Termo art. 299](#4-o-requisito-do-espelho-do-sistema-institucional-e-termo-art-299)
- [5. Configuração Dinâmica de Sessões e Programação](#5-configuração-dinâmica-de-sessões-e-programação)
- [6. Acompanhamento e Homologação pelo NUPEX](#6-acompanhamento-e-homologação-pelo-nupex)
- [7. Encerramento do Evento e Certificação dos Alunos](#7-encerramento-do-evento-e-certificação-dos-alunos)
- [8. Dúvidas Frequentes](#8-dúvidas-frequentes)

---

## 1. Visão Geral do Fluxo Extensionista

Todo evento extensionista segue a esteira formal de aprovação institucional:
```text
[Submissão no Sistema Corporativo (SIGA / SUAP / SIGAA)] ──► [Cadastro no Portal Local] ──► [Auditoria NUPEX] ──► [Divulgação & Check-in] ──► [Certificados sob Demanda]
```
O portal local não substitui os sistemas mestres da Universidade; ele opera de forma desacoplada para apoiar ações cadastradas no SIGA ou em novas plataformas que a UEMG venha a adotar (como SUAP ou SIGAA).

---

## 2. Painel do Docente (/dashboard/docente)

No painel principal do docente, você encontra:
1. **Resumo das Propostas:** Listagem de todas as ações de extensão sob sua coordenação.
2. **Badges de Status Institucionais:**
   - 🟡 **Aguardando Homologação (`submetido`):** Em análise pela Coordenação de Extensão.
   - 🟢 **Homologado (`aprovado`):** Aprovado no Gate de Auditoria; inscrições e credenciamento liberados.
   - 🔴 **Retificação Necessária (`rejeitado`):** Com observações do parecer do NUPEX para correção.
3. **Botão de Submissão:** Atalho direto para cadastrar novas propostas.

---

## 3. Formulário de Submissão de Ação Extensionista (/dashboard/docente/nova-acao)

1. Faça login no portal pelo botão **"Acesso Restrito"** com seu e-mail institucional `@uemg.br`.
2. Acesse `/dashboard/docente/nova-acao`.
3. Preencha os campos obrigatórios:
   - **Título da Ação:** Nome formal idêntico ao cadastrado no sistema institucional.
   - **Sistema Institucional de Registro:** Selecione onde a proposta foi originalmente aprovada (`SIGA`, `SUAP`, `SIGAA` ou `Outro`).
   - **Código / ID de Registro Externo:** Insira o identificador formal da ação gerado pelo sistema corporativo (ex: `20261234` no SIGA ou `EXT-2026-001` no SUAP).
   - **Modalidade:** Presencial, Remoto ou Híbrido.
   - **Carga Horária Total:** Horas certificadas para os participantes.
   - **Local de Realização:** Auditório, sala ou ambiente virtual.
   - **Ementa / Descrição:** Resumo dos objetivos e público-alvo.

---

## 4. O Requisito do Espelho do Sistema Institucional e Termo art. 299

Por determinação jurídica inviolável do projeto:
1. **Upload Obrigatório do Espelho Oficial:** Anexe o arquivo PDF da folha de aprovação do evento expedida pelo sistema corporativo (limite de 10 MB). O sistema calcula instantaneamente o hash criptográfico SHA-256 para custódia perpétua.
2. **Termo de Responsabilidade Administrativa:** Você deverá marcar expressamente o checkbox declarando, sob as penas do **art. 299 do Código Penal (Falsidade Ideológica)**, a autenticidade dos dados e do documento anexado.
3. O portal registra o timestamp exato em UTC e o endereço IP do docente proponente.

---

## 5. Configuração Dinâmica de Sessões e Programação

Se a sua ação extensionista ocorrer em múltiplos turnos ou dias:
1. No bloco de programação, utilize o botão **"Adicionar Sessão"**.
2. Defina o título de cada etapa, data e hora de início e término.
3. A soma das sessões compõe a esteira de credenciamento utilizada pelos monitores de auditório.

---

## 6. Acompanhamento e Homologação pelo NUPEX

1. Após submeter a ação, o status permanece como **`Aguardando Homologação`**.
2. A Coordenação de Extensão realiza a auditoria do espelho contra a Intranet UEMG.
3. Ao ser homologada, o status muda para **`Homologado`**, ativando as inscrições públicas e a emissão de certificados pós-evento.
4. Caso a Coordenação aponte divergências, você poderá visualizar o parecer e efetuar os ajustes necessários.

---

## 7. Encerramento do Evento e Certificação dos Alunos

1. Após a conclusão das palestras e encerramento do credenciamento pelos monitores, os participantes que tiveram sua presença registrada com sucesso no sistema terão a flag `attended = true`.
2. A emissão de certidões é **100% automatizada e sob demanda**: você não precisa imprimir, assinar ou confeccionar certificados manualmente.
3. O estudante acessa sua credencial ou a página `/certificados/[regId]` e emite seu certificado oficial, que já conterá a **Chancela Eletrônica Tipográfica Oficial** das autoridades com o Hash SHA-256 e QR Code.
4. O docente pode orientar seus alunos a realizarem a validação pública em `https://extensao.carangola.uemg.br/validar`.

---

## 8. Dúvidas Frequentes

* **P: Posso certificar bolsistas de editais PAEx/PROEX neste portal?**  
  *R:* Não. Conforme a regra de competência institucional, a certificação de bolsistas de fomento central é atribuição privativa da PROEX/Reitoria. Este portal emite certidões para ouvintes, participantes e minicursos locais.
* **P: Posso emitir certificados antes da aprovação no SIGA?**  
  *R:* O banco de dados possui uma trava transacional rígida (`trg_validate_certificate_compliance`) que impede qualquer emissão enquanto o evento não for formalmente homologado pela Coordenação com código SIGA válido.
