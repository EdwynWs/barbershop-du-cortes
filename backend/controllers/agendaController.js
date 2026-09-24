import { pool, query } from '../config/db.js';
import { fail } from '../middlewares/error.js';
import { slots } from '../services/slots.js';
import { validDate, validTime, minutes, clock } from '../entities/appointment.js';

export async function agenda(req, res) {
    const { rows } = await query(
        `
            SELECT a.*,
                s.ser_nome,
                uc.usu_nome AS cliente,
                ub.usu_nome AS barbeiro
            FROM tb_agendamento a
            JOIN tb_servico s ON s.ser_id=a.ser_id
            JOIN tb_cliente c ON c.cli_id=a.cli_id
            JOIN tb_usuario uc ON uc.usu_id=c.usu_id
            JOIN tb_barbeiro b ON b.bar_id=a.bar_id
            JOIN tb_usuario ub ON ub.usu_id=b.usu_id
            WHERE a.age_data BETWEEN $1
                AND $2
                AND ($3::bigint IS NULL OR a.bar_id=$3)
            ORDER BY a.age_data,
                a.age_hora_inicio
        `,
        [req.query.inicio, req.query.fim, req.query.barbeiro || null]
    );
    res.json(rows);
}

export async function reschedule(req, res) {
    const { data, hora } = req.body,
        id = Number(req.params.id);
    if (!validDate(data) || !validTime(hora)) fail('Data ou horário inválido');
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        const {
            rows: [existing],
        } = await c.query('SELECT bar_id FROM tb_agendamento WHERE age_id=$1', [id]);
        if (!existing) fail('Agendamento não encontrado', 404);
        await c.query('SELECT pg_advisory_xact_lock($1,$2)', [
            Number(existing.bar_id),
            Number(data.replaceAll('-', '')),
        ]);
        const {
            rows: [a],
        } = await c.query('SELECT * FROM tb_agendamento WHERE age_id=$1 FOR UPDATE', [id]);
        if (!['AGENDADO', 'CONFIRMADO'].includes(a.age_status))
            fail('Status não permite reagendamento', 409);
        if (!(await slots(a.bar_id, a.ser_id, data, id)).includes(hora))
            fail('Horário indisponível', 409);
        const {
            rows: [s],
        } = await c.query('SELECT ser_duracao FROM tb_servico WHERE ser_id=$1', [a.ser_id]);
        const end = clock(minutes(hora) + s.ser_duracao);
        const {
            rows: [updated],
        } = await c.query(
            'UPDATE tb_agendamento SET age_data=$1,age_hora_inicio=$2,age_hora_fim=$3 WHERE age_id=$4 RETURNING *',
            [data, hora, end, id]
        );
        await c.query('COMMIT');
        res.json(updated);
    } catch (e) {
        await c.query('ROLLBACK');
        throw e;
    } finally {
        c.release();
    }
}
