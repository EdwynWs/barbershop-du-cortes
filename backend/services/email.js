import nodemailer from 'nodemailer';
import { query } from '../config/db.js';

let transportador;

function obterTransportador() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new Error('Configure as variáveis SMTP no backend/.env.');
    }

    if (!transportador) {
        const porta = Number(SMTP_PORT || 465);

        transportador = nodemailer.createTransport({
            host: SMTP_HOST,
            port: porta,
            secure: porta === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }

    return transportador;
}

export async function enviarConfirmacaoAgendamento(agendamentoId) {
    const resultado = await query(
        `
            SELECT
                cliente.usu_nome AS cliente,
                cliente.usu_email AS email,
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

    if (!agendamento?.email) {
        throw new Error('Agendamento ou e-mail do cliente não encontrado.');
    }

    const valor = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(agendamento.valor));

    const mensagem = [
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
        'Você pode consultar seu agendamento na área Minha agenda.',
        '',
        'Te esperamos!',
        'Barbershop Du Cortes',
    ].join('\n');

    const envio = await obterTransportador().sendMail({
        from: {
            name: 'Barbershop Du Cortes',
            address: process.env.SMTP_USER,
        },
        to: agendamento.email,
        subject: 'Seu agendamento foi marcado — Du Cortes',
        text: mensagem,
    });

    if (!envio.accepted?.length) {
        throw new Error('O servidor de e-mail não aceitou o destinatário.');
    }
}