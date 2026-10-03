# 🔐 Protocolo do Cofre de Contingência Físico & Passagem de Bastão

> **Instituição:** Universidade do Estado de Minas Gerais — UEMG Unidade Carangola  
> **Órgão Responsável:** Núcleo de Pesquisa e Extensão (NUPEX) / Direção da Unidade  
> **Normativo:** Resolução CONUN/UEMG, Decreto Estadual nº 47.222/2017 e Lei Federal nº 14.063/2020  
> **Status:** Ativo • Versão 1.7 (Fase 7 Concluída)

---

## 1. Objetivo Institucional

O **Cofre de Contingência Físico** constitui a última e mais rígida camada de salvaguarda de soberania digital da UEMG Unidade Carangola. Seu propósito é garantir a perenidade dos registros acadêmicos de extensão, a custódia perpétua da fé pública das certidões e a continuidade administrativa mesmo nas seguintes hipóteses de desastre extremo:
* Queda total prolongada da internet, infraestrutura em nuvem ou descontinuidade de provedores;
* Transição de mandatos entre Coordenadores de Extensão e Diretores de Unidade;
* Auditoria extraordinária dos órgãos de controle do Estado (CGE-MG, TCEMG, Ministério Público).

---

## 2. Localização e Custódia Física

* **Endereço Físico:** Praça dos Estudantes, nº 23 — Bairro Santa Emília, Carangola - MG, CEP 36830-000.
* **Compartimento:** Cofre corta-fogo sob custódia direta da Direção da Unidade e da Secretaria do NUPEX.
* **Invólucro:** Envelope timbrado de alta segurança, numerado e com **lacre adesivo inviolável destrutível**.

---

## 3. Conteúdo Obrigatório do Envelope de Contingência

Em toda transição de gestão ou a cada encerramento de ano letivo, o envelope lacrado deve conter impreterivelmente:

### Item 1: Mídia Física Blindada (Pen Drive / Mídia Não Regravável)
* **`validador_offline.html` (Cold Ledger):** Arquivo estático autocontido que permite pesquisar e validar qualquer certidão expedida na história da Unidade diretamente em qualquer navegador, com computador sem acesso à internet.
* **`livro_registro.csv`:** Tabela consolidada com todas as ações extensionistas, processos SEI, concluintes e respectivos carimbos criptográficos SHA-256 (com CPF mascarado LGPD).
* **`backup_extensao_carangola_[TIMESTAMP].json`:** Dump completo e estruturado de todas as tabelas do PostgreSQL.

### Item 2: Folha de Rosto e Termo de Custódia (Impresso em Papel Timbrado)
* Relação nominal das autoridades que lacraram o envelope com seus respectivos MASP.
* Data e hora UTC do lacre.
* **Checksum SHA-256 do Backup e do Cold Ledger:** Impresso em fonte monoespaçada legível com carimbo e rubrica sobre o lacre.

### Item 3: Credenciais Mestras de Recuperação
* Chaves mestras de emergência (`SYSTEM_BACKUP_SECRET`, credenciais de recuperação do banco e do projeto na nuvem).

---

## 4. Rito Formal de Passagem de Bastão (Transição de Mandatos)

A passagem de gestão entre o Coordenador anterior e o novo titular nomeado por Portaria observará o seguinte rito:

1. **Marco Zero no Portal:**  
   O novo Coordenador acessa `/admin/mandatos` e cadastra seu mandato ativo com número da Portaria e data de posse. O sistema automaticamente arquiva o titular anterior na tabela imutável de mandatos.
2. **Download do Acervo Consolidado:**  
   O Coordenador que se despede acessa `/admin/dados`, executa o **Backup Completo** e a exportação do **Cold Ledger** contendo todo o acervo de sua gestão.
3. **Autuação no SEI-MG:**  
   É aberto um processo administrativo no SEI-MG com o título:  
   `"EXTENSÃO — TRANSIÇÃO DE GESTÃO NUPEX / CARANGOLA (BIÊNIO [ANO/ANO])"`, anexando a lista consolidada e a certidão de checksum.
4. **Substituição do Envelope no Cofre:**  
   Na presença do Diretor da Unidade e de ao menos uma testemunha servidora com MASP:
   - O envelope da gestão anterior é arquivado na pasta física permanente da Unidade;
   - Uma nova mídia com os novos hashes é gravada e acondicionada no novo envelope numerado;
   - O lacre é aposto com as três assinaturas físicas cruzando o selo de segurança.

---

## 5. Procedimento de Restauração em Cenário de Desastre

Se a plataforma em nuvem precisar ser totalmente reconstruída a partir do zero:
1. Abra o cofre e recupere a mídia física.
2. Em qualquer terminal conectado à nova instância, utilize o módulo de restauração em `/admin/dados`.
3. O sistema verificará se o hash SHA-256 do arquivo confere exatamente com o hash impresso na folha de rosto.
4. Confirmada a autenticidade matemática, a reidratação do banco é executada em bloco, restaurando instantaneamente a governança da extensão universitária.
