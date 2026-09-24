import { query } from '../config/db.js';
export async function buscarAtendimento(id, usuarioId) {
    const sql = `
        SELECT a.* FROM tb_agendamento a JOIN tb_cliente c ON c.cli_id = a.cli_id
        WHERE a.age_id = $1 AND c.usu_id = $2 AND a.age_status = 'CONCLUIDO'
    `;
    return (await query(sql, [id, usuarioId])).rows[0];
}
export async function cadastrar(agendamento, nota, comentario) {
    const sql = `
        INSERT INTO tb_avaliacao (age_id, cli_id, bar_id, ava_nota, ava_comentario)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    return (
        await query(sql, [
            agendamento.age_id,
            agendamento.cli_id,
            agendamento.bar_id,
            nota,
            comentario || null,
        ])
    ).rows[0];
}
