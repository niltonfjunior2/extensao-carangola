# 📱 Manual do Usuário — Monitor de Auditório (Operador de Check-in)

> **Perfil:** `monitor` | **Sistema:** Portal de Extensão UEMG Carangola  
> **Status:** Versão 1.6 (Atualizado na conclusão da Fase 6 • Sprint de Refatoração, CRDT Monotônico & Performance Day 2)

Este manual orienta os monitores e bolsistas de apoio operacional da UEMG Unidade Carangola na realização do credenciamento presencial nos auditórios, utilização do aplicativo PWA offline, leitura de QR Codes e contingência de dados.

---

## 🧭 Menu Dinâmico do Monitor

- [1. O Papel do Monitor no Evento](#1-o-papel-do-monitor-no-evento)
- [2. Instalação e Preparação do PWA no Celular](#2-instalação-e-preparação-do-pwa-no-celular)
- [3. Operação Offline: Como Funciona Sem Internet](#3-operação-offline-como-funciona-sem-internet)
- [4. Credenciamento por Leitura de QR Code](#4-credenciamento-por-leitura-de-qr-code)
- [5. Concorrência Multi-Portarias e Reconciliação Monotônica (CRDT / LEAST)](#5-concorrência-multi-portarias-e-reconciliação-monotônica-crdt--least)
- [6. Procedimento de Contingência Extrema (Fila de Emergência)](#6-procedimento-de-contingência-extrema-fila-de-emergência)
- [7. Dicas de Desempenho e Bateria no Auditório](#7-dicas-de-desempenho-e-bateria-no-auditório)

---

## 1. O Papel do Monitor no Evento

Os monitores são responsáveis pela recepção e registro de frequência dos ouvintes na porta dos auditórios e salas. O sistema foi projetado para ser **resiliente**: mesmo em caso de queda de energia ou ausência total de sinal Wi-Fi/4G, os check-ins continuam funcionando no seu celular com validação matemática instantânea por assinatura assimétrica Ed25519.

---

## 2. Instalação e Preparação do PWA no Celular

1. Antes do início do evento, enquanto ainda houver sinal de internet, abra o navegador do celular (Chrome no Android ou Safari no iOS).
2. Acesse a rota oficial: `https://extensao.carangola.uemg.br/monitor/checkin`.
3. Toque na opção **"Adicionar à Tela Inicial"** ou **"Instalar Aplicativo"** para instalar o App Shell institucional ultraleve (< 300 KB em cache).
4. Faça login com suas credenciais de monitor autorizadas pela Coordenação.
5. Selecione a ação extensionista do dia no menu suspenso. O aplicativo ativará automaticamente o armazenamento interno persistente do celular (IndexedDB).

---

## 3. Operação Offline: Como Funciona Sem Internet

* O aplicativo utiliza armazenamento local seguro via IndexedDB em modo append-only com garantia de retenção (`navigator.storage.persist()`).
* Se o sinal de internet cair completamente, você continuará realizando check-ins normalmente.
* A interface exibirá um indicador âmbar pulsante: **"Modo Offline Ativo"** acompanhado do contador de presenças armazenadas no aparelho aguardando envio.
* Nenhuma presença registrada localmente será perdida.

---

## 4. Credenciamento por Leitura de QR Code

1. No aplicativo, toque no botão azul **"Ativar Scanner de Entrada"**.
2. Conceda a permissão de acesso à câmera do smartphone quando solicitado pelo navegador.
3. Aponte a câmera para o QR Code apresentado na tela do celular do participante.
4. O aplicativo valida a assinatura criptográfica Ed25519 instantaneamente (< 10ms) sem consultar o servidor:
   - 🟢 **Verde (Sucesso):** Emite bip melódico e exibe "Credencial Válida: [Nome do Participante] (CPF: ***.456.789-**)".
   - 🔴 **Vermelho (Acesso Negado):** Emite som grave de alerta caso a credencial seja falsa, adulterada ou pertença a outro evento.

---

## 5. Concorrência Multi-Portarias e Reconciliação Monotônica (CRDT / LEAST)

Em auditórios com múltiplas entradas simultâneas (ex: Portaria Principal, Portaria Lateral e Mesa de Acessibilidade):
1. **Zero Risco de Duplicação:** Múltiplos monitores podem escanear a credencial do mesmo estudante sem risco de gerar dois registros ou inflar a carga horária.
2. **Princípio Matemático LEAST:** O servidor aplica estritamente a função `resolveEarliestTimestamp`. Quando os dispositivos restabelecem a conexão e sincronizam seus lotes locais via `/api/checkin/batch-sync`, o sistema preserva rigorosamente o primeiro carimbo de horário registrado no chão do auditório.
3. **Auditoria Transparente:** Todas as tentativas concorrentes são anexadas à trilha imutável (`audit_trail`) do participante com o ID do monitor e o carimbo original do aparelho, garantindo fé pública institucional.

---

## 6. Procedimento de Contingência Extrema (Fila de Emergência)

Caso o celular do monitor sofra alguma pane ou a conexão da cidade permaneça fora do ar ao término do evento:
1. No painel do scanner offline, clique no botão **"Exportar Fila de Emergência"**.
2. O aplicativo fará o download imediato de um arquivo seguro no formato `contingencia-checkins-[EVENT_ID].json` para a pasta de downloads do celular.
3. Esse arquivo pode ser enviado via Bluetooth, pendrive ou e-mail institucional para a Coordenação de Extensão (NUPEX), que efetuará a ingestão direta em lote sem perda de nenhuma presença.

---

## 7. Dicas de Desempenho e Bateria no Auditório

* O scanner utiliza Web Workers e decodificação óptica local eficiente para economizar energia.
* Para eventos com mais de 3 horas de duração, mantenha o brilho da tela em nível intermediário ou utilize um powerbank portátil.
* Se a fila de entrada diminuir, pause o scanner no botão **"Desativar Câmera"** para cessar o uso do sensor fotográfico.
