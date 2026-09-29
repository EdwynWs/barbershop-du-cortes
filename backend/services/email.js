import { query } from '../config/db.js';

function configuracaoBrevo() {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const email = process.env.EMAIL_FROM?.trim();

    if (!apiKey || !email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error(
            'Configure BREVO_API_KEY e EMAIL_FROM com um remetente verificado na Brevo.'
        );
    }

    return { apiKey, email };
}

async function chamarBrevo(caminho, options = {}) {
    const { apiKey } = configuracaoBrevo();

    const response = await fetch(
        'https://api.brevo.com/v3' + caminho,
        {
            ...options,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'api-key': apiKey,
            },
            signal: AbortSignal.timeout(15000),
        }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const motivos = {
            400: 'Confira o remetente verificado e os dados da mensagem.',
            401: 'Confira a chave de API da Brevo.',
            403: 'Confira a ativação da conta e as permissões da chave na Brevo.',
            429: 'Limite de envio atingido. Consulte sua cota na Brevo.',
        };

        const motivo =
            motivos[response.status] ||
            'Falha no provedor de e-mail. Consulte os logs da Brevo.';

        const error = new Error(
            `Brevo HTTP ${response.status}: ${motivo}`
        );

        error.code = `BREVO_${response.status}`;

        throw error;
    }

    return data;
}

// Confere a chave sem enviar e-mail.
// Não garante que o remetente esteja aprovado ou que a mensagem será entregue.
export async function verificarEmail() {
    await chamarBrevo('/account');
}

export async function enviarMensagem(destinatario, assunto, texto) {
    if (!destinatario?.trim()) {
        throw new Error(
            'O endereço de e-mail do destinatário não foi informado.'
        );
    }

    const { email } = configuracaoBrevo();

    const resultado = await chamarBrevo('/smtp/email', {
        method: 'POST',
        body: JSON.stringify({
            sender: {
                name: 'Barbershop Du Cortes',
                email,
            },
            to: [
                {
                    email: destinatario.trim(),
                },
            ],
            subject: assunto,
            textContent: texto,
        }),
    });

    if (!resultado?.messageId) {
        throw new Error(
            'A Brevo não confirmou a aceitação da mensagem.'
        );
    }
}
export async function enviarConfirmacaoAgendamento(agendamentoId) {
    const resultado = await query(
        `
            SELECT
                cliente.usu_nome AS cliente,
                cliente.usu_email AS email_cliente,
                cliente.usu_telefone AS telefone_cliente,
                barbeiro.usu_nome AS barbeiro,
                s.ser_nome AS servico,
                TO_CHAR(a.age_data, 'DD/MM/YYYY') AS data,
                TO_CHAR(a.age_hora_inicio, 'HH24:MI') AS horario,
                a.age_valor AS valor
            FROM tb_agendamento a
            JOIN tb_cliente c ON c.cli_id = a.cli_id
            JOIN tb_usuario cliente ON cliente.usu_id = c.usu_id
            JOIN tb_barbeiro b ON b.bar_id = a.bar_id
            JOIN tb_usuario barbeiro ON barbeiro.usu_id = b.usu_id
            JOIN tb_servico s ON s.ser_id = a.ser_id
            WHERE a.age_id = $1
        `,
        [agendamentoId]
    );

    const agendamento = resultado.rows[0];

    if (!agendamento) {
        throw new Error('Agendamento não encontrado para enviar os avisos.');
    }

    const valor = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(agendamento.valor));

    const mensagemCliente = [
        `Olá, ${agendamento.cliente}!`,
        '',
        'Seu agendamento na Barbershop Du Cortes foi marcado com sucesso.',
        '',
        `Serviço: ${agendamento.servico}`,
        `Barbeiro: ${agendamento.barbeiro}`,
        `Data: ${agendamento.data}`,
        `Horário: ${agendamento.horario}`,
        `Valor: ${valor}`,
        '',
        'Consulte os detalhes na área Minha agenda do sistema.',
        '',
        'Te esperamos!',
        'Barbershop Du Cortes',
    ].join('\n');

    const mensagemBarbeiro = [
        `Olá, ${agendamento.barbeiro}!`,
        '',
        'Você recebeu um novo agendamento.',
        '',
        `Cliente: ${agendamento.cliente}`,
        `Telefone: ${agendamento.telefone_cliente || 'Não informado'}`,
        `Serviço: ${agendamento.servico}`,
        `Data: ${agendamento.data}`,
        `Horário: ${agendamento.horario}`,
        `Valor: ${valor}`,
        '',
        `Número do agendamento: ${agendamentoId}`,
        '',
        'Acesse a agenda do sistema para acompanhar o atendimento.',
    ].join('\n');

    // São mensagens separadas.
    // Se uma falhar, a outra ainda será tentada.
    const resultados = await Promise.allSettled([
        enviarMensagem(
            agendamento.email_cliente,
            'Seu agendamento foi marcado — Du Cortes',
            mensagemCliente
        ),
        enviarMensagem(
            process.env.BARBEIRO_EMAIL,
            `Novo agendamento — ${agendamento.data} às ${agendamento.horario}`,
            mensagemBarbeiro
        ),
    ]);

    const destinatarios = ['cliente', 'barbeiro'];

    resultados.forEach((resultadoEnvio, indice) => {
        const destinatario = destinatarios[indice];

        if (resultadoEnvio.status === 'fulfilled') {
            console.log(
                `E-mail do ${destinatario} aceito pelo servidor — agendamento ${agendamentoId}.`
            );

            return;
        }

        const erro = resultadoEnvio.reason;

        console.error(
            `Falha no e-mail do ${destinatario} — agendamento ${agendamentoId}:`,
            {
                codigo: erro.code,
                mensagem: erro.message,
                respostaSMTP: erro.response,
            }
        );
    });
}