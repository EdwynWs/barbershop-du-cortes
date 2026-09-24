# Barbershop Du Cortes — visual e estrutura revisados

Se você já instalou a versão anterior, leia primeiro **ATUALIZACAO.md**. Ele explica como preservar o banco, os arquivos de ambiente e as fotos, e mostra onde editar cada parte.

Sistema de agendamento e gestão para barbearia com Next.js, Express e PostgreSQL. O horário comercial é interpretado em `America/Sao_Paulo`.

## Instalação local

1. Crie um banco PostgreSQL chamado `barbershop` e execute `backend/db/schema.sql` com `psql -d barbershop -f backend/db/schema.sql` (ou pelo pgAdmin). A extensão `btree_gist` precisa estar disponível.
2. Em `backend`, copie `.env.example` para `.env`, defina `DATABASE_URL`, um `JWT_SECRET` aleatório com pelo menos 32 caracteres e `ADMIN_PASSWORD`. Rode `npm install`, `npm run seed`, `npm run dev`. API: `http://localhost:4000`; documentação: `http://localhost:4000/api-docs`.
3. Em `frontend`, copie `.env.example` para `.env.local`, configure `NEXT_PUBLIC_API_URL`, rode `npm install`, `npm run dev`. Aplicação: `http://localhost:3000`.

O seed cria um administrador (`ADMIN_EMAIL`), quatro barbeiros, vinte clientes e serviços, pagamentos, avaliações e despesas. As senhas dos perfis de demonstração usam `ADMIN_PASSWORD`. Como alternativa, execute `backend/db/seed.sql` (senha de demonstração `TroqueEstaSenha123!`). Execute apenas uma das opções em ambientes de demonstração. Altere as senhas antes de expor a aplicação.

## Publicação

Configure PostgreSQL gerenciado e aplique o schema. Publique `backend` em uma plataforma Node.js com `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`; comando `npm start`. Publique `frontend` como Next.js com `NEXT_PUBLIC_API_URL` apontando para a API. HTTPS é obrigatório para cookies `secure`. API e frontend devem usar domínios do mesmo site para cookies `SameSite=Lax`; para domínios diferentes, ajuste os cookies e proteção CSRF de acordo com a arquitetura de hospedagem.

O upload salva imagens em `backend/uploads` e exige volume persistente em produção. Para hospedagem sem disco persistente, substitua esse armazenamento por um bucket de objetos antes de usar imagens reais.

## Regras principais

Agendamentos são validados no servidor pelo expediente, pausas, bloqueios, duração e ocupação. Uma restrição de exclusão no PostgreSQL também impede horários sobrepostos do mesmo barbeiro. Cancelamento pelo cliente é permitido até duas horas antes do atendimento. Receita considera pagamentos `PAGO` de atendimentos `CONCLUIDO`; lucro subtrai despesas. Valores monetários usam `NUMERIC` no banco.
