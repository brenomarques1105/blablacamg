# Project Context & Agent Guidelines: BlablaCAMG

## 1. Visão Geral do Projeto

Você está desenvolvendo o frontend web do **BlablaCAMG**, um sistema inteligente de caronas corporativas para os servidores da Cidade Administrativa de Minas Gerais (CAMG), em Belo Horizonte.

* **Objetivo Principal:** Permitir que motoristas cadastrem caronas (direto no Supabase) e que passageiros encontrem a melhor opção conversando com um Assistente de IA (conectado a um webhook do n8n).

* **Estilo Visual:** Moderno, limpo, corporativo mas acessível, focado em usabilidade rápida (Mobile-first, já que servidores usarão muito pelo celular).

## 2. Arquitetura e Stack Tecnológica

* **Frontend:** React (Vite) ou Next.js, estilizado com Tailwind CSS e componentes Lucide Icons / Shadcn UI.

* **Banco de Dados (BaaS):** Supabase (PostgreSQL). O frontend fará leituras e escritas diretas usando `@supabase/supabase-js`.

* **Motor de IA / Automação:** n8n. O frontend **não** processa linguagem natural nem faz o match de rotas; ele envia a requisição do passageiro via HTTP POST para o n8n e exibe a resposta gerada pela LLM.

## 3. Esquema do Banco de Dados (Supabase)

**REGRA ESTRITA:** Nunca invente nomes de tabelas ou colunas. Use exatamente a nomenclatura abaixo ao criar formulários, tipagens TypeScript e queries do Supabase.

### Tabela: `usuarios`

Armazena os servidores (motoristas).

* `id` (UUID, PK, default: `gen_random_uuid()`)
* `nome` (TEXT, Not Null) - Ex: "Jorge"
* `orgao` (TEXT, Not Null) - Sigla do órgão. Ex: "SEPLAG", "FJP", "SEF", "SES", "SECULT", "SEINFRA", "SEDE"
* `telefone` (TEXT) - Formato apenas números com DDD. Ex: "31999999991"

### Tabela: `caronas`

Armazena as ofertas de viagens ativas. Cada linha representa UMA viagem em um dia específico.

* `id` (UUID, PK, default: `gen_random_uuid()`)
* `motorista_id` (UUID, FK referenciando `usuarios.id`)
* `tipo_trajeto` (TEXT, Not Null) - **Valores estritos permitidos:** `'Ida'` ou `'Volta'`.
* `bairro_origem` (TEXT, Not Null) - Se for 'Ida', é o bairro de casa (ex: "Buritis"). Se for 'Volta', é obrigatoriamente `"CAMG"`.
* `rota_principal` (TEXT, Not Null) - Principais vias por onde o motorista passa. Ex: `"Av. Raja Gabaglia, Cristiano Machado, MG-010"`.
* `destino` (TEXT) - Se for 'Ida', o default é `'Cidade Administrativa (CAMG)'`. Se for 'Volta', é o bairro final do motorista (ex: `"Buritis"`).
* `data_carona` (DATE, Not Null) - Formato `YYYY-MM-DD`.
* `horario_saida` (TIME, Not Null) - Formato `HH:MM:SS` ou `HH:MM`.
* `vagas` (INT4, default: `3`)
* `ativa` (BOOL, default: `true`)

## 4. Regras de Negócio do Frontend (UI/UX)

### Módulo 1: Cadastro de Caronas (Visão do Motorista)

1. **Fluxo Simplificado:** O motorista preenche seus dados básicos (ou seleciona seu usuário) e os dados da viagem.

2. **Cadastro em Massa (Rotina Semanal):** 
   * A interface deve permitir que o motorista selecione múltiplas datas de uma vez (ex: um componente de calendário de múltipla escolha ou checkboxes para os dias da semana).
   * No momento de salvar, o frontend deve mapear essas datas selecionadas e disparar um **Bulk Insert** (inserir um array de objetos) na tabela `caronas` do Supabase. Assim, a mesma rota e horário são multiplicados pelas datas escolhidas em uma única transação.

3. **Comportamento Dinâmico de Ida/Volta:**
   * Quando o motorista seleciona **Ida**: O campo `destino` deve ser preenchido e travado automaticamente como `"Cidade Administrativa (CAMG)"`. O motorista digita apenas o seu `bairro_origem`.
   * Quando o motorista seleciona **Volta**: O campo `bairro_origem` deve ser preenchido e travado automaticamente como `"CAMG"`. O motorista digita para qual bairro está voltando no campo `destino`.

