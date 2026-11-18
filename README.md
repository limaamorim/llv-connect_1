# LLV Connect

Site e painel administrativo da loja (React + TypeScript + Vite + Tailwind + Supabase).

## 1. Instalar e rodar
```bash
npm install
cp .env.example .env     # preencha com os dados do seu projeto Supabase
npm run dev              # abre em http://localhost:5173
npm run build            # gera a pasta dist/ (verifica erros de TypeScript)
```

## 2. Configurar o Supabase
1. Crie um projeto em supabase.com.
2. Em **Project Settings > API**, copie a *Project URL* e a chave **anon public** para o `.env` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`). **Nunca** use a chave `service_role` no projeto.
3. Em **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e execute. Isso cria tabelas, regras de segurança (RLS), funções de venda/cancelamento, o bucket de imagens e dados iniciais.

## 3. Criar o administrador
1. Em **Authentication > Users > Add user**, crie um usuário com e-mail e senha (marque "Auto Confirm User").
2. No **SQL Editor**, rode (trocando o e-mail):
```sql
insert into admins (user_id) select id from auth.users where email = 'seu@email.com';
```
3. Acesse `/admin` e entre. Só usuários na tabela `admins` conseguem gerenciar a loja.

## 4. Personalizar
- WhatsApp, Instagram, endereço e horário: `src/lib/configuracaoLoja.ts`.
- Logo: coloque `public/logo.png`.
- Cores: `tailwind.config.js` (grupo `marca`).

## 5. Publicar no Netlify
1. Envie o projeto para um repositório no GitHub.
2. No Netlify: **Add new site > Import from Git**. Build command: `npm run build`. Publish directory: `dist`.
3. Em **Site settings > Environment variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Faça o deploy. O arquivo `public/_redirects` já faz as rotas `/catalogo` e `/admin` funcionarem.
5. No Supabase, em **Authentication > URL Configuration**, coloque o endereço do seu site no Netlify.

## Estrutura
- `pages/`: telas (Inicio, Catalogo, admin/PainelAdmin, admin/Login)
- `components/`: peças reutilizáveis (FiltroCelular, CartaoProduto...) e `components/admin/` (telas do painel)
- `services/`: conversa com o Supabase
- `types/`, `utils/`, `lib/`: tipos, formatadores e configurações
