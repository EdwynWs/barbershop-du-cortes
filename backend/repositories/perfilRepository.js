import { query } from '../config/db.js';
export async function atualizar(id, nome, telefone) {
    const sql = `
        UPDATE tb_usuario SET usu_nome = $1, usu_telefone = $2
        WHERE usu_id = $3 RETURNING usu_id, usu_nome, usu_email, usu_telefone
    `;
    return (await query(sql, [nome, telefone || null, id])).rows[0];
}