4. **Dica de Rota:** O campo `rota_principal` deve ter um *placeholder* claro instruindo o motorista a colocar as avenidas principais (ex: *"Av. Antônio Carlos, Pedro I, MG-010"*), pois a IA usa esse texto para dar match com passageiros no meio do caminho.

### Módulo 2: Mural de Caronas (Visão Geral)

* A tela inicial deve exibir cards com as próximas caronas ativas (`ativa = true`), fazendo um `JOIN` simples com a tabela `usuarios` (`select('*, usuarios(nome, orgao, telefone)')`).
* Deve haver filtros rápidos visuais por `tipo_trajeto` (Ida / Volta) e data.
* Cada card deve ter um botão direto "Chamar no WhatsApp" que abre o link `https://wa.me/55{telefone}` com uma mensagem pré-pronta.

### Módulo 3: Assistente de IA (Visão do Passageiro)

* Deve haver um **Botão Flutuante (FAB)** ou uma aba de destaque chamada **"Assistente IA de Caronas"**.
* Ao abrir o modal/drawer do assistente, o passageiro **não** deve preencher vários campos complexos. A interface deve ter apenas:
  1. Um seletor rápido (Radio ou Segmented Control): **`Ida (Para a CAMG)`** ou **`Volta (Saindo da CAMG)`**.
  2. Uma caixa de texto estilo chat onde o usuário digita livremente (ex: *"Preciso ir amanhã saindo do Caiçara perto das 07:40"*).

* **Integração com n8n:**
  * Ao enviar, o frontend faz um `POST` para a URL do Webhook do n8n (deixar configurável via variável de ambiente `VITE_N8N_WEBHOOK_URL`).
  * O payload enviado deve conter o tipo de trajeto selecionado e a mensagem de texto livre.
  * Enquanto aguarda a resposta (que leva alguns segundos devido ao processamento da LLM), exibir um *loading state* amigável (ex: *"Analisando rotas e horários dos motoristas..."*).
  * A resposta do n8n virá em formato JSON contendo o texto final da IA (ex: `{ "text": "Encontrei uma ótima opção com o Jorge..." }`). Renderize esse texto no chat com suporte a Markdown (para destacar negritos e transformar o número de telefone citado pela IA em um botão clicável para o WhatsApp).

## 5. Regras de Negócio da IA (Contexto do que acontece no Backend n8n)

*Nota para o Agente de Código: Você não precisa programar a lógica abaixo no frontend, mas deve conhecê-la para construir uma interface coerente com as respostas do assistente.*

* A IA no n8n extrai bairro, rua, data e horário do texto livre do usuário.
* A IA filtra estritamente pela mesma data e mesmo `tipo_trajeto`.
* **Tolerância de Horário:** A IA aceita motoristas que saiam com até **45 minutos** de diferença do horário pedido pelo passageiro.
* **Inteligência Geográfica:** A IA conhece os bairros e avenidas de Belo Horizonte. Mesmo que o passageiro não more no mesmo bairro de origem do motorista, a IA recomenda a carona se a `rota_principal` passar estrategicamente perto.
## 6. Decisões de implementação do frontend (aprovadas em 12/11/2026)

* **Stack selecionada:** Next.js App Router, TypeScript e Tailwind CSS. Não usar Vite.
* **Autenticação:** a mesma conta autenticada pode consultar e oferecer caronas e usar o assistente. O cadastro não exige escolher um perfil. A linha em `usuarios` guarda os dados de contato de quem oferece carona.
* **Vínculo e autorização:** para motoristas, `usuarios.id` deve ser igual ao UUID do usuário autenticado e `caronas.motorista_id` deve corresponder a esse UUID. Aplicar autorização com RLS, sem acrescentar colunas.
* **Segredos:** não usar `service_role` no navegador. A chamada ao n8n passa por uma rota server-side do Next.js (`/api/assistente`), com a URL em `N8N_WEBHOOK_URL` (sem prefixo `NEXT_PUBLIC_`).
* **Contrato n8n confirmado:** POST JSON com `tipo_trajeto` (`Ida` ou `Volta`) e `mensagem`; resposta JSON com `text`.
