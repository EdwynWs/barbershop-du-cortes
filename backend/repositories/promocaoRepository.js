import { query } from '../config/db.js';
export async function listarAtivas() {
    const sql = `
        SELECT * FROM tb_promocao
        WHERE pro_ativo AND (now() AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN pro_data_inicio AND pro_data_fim
        ORDER BY pro_data_fim
    `;
    return (await query(sql)).rows;
}
export async function cadastrar({ titulo, descricao, servicoId, desconto, inicio, fim }) {
    const sql = `
        INSERT INTO tb_promocao (pro_titulo, pro_descricao, ser_id, pro_desconto, pro_data_inicio, pro_data_fim)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    return (await query(sql, [titulo, descricao || null, servicoId || null, desconto, inicio, fim]))
        .rows[0];
}
