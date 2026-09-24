import { query } from '../config/db.js';
export async function listar(usuarioId) {
    return (
        await query(
            'SELECT * FROM tb_notificacao WHERE usu_id = $1 ORDER BY not_data DESC LIMIT 100',
            [usuarioId]
        )
    ).rows;
}
export async function marcarComoLida(id, usuarioId) {
    return (
        await query(
            'UPDATE tb_notificacao SET not_lida = TRUE WHERE not_id = $1 AND usu_id = $2 RETURNING *',
            [id, usuarioId]
        )
    ).rows[0];
}
