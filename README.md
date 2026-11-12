# BlablaCAMG

Aplicação de caronas para servidores da Cidade Administrativa de Minas Gerais, com Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL e assistente integrado ao n8n.

## Estrutura

- `frontend/`: autenticação, mural com filtros e paginação, cadastro de caronas em lote, gerenciamento das próprias ofertas e chat.
- `supabase/migrations/`: políticas de acesso para as tabelas `usuarios` e `caronas`.
- `n8n.json`: exportação inicial do fluxo de automação. As alterações do webhook feitas no n8n online ainda precisam ser reexportadas para este arquivo.

## Executar localmente

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
# Preencha .env.local com as configurações do seu projeto.
npm run dev -- --port 3005
```

Abra http://localhost:3005/login. Se `.env.local` já existir, edite-o sem sobrescrevê-lo.

A configuração e os testes estão documentados em [frontend/README.md](frontend/README.md). Todos os usuários precisam de autenticação para acessar caronas e o assistente. O webhook do n8n é chamado pelo servidor, via `/api/assistente`.

## Estado da integração

O frontend está implementado. Ainda é necessário configurar o projeto Supabase e o webhook de produção, revisar/aplicar as políticas RLS e validar o fluxo completo com duas contas distintas. Nenhuma migração é aplicada automaticamente.

Arquivos `.env.local`, dependências e diretórios de build não são versionados. Use somente a chave publicável/anon no frontend; mantenha credenciais privilegiadas fora do código.
