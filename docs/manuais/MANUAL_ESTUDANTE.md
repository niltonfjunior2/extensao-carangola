# 🎓 Manual do Usuário — Estudante / Participante / Comunidade

> **Perfil:** `participante` / Acesso Público | **Sistema:** Portal de Extensão UEMG Carangola  
> **Status:** Versão 1.5 (Atualizado na conclusão da Fase 5 • Motor de Certificados sob Demanda com Chancela Eletrônica)

Este manual destina-se a alunos de graduação, pós-graduação e membros da comunidade externa que participam das atividades de extensão universitária da UEMG Unidade Carangola.

---

## 🧭 Menu Dinâmico do Participante

- [1. Consulta de Ações e Eventos Disponíveis](#1-consulta-de-ações-e-eventos-disponíveis)
- [2. Inscrição Online Acessível](#2-inscrição-online-acessível)
- [3. Sua Credencial Digital e QR Code Ed25519](#3-sua-credencial-digital-e-qr-code-ed25519)
- [4. Credenciamento no Dia do Evento](#4-credenciamento-no-dia-do-evento)
- [5. Emissão do Certificado de Extensão Universitária sob Demanda](#5-emissão-do-certificado-de-extensão-universitária-sob-demanda)
- [6. A Chancela Tipográfica Eletrônica Oficial (SEI-MG / Lei 14.063/2020)](#6-a-chancela-tipográfica-eletrônica-oficial-sei-mg--lei-140632020)
- [7. Validação Pública de Autenticidade e Fé Pública](#7-validação-pública-de-autenticidade-e-fé-pública)
- [8. Privacidade e Proteção de Dados (LGPD)](#8-privacidade-e-proteção-de-dados-lgpd)

---

## 1. Consulta de Ações e Eventos Disponíveis

1. Acesse o portal oficial em `https://extensao.carangola.uemg.br`.
2. Na página inicial, role até a seção **"Ações Extensionistas Abertas"** (`#eventos`).
3. Navegue pelos cards das ações homologadas pelo NUPEX.
4. Cada card informa a carga horária em horas, modalidade (presencial, híbrida ou remota), local de realização e código do registro institucional corporativo (SIGA / SUAP).
5. Clique em **"Inscrever-se"** para abrir a landing page com a ementa detalhada da ação (`/eventos/[id]`).

---

## 2. Inscrição Online Acessível

1. Na landing page da ação extensionista, você encontrará a programação completa de sessões e o formulário de inscrição.
2. Preencha seus dados em conformidade com as diretrizes de acessibilidade (WCAG 2.1 AA):
   - **Nome Completo:** Como constará formalmente no seu Certificado Universitário.
   - **E-mail de Contato:** Para avisos e notificações da ação extensionista.
   - **CPF:** Validado pelos dígitos verificadores oficiais da Receita Federal.
3. Marque o checkbox de consentimento do tratamento de dados em conformidade com a LGPD (Lei 13.709/2018).
4. Clique em **"Confirmar Inscrição e Obter Credencial"**.

---

## 3. Sua Credencial Digital e QR Code Ed25519

1. Imediatamente após a confirmação da inscrição, você será redirecionado para a tela da sua **Credencial Virtual** (`/eventos/[id]/credencial/[regId]`).
2. A tela exibe um crachá digital institucional com as cores e brasão oficial da Extensão UEMG.
3. No centro do crachá, é renderizado um **QR Code criptográfico com assinatura assimétrica Ed25519**:
   - Esse QR Code é assinado digitalmente pelo servidor da universidade e contém apenas identificadores seguros e seu CPF mascarado (`***.456.789-**`).
   - A assinatura garante fé pública e permite que os monitores no auditório façam a validação da sua presença **mesmo com o Wi-Fi e a internet 4G/5G totalmente desligados**.
4. Você pode clicar no botão **"Imprimir / Salvar PDF"** para arquivar seu crachá ou tirar um print da tela no seu celular.

---

## 4. Credenciamento no Dia do Evento

1. Ao chegar ao auditório ou espaço acadêmico onde a ação acontecerá, dirija-se à portaria ou mesa de recepção.
2. Apresente o QR Code da sua credencial virtual na tela do celular.
3. O monitor posicionará a câmera do leitor óptico sobre seu QR Code.
4. O leitor valida a assinatura matemática em menos de 10 milissegundos e emite um sinal sonoro de confirmação com card verde indicando sua entrada registrada.

---

## 5. Emissão do Certificado de Extensão Universitária sob Demanda

Assim que o evento for homologado e encerrado pelo NUPEX, participantes com presença confirmada (`attended = true`) podem emitir seu certificado oficial imediatamente:

1. **Acesso Direto pela Credencial:** Ao abrir a página da sua credencial (`/eventos/[id]/credencial/[regId]`), um banner de destaque exibirá:  
   `"Presença Confirmada! Seu certificado oficial já está disponível."` com o botão **"Emitir"**.
2. **Página de Visualização do Certificado (`/certificados/[regId]`):**  
   - O certificado é gerado em memória de forma instantânea (Custo Zero de Armazenamento - R$ 0,00).
   - Apresenta o design institucional oficial da UEMG em formato A4 Paisagem, com moldura dourada e azul-marinho, brasão do Estado de Minas Gerais e texto canônico de certificação.
3. **Impressão e Download em PDF Vetorial:**  
   - Clique no botão **"Imprimir / Salvar em PDF"** no topo da página.
   - O sistema aciona o CSS Print otimizado (`@page { size: A4 landscape; margin: 8mm; }`), ocultando botões de navegação e gerando um arquivo PDF nítido, de alta resolução e com cores institucionais preservadas.

---

## 6. A Chancela Tipográfica Eletrônica Oficial (SEI-MG / Lei 14.063/2020)

Por diretriz de segurança e integridade jurídica, os certificados da UEMG Carangola **não utilizam assinaturas escaneadas em imagem (PNG/JPG)**, eliminando riscos de falsificação ou extração indevida da firma do Coordenador e do Diretor.

No terço inferior do documento, é exibida a **Chancela Tipográfica Eletrônica Padronizada**:
* **Identificação das Autoridades:** Nome do Coordenador de Extensão (NUPEX) e do Diretor da Unidade, acompanhados de seus respectivos MASPs e atos de nomeação/portarias em vigor na data da emissão.
* **Código Verificador Alfanumérico Único:** Exemplo: `CAR-2026-A1B2-C3D4`.
* **Carimbo Criptográfico de Integridade (Hash SHA-256):** Código matemático calculado a partir dos dados do titular, evento, carga horária e carimbo de data/hora UTC.
* **QR Code de Validação Direta:** Permite a conferência imediata da autenticidade por qualquer câmera de smartphone.

---

## 7. Validação Pública de Autenticidade e Fé Pública

Qualquer instituição de ensino, conselho profissional, empresa ou órgão governamental pode confirmar a veracidade do seu certificado em segundos:

1. Acesse o portal em `https://extensao.carangola.uemg.br/validar`.
2. Digite o **Código Verificador** constante na certidão e clique em **"Verificar Autenticidade e Fé Pública"**.
3. Ou, simplesmente aponte a câmera do celular para o QR Code da certidão para ser direcionado a `https://extensao.carangola.uemg.br/validar/[CODIGO]`.
4. A página de validação exibirá o selo verde **"Certidão Autêntica e Válida"**, comprovando:
   - Nome do titular e CPF mascarado (LGPD).
   - Título da ação extensionista e carga horária integralizada.
   - Registro corporativo homologado no SIGA/SUAP.
   - Nome e MASP das autoridades signatárias.
   - Chave criptográfica SHA-256.

> ⚠️ **Atenção:** Caso uma certidão tenha sido cancelada ou retificada administrativamente, a consulta pública exibirá uma **tarja vermelha de revogação** contendo o motivo da anulação e a perda de eficácia jurídica.

---

## 8. Privacidade e Proteção de Dados (LGPD)

O Portal de Extensão da UEMG Carangola cumpre rigorosamente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
* Na página pública de validação de certificados, seu CPF e e-mail são **obrigatoriamente mascarados** (ex: `***.456.789-**` e `u***o@uemg.br`).
* Seus dados pessoais são utilizados estritamente para a finalidade acadêmica de certificação e comprovação de horas complementares.
