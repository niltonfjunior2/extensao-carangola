# 📚 Manuais do Usuário — Portal de Extensão UEMG Carangola

> **Status:** Ativo | **Versão:** 1.7 (Fase 7 Concluída • Desacoplamento SEI-MG, Cold Ledger & Transição de Mandatos)  
> **Padrão de Governança:** Documento de atualização obrigatória a cada ciclo de desenvolvimento.

Bem-vindo ao centro de documentação operacional do **Portal de Extensão Universitária da UEMG Unidade Carangola**. Este diretório consolida os manuais de instrução para cada ator do sistema, orientando de forma prática o uso dos recursos, fluxos de validação multissistema (SIGA, SUAP, etc.) e salvaguardas institucionais.

---

## 🧭 Menu Dinâmico de Atores

Selecione o perfil correspondente para acessar o manual detalhado:

* 🏛️ [**Manual do Coordenador de Extensão (Administrador)**](./MANUAL_COORDENADOR.md)
  * Homologação institucional multissistema, gestão de mandatos (`/admin/mandatos`), motor de certidões, protocolo de revogação, pacotes de protocolo SEI-MG, Cold Ledger offline, backups assinados (`/admin/dados`) e protocolo do Cofre de Contingência.
* 👨‍🏫 [**Manual do Professor / Docente Proponente**](./MANUAL_DOCENTE.md)
  * Cadastro de ações extensionistas, seleção do sistema de registro (SIGA/SUAP), upload de espelho em PDF, termo art. 299, programação de sessões e acompanhamento de certificados.
* 🎓 [**Manual do Estudante / Participante / Comunidade**](./MANUAL_ESTUDANTE.md)
  * Navegação de eventos abertos, inscrições acessíveis (WCAG 2.1 AA), credencial digital com QR Code Ed25519, emissão sob demanda de certificados e consulta pública de autenticidade.
* 📱 [**Manual do Monitor de Auditório (Operador de Check-in)**](./MANUAL_MONITOR.md)
  * Utilização do aplicativo PWA offline, leitura de credenciais por câmera, concorrência multi-portarias (CRDT/LEAST), contingência e sincronização de presenças.
* 🔐 [**Protocolo do Cofre de Contingência & Passagem de Bastão**](../contingencia/COFRE_DE_CONTINGENCIA.md)
  * Rito físico e institucional de custódia perpétua em envelope lacrado na sala da Unidade Carangola.

---

## 🛡️ Matriz de Papéis e Permissões (RBAC)

| Recurso / Ação | Coordenador (`admin_extensao`) | Docente (`docente`) | Monitor (`monitor`) | Participante / Comunidade |
| :--- | :---: | :---: | :---: | :---: |
| Consulta pública de ações e landing page | ✅ | ✅ | ✅ | ✅ |
| Inscrição pública e credencial QR Code Ed25519 | ✅ | ✅ | ✅ | ✅ |
| Emissão sob demanda de certificado (participante concluinte) | ✅ | ✅ | ✅ | ✅ |
| Validação pública de certidão por código e QR Code | ✅ | ✅ | ✅ | ✅ |
| Submissão de nova ação extensionista | ✅ | ✅ | ❌ | ❌ |
| Upload do espelho do SIGA em PDF com hash SHA-256 | ✅ | ✅ | ❌ | ❌ |
| Auditoria e homologação de ação (SIGA Gate) | ✅ | ❌ | ❌ | ❌ |
| Credenciamento de auditório (PWA Offline) | ✅ | ✅ | ✅ | ❌ |
| Gestão de mandatos das autoridades (`/admin/mandatos`) | ✅ | ❌ | ❌ | ❌ |
| Revogação administrativa de certidão com tarja pública | ✅ | ❌ | ❌ | ❌ |
| Geração de Pacote de Protocolo SEI-MG e vinculação | ✅ | ❌ | ❌ | ❌ |
| Download de Cold Ledger (CSV + Validador Offline) | ✅ | ❌ | ❌ | ❌ |
| Download de Backup Completo JSON Assinado (`/api/system/backup`) | ✅ | ❌ | ❌ | ❌ |
| Verificador de Integridade Criptográfica de Backup | ✅ | ❌ | ❌ | ❌ |

---

## 🔄 Regra de Atualização Contínua dos Manuais

Conforme estipulado no guia de governança da UEMG Carangola:
1. Qualquer nova funcionalidade, tela, botão ou regra de negócio implementada no portal **exige atualização imediata** do manual do ator correspondente.
2. Cada manual deve manter seu menu dinâmico navegável e compatível com leitores de Markdown.
