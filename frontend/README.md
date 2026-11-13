# BlablaCAMG frontend

Frontend em Next.js + TypeScript para o mural e o cadastro de caronas da CAMG, com Supabase Auth/RLS e assistente encaminhado ao n8n por uma rota server-side.

## Configuração local

1. Instale as dependências com `npm install` dentro de `frontend/`.
2. Copie `.env.example` para `.env.local` e preencha a URL e a chave publicável do Supabase.
3. Configure `N8N_WEBHOOK_URL` com a **Production URL** do workflow. A URL de teste só funciona enquanto o n8n estiver escutando um evento de teste.
4. Execute `npm run dev -- --port 3005` e abra `http://localhost:3005/login` (porta usada nesta sessão).

O assistente usa `N8N_WEBHOOK_AUTH_TOKEN` como cabeçalho `X-Webhook-Secret` quando configurado. Para produção, configure a mesma autenticação de cabeçalho no nó Webhook do n8n e mantenha o valor apenas no ambiente do servidor.

## Supabase

- As tabelas `usuarios` e `caronas` devem existir conforme o esquema documentado em `../agents.md`.
- Aplique o SQL de políticas em `../supabase/migrations/20261112000000_blablacamg_rls.sql` no SQL Editor do Supabase.
- Configure o redirecionamento de confirmação de e-mail do Supabase para `http://localhost:3005/auth/callback` durante o desenvolvimento.
- Cada conta pode consultar e oferecer caronas. Os dados de contato são salvos ao publicar a primeira oferta, com `usuarios.id = auth.users.id`.
- Não coloque `service_role`, segredo do n8n ou `.env.local` no repositório.

## Revisão e execução

- `npm run lint`, `npm run typecheck` e `npm test` verificam o código e os casos de redirecionamento, telefones e fuso horário.
- `npm run build` gera a versão de produção; `npm start` a executa.
- O build na Vercel usa `.next`. Localmente, o build de produção usa `.next-production` para preservar os arquivos do servidor de desenvolvimento.
- A revisão local passou no lint, TypeScript e cinco testes. A compilação concluiu a etapa de código, mas a geração estática foi bloqueada por `EPERM` ao criar diretórios no ambiente restrito; execute `npm run build` no PowerShell local para validar a geração final.
- A seleção semanal permite marcar várias datas ou selecionar os dias de segunda a sexta; a publicação continua sendo um único bulk insert em `caronas`.
- O projeto usa Webpack nos comandos de desenvolvimento e build para evitar uma falha de criação de subprocessos do Turbopack observada neste ambiente Windows.
- Tailwind 3 e a configuração ESLint seguem a base local do Job Tracker. O chat renderiza parágrafos, listas, negrito, itálico e links HTTP(S), sem interpretar HTML ou carregar imagens remotas.
- O mural filtra no Supabase e pagina os resultados. “Minhas caronas” permite desativar e reativar ofertas próprias.
- Não foi feita alteração no banco remoto. O SQL aborta se detectar políticas anteriores não reconhecidas: revise-as antes de aplicar, pois políticas permissivas se somam.
- Registros antigos de motoristas com UUID aleatório não são vinculados automaticamente às novas contas. Confira esses vínculos antes de migrar dados existentes.
- Em Supabase Auth → URL Configuration, adicione as URLs completas de callback (inclusive a de recuperação com `?next=/redefinir-senha`) à lista de redirects permitidos, ajustando a origem local/publicada.
- O navegador chama apenas `/api/assistente`, na mesma origem. A comunicação Next.js → n8n ocorre no servidor e não exige liberar o navegador no CORS do n8n.
- Login identifica uma conta, mas não comprova por si só o vínculo com a CAMG. Restrição por domínio institucional ou aprovação de cadastros exige uma decisão adicional e configuração no Auth.

### Validação com o projeto conectado

Após configurar `.env.local` e aplicar as políticas revisadas: crie duas contas; confirme que um usuário desconectado não consulta caronas nem usa o assistente; publique uma oferta com múltiplas datas; filtre por data/trajeto; teste WhatsApp, recuperação de senha e o retorno `{ "text": "..." }` do n8n; confirme que a segunda conta não consegue alterar ofertas da primeira. Configure Header Auth no webhook antes de publicar para impedir chamadas diretas sem o segredo.
