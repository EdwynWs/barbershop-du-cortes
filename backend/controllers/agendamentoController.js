import { pool, query } from '../config/db.js';
import { slots } from '../services/slots.js';
import { validDate, validTime, clock, minutes, statuses } from '../entities/appointment.js';
import { fail } from '../middlewares/error.js';
import { enviarConfirmacaoAgendamento } from '../services/email.js';
export async function available(req, res) {
    res.json(await slots(req.query.barbeiro, req.query.servico, req.query.data));
}
export async function create(req, res) {
    const { clienteId, barbeiroId, servicoId, data, hora, observacao } = req.body;
    if (!validDate(data) || !validTime(hora)) fail('Data ou horário inválido');
    let cli;
    if (req.user.tipo === 'CLIENTE') {
        const x = await query('SELECT cli_id FROM tb_cliente WHERE usu_id=$1', [req.user.id]);
        cli = x.rows[0]?.cli_id;
    } else {
        if (req.user.tipo !== 'ADMIN') fail('Sem permissão', 403);
        cli = Number(clienteId);
    }
    if (!cli) fail('Cliente inválido');
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        const {
            rows: [service],
        } = await c.query(
            'SELECT ser_valor,ser_duracao FROM tb_servico WHERE ser_id=$1 AND ser_ativo',
            [servicoId]
        );
        const {
            rows: [barber],
        } = await c.query(
            `
                SELECT 1
                FROM tb_barbeiro_servico bs
                JOIN tb_barbeiro b ON b.bar_id=bs.bar_id
                WHERE bs.bar_id=$1
                    AND bs.ser_id=$2
                    AND b.bar_ativo
            `,
            [barbeiroId, servicoId]
        );
        if (!service || !barber) fail('Serviço ou barbeiro indisponível');
        await c.query('SELECT pg_advisory_xact_lock($1,$2)', [
            Number(barbeiroId),
            Number(data.replaceAll('-', '')),
        ]);
        if (!(await slots(barbeiroId, servicoId, data)).includes(hora))
            fail('Horário indisponível', 409);
        const end = clock(minutes(hora) + service.ser_duracao);
        const {
            rows: [a],
        } = await c.query(
            `
                INSERT INTO tb_agendamento(cli_id,bar_id,ser_id,age_data,age_hora_inicio,age_hora_fim,age_valor,age_observacao)
                VALUES($1,$2,$3,$4,$5,$6,$7,$8)
                RETURNING *
            `,
            [cli, barbeiroId, servicoId, data, hora, end, service.ser_valor, observacao || null]
        );
        await c.query(
            `
                INSERT INTO tb_notificacao(usu_id,not_titulo,not_mensagem) SELECT usu_id,
                    'Agendamento realizado',
                    'Seu horário foi agendado para '||$2::text||' às '||$3::text
                FROM tb_cliente
                WHERE cli_id=$1
            `,
            [cli, data, hora]
        );
        await c.query('COMMIT');

    // O agendamento já foi salvo.
    // Uma falha no e-mail não deve cancelar a reserva.
    void enviarConfirmacaoAgendamento(a.age_id).catch((error) => {
        console.error(
            `Falha ao preparar os avisos do agendament ${a.age_id}:`,
            error.code || error.message
        );
    });

    res.status(201).json(a);
    } catch (e) {
        await c.query('ROLLBACK');
        throw e;
    } finally {
        c.release();
    }
}
export async function mine(req, res) {
    const sql = req.user.tipo === 'CLIENTE' ? 'WHERE c.usu_id=$1' : 'WHERE b.usu_id=$1';
    const { rows } = await query(
        `
            SELECT a.*,
                s.ser_nome,
                u.usu_nome AS barbeiro,
                uc.usu_nome AS cliente
            FROM tb_agendamento a
            JOIN tb_servico s ON s.ser_id=a.ser_id
            JOIN tb_barbeiro b ON b.bar_id=a.bar_id
            JOIN tb_usuario u ON u.usu_id=b.usu_id
            JOIN tb_cliente c ON c.cli_id=a.cli_id
            JOIN tb_usuario uc ON uc.usu_id=c.usu_id ${sql}
            ORDER BY a.age_data DESC,
                a.age_hora_inicio DESC
        `,
        [req.user.id]
    );
    res.json(rows);
}
export async function change(req, res) {
    const id = Number(req.params.id),
        status = req.body.status;
    if (!statuses.includes(status)) fail('Status inválido');
    const {
        rows: [a],
    } = await query(
        `
            SELECT a.*,
                c.usu_id AS client_user,
                b.usu_id AS barber_user
            FROM tb_agendamento a
            JOIN tb_cliente c ON c.cli_id=a.cli_id
            JOIN tb_barbeiro b ON b.bar_id=a.bar_id
            WHERE a.age_id=$1
        `,
        [id]
    );
    if (!a) fail('Agendamento não encontrado', 404);
    if (req.user.tipo === 'CLIENTE') {
        if (a.client_user !== req.user.id || status !== 'CANCELADO') fail('Sem permissão', 403);
        const start = new Date(
            `${a.age_data.toISOString().slice(0, 10)}T${a.age_hora_inicio}-03:00`
        );
        if (
            !['AGENDADO', 'CONFIRMADO'].includes(a.age_status) ||
            start.getTime() - Date.now() < 2 * 3600000
        )
            fail('Cancelamento permitido até duas horas antes', 409);
    } else if (req.user.tipo === 'BARBEIRO') {
        if (
            a.barber_user !== req.user.id ||
            !['CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'NAO_COMPARECEU'].includes(status)
        )
            fail('Sem permissão', 403);
    }
    const transitions = {
        AGENDADO: ['CONFIRMADO', 'CANCELADO', 'NAO_COMPARECEU'],
        CONFIRMADO: ['EM_ATENDIMENTO', 'CANCELADO', 'NAO_COMPARECEU'],
        EM_ATENDIMENTO: ['CONCLUIDO'],
        CONCLUIDO: [],
        CANCELADO: [],
        NAO_COMPARECEU: [],
    };
    if (!transitions[a.age_status].includes(status)) fail('Mudança de status inválida', 409);
    const {
        rows: [updated],
    } = await query(
        'UPDATE tb_agendamento SET age_status=$1 WHERE age_id=$2 AND age_status=$3 RETURNING *',
        [status, id, a.age_status]
    );
    if (!updated) fail('Status alterado por outra pessoa', 409);
    await query(
        "INSERT INTO tb_notificacao(usu_id,not_titulo,not_mensagem) VALUES($1,'Atualização do agendamento',$2)",
        [a.client_user, `Seu atendimento agora está ${status.toLowerCase().replaceAll('_', ' ')}.`]
    );
    res.json(updated);
}
