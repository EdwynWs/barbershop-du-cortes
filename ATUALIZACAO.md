# Atualização do visual e da organização do código

Esta versão usa o mesmo banco e as mesmas 13 tabelas da versão anterior. Não rode novamente `schema.sql` ou os seeds para atualizar um banco que já está funcionando.

## Como trocar a versão no Windows

1. Pare os dois terminais com `Ctrl+C`.
2. Extraia este ZIP em uma **pasta nova**, para não deixar arquivos antigos junto dos reorganizados.
3. Copie `backend/.env` e o conteúdo de `backend/uploads` da versão anterior para os mesmos lugares na nova pasta.
4. Copie `frontend/.env.local` da versão anterior para a nova pasta `frontend`.
5. No terminal da nova pasta `backend`, rode `npm install` e `npm run dev`.
6. Em outro terminal, na nova pasta `frontend`, rode `npm install` e `npm run dev`.
7. Abra `http://localhost:3000`. Seus usuários, clientes e agendamentos continuam no banco existente.

Se você ainda não criou os arquivos de ambiente, copie os exemplos e preencha sua senha do PostgreSQL. O nome correto é `.env` no backend e `.env.local` no frontend.

## Onde encontrar cada parte

| O que você quer alterar | Onde editar |
| --- | --- |
| Início do cliente | `frontend/features/cliente/HomePage.js` |
| Etapas do agendamento | `frontend/features/cliente/BookingPage.js` |
| Dashboard | `frontend/features/admin/DashboardPage.js` |
| Agenda administrativa | `frontend/features/admin/AgendaPage.js` |
| Tela de serviços | `frontend/features/admin/ServicesPage.js` |
| Tela de barbeiros | `frontend/features/admin/BarbersPage.js` |
| Menu lateral e inferior | `frontend/components/layout/AppShell.js` |
| Cards, avisos, fotos e janelas | `frontend/components/ui` |
| Calendário e listas | `frontend/components/cliente` |
| Cores, fontes e botões | `frontend/styles/base.css` |
| Visual do cliente | `frontend/styles/cliente.css` |
| Visual administrativo | `frontend/styles/admin.css` |
| Ajustes de celular/tablet | `frontend/styles/responsive.css` |
| Caminhos das imagens | `frontend/config/imagens.js` |
| Rotas de serviços | `backend/routes/servicoRoute.js` |
| Validação de serviços | `backend/entities/servicoEntity.js` |
| Requisições de serviços | `backend/controllers/servicoController.js` |
| SQL de serviços | `backend/repositories/servicoRepository.js` |
| Autenticação | `backend/controllers/authController.js` e `repositories/usuarioRepository.js` |
| Cálculo de disponibilidade | `backend/services/slots.js` |

As pastas `app/cliente`, `app/admin` e `app/barbeiro` agora têm uma pasta por endereço. Cada `page.js` aponta para sua própria tela. Não há mais uma página enorme escolhendo todas as telas com condicionais.

O código usa indentação de 4 espaços. Os arquivos `.editorconfig` e `.prettierrc.json` mantêm esse padrão ao formatar no editor.

## Adicionar as fotos depois

Você tem duas opções:

- **Painel administrativo:** em Serviços e Barbeiros, escolha uma foto no formulário e salve. O backend grava em `uploads` com um nome único e guarda o caminho no banco.
- **Fotos fixas do layout:** coloque as fotos em `frontend/public/images`, usando os nomes abaixo. Não precisa alterar o banco.

| Foto | Caminho a partir de `frontend/public` |
| --- | --- |
| Logo (preferencialmente PNG transparente) | `images/logo.png` |
| Ambiente da barbearia, login e apresentação | `images/ambiente.jpg` |
| Banner principal da área do cliente | `images/banner-corte.jpg` |
| Foto fixa do perfil | `images/perfil.jpg` |
| Corte | `images/servicos/corte.jpg` |
| Barba | `images/servicos/barba.jpg` |
| Corte + barba | `images/servicos/corte-barba.jpg` |
| Sobrancelha | `images/servicos/sobrancelha.jpg` |
| Pigmentação | `images/servicos/pigmentacao.jpg` |
| Tratamento capilar | `images/servicos/tratamento.jpg` |
| Lucas | `images/barbeiros/lucas.jpg` |
| Rafael | `images/barbeiros/rafael.jpg` |
| Mateus | `images/barbeiros/mateus.jpg` |
| Gustavo | `images/barbeiros/gustavo.jpg` |
| Du Cortes | `images/barbeiros/du.jpg` |

Para barbeiros adicionais, o nome padrão da foto é a primeira palavra do nome cadastrado em minúsculas, seguida de `.jpg`. Você também pode enviar a foto diretamente no painel, sem depender desse nome.

Imagens enviadas pelo painel têm prioridade sobre as fotos fixas. Enquanto faltarem fotos, o sistema mostra um espaço com ícone; a página continua utilizável. O enquadramento usa `object-fit: cover`. Ajuste `object-position` em `styles/images.css` se precisar enquadrar uma foto específica.

## Referência de organização

O endereço `https://github.com/EdwynWs/Projeto-JC` retornou 404 na conexão disponível. Portanto, esta versão usa as referências visuais anexadas e a divisão Controller / Repository / Entity / Routes, mas não afirma reproduzir detalhes do código daquele repositório que não puderam ser lidos.

## Verificação desta versão

- O build de produção do frontend terminou sem erros (24 páginas geradas pelo Next.js).
- Foram verificadas as 16 telas de cliente e administrador em 320, 390, 768 e 1440 px, sem rolagem horizontal e sem exceções JavaScript. Depois dos ajustes finais, as telas afetadas foram verificadas novamente.
- O fluxo de agendamento foi percorrido até a confirmação; o menu Mais e a janela de recebimento foram abertos no celular. Esses testes usaram respostas simuladas da API.
- No backend, foram verificados carregamento de módulos, proteção das rotas, restrição por perfil, validações das entidades, upload e exibição da imagem em outra porta.
- As consultas e transações não foram executadas contra um PostgreSQL real neste ambiente. Confira login, serviços e um agendamento no seu banco local depois de iniciar os dois servidores.

Os testes não inserem dados de demonstração no seu banco. O sistema entregue usa a API real configurada em `frontend/.env.local`.