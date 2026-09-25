import nodemailer from 'nodemailer';
import { query } from '../config/db.js';

let transportador;

function obterTransportador() {
    const usuario = process.env.SMTP_USER?.trim();
    const senha = process.env.SMTP_PASS?.replace(/\s/g, '');

    if (!usuario || !senha) {
        throw new Error('Preencha SMTP_USER e SMTP_PASS no backend/.env.');
    }

    if (!transportador) {
        const porta = Number(process.env.SMTP_PORT || 465);

        transportador = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: porta,
            secure: porta === 465,
            auth: {
                user: usuario,
                pass: senha,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }

    return transportador;
}

// Testa a conexão e a autenticação, sem enviar mensagem.
export async function verificarEmail() {
    await obterTransportador().verify();
}

export async function enviarMensagem(destinatario, assunto, texto) {
    if (!destinatario?.trim()) {
        throw new Error('O endereço de e-mail do destinatário não foi informado.');
    }

    const resultado = await obterTransportador().sendMail({
        from: {
            name: 'Barbershop Du Cortes',
            address: process.env.SMTP_USER.trim(),
        },
        to: destinatario.trim(),
        subject: assunto,
        text: texto,
    });

    if (!resultado.accepted?.length) {
        throw new Error('O servidor não aceitou o destinatário.');
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