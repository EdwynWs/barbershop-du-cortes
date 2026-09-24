const endpoints = {
    '/api/admin/barbeiros': ['get'],
    '/api/auth/cadastro': ['post'],
    '/api/auth/login': ['post'],
    '/api/auth/logout': ['post'],
    '/api/auth/me': ['get'],
    '/api/auth/perfil': ['put'],
    '/api/servicos': ['get', 'post'],
    '/api/servicos/{id}': ['put', 'delete'],
    '/api/barbeiros': ['get', 'post'],
    '/api/barbeiros/{id}': ['patch'],
    '/api/horarios-disponiveis': ['get'],
    '/api/agendamentos': ['post'],
    '/api/agendamentos/meus': ['get'],
    '/api/agendamentos/{id}/status': ['put'],
    '/api/agendamentos/{id}/cancelar': ['put'],
    '/api/avaliacoes': ['post'],
    '/api/promocoes': ['get'],
    '/api/notificacoes': ['get'],
    '/api/notificacoes/{id}': ['patch'],
    '/api/admin/agendamentos/{id}': ['put'],
    '/api/admin/dashboard': ['get'],
    '/api/dashboard/faturamento-total': ['get'],
    '/api/admin/dashboard/carro-chefe': ['get'],
    '/api/admin/dashboard/melhor-dia': ['get'],
    '/api/admin/clientes': ['get'],
    '/api/admin/clientes/{id}': ['get'],
    '/api/admin/clientes-inativos': ['get'],
    '/api/admin/agenda': ['get'],
    '/api/admin/financeiro': ['get'],
    '/api/admin/pagamentos': ['post'],
    '/api/admin/despesas': ['post'],
    '/api/admin/promocoes': ['post'],
    '/api/admin/imagens': ['post'],
    '/api/admin/relatorios/{type}': ['get'],
};
const paths = Object.fromEntries(
    Object.entries(endpoints).map(([url, methods]) => [
        url,
        Object.fromEntries(
            methods.map((method) => [
                method,
                {
                    summary: `${method.toUpperCase()} ${url}`,
                    security:
                        url.includes('/auth/login') ||
                        url.includes('/auth/cadastro') ||
                        (url === '/api/servicos' && method === 'get') ||
                        (url === '/api/barbeiros' && method === 'get') ||
                        (url === '/api/promocoes' && method === 'get') ||
                        url === '/api/horarios-disponiveis'
                            ? []
                            : [{ cookieAuth: [] }],
                    parameters: [
                        ...Array.from(url.matchAll(/\{(\w+)\}/g), (m) => ({
                            in: 'path',
                            name: m[1],
                            required: true,
                            schema: { type: 'string' },
                        })),
                        ...(url === '/api/horarios-disponiveis'
                            ? ['barbeiro', 'servico', 'data'].map((name) => ({
                                  in: 'query',
                                  name,
                                  required: true,
                                  schema: { type: 'string' },
                              }))
                            : []),
                    ],
                    ...(method === 'post' || method === 'put' || method === 'patch'
                        ? {
                              requestBody: {
                                  content: {
                                      'application/json': { schema: { type: 'object' } },
                                  },
                              },
                          }
                        : {}),
                    responses: {
                        200: { description: 'Sucesso' },
                        400: { description: 'Dados inválidos' },
                        401: { description: 'Não autenticado' },
                        403: { description: 'Sem permissão' },
                    },
                },
            ])
        ),
    ])
);
export default {
    openapi: '3.0.3',
    info: {
        title: 'Barbershop Du Cortes API',
        version: '1.0.0',
        description: 'API de agendamento e gestão; horários em America/Sao_Paulo.',
    },
    servers: [{ url: '/' }],
    components: {
        securitySchemes: {
            cookieAuth: { type: 'apiKey', in: 'cookie', name: 'session' },
        },
    },
    paths,
};
