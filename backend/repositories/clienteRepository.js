import { query } from '../config/db.js';
export async function listar(busca = '') {
    const sql = `
        SELECT c.cli_id, u.usu_nome, u.usu_email, u.usu_telefone, u.usu_data_cadastro,
            MAX(a.age_data) FILTER (WHERE a.age_status = 'CONCLUIDO') AS ultima_visita,
            COUNT(DISTINCT a.age_id) FILTER (WHERE a.age_status = 'CONCLUIDO')::int AS atendimentos,
            COALESCE(SUM(p.pag_valor) FILTER (WHERE p.pag_status = 'PAGO' AND a.age_status = 'CONCLUIDO'), 0)::numeric AS total_gasto
        FROM tb_cliente c
        JOIN tb_usuario u ON u.usu_id = c.usu_id
        LEFT JOIN tb_agendamento a ON a.cli_id = c.cli_id
        LEFT JOIN tb_pagamento p ON p.age_id = a.age_id
        WHERE $1 = '' OR u.usu_nome ILIKE '%' || $1 || '%'
            OR u.usu_email ILIKE '%' || $1 || '%' OR u.usu_telefone ILIKE '%' || $1 || '%'
        GROUP BY c.cli_id, u.usu_id ORDER BY u.usu_nome LIMIT 200
    `;
    return (await query(sql, [busca])).rows;
}
export async function buscar(id) {
    return (
        await query(
            `
        SELECT c.*, u.usu_nome, u.usu_email, u.usu_telefone, u.usu_data_cadastro
        FROM tb_cliente c JOIN tb_usuario u ON u.usu_id = c.usu_id WHERE c.cli_id = $1
    `,
            [id]
        )
    ).rows[0];
}
export async function historico(id) {
    return (
        await query(
            `
        SELECT a.*, s.ser_nome, u.usu_nome AS barbeiro
        FROM tb_agendamento a JOIN tb_servico s ON s.ser_id = a.ser_id
        JOIN tb_barbeiro b ON b.bar_id = a.bar_id JOIN tb_usuario u ON u.usu_id = b.usu_id
        WHERE a.cli_id = $1 ORDER BY a.age_data DESC LIMIT 100
    `,
            [id]
        )
    ).rows;
}
export async function inativos(dias) {
    return (
        await query(
            `
        SELECT c.cli_id, u.usu_nome, u.usu_telefone, MAX(a.age_data) AS ultima_visita
        FROM tb_cliente c JOIN tb_usuario u ON u.usu_id = c.usu_id
        LEFT JOIN tb_agendamento a ON a.cli_id = c.cli_id AND a.age_status = 'CONCLUIDO'
        GROUP BY c.cli_id, u.usu_id
        HAVING MAX(a.age_data) < current_date - $1::integer OR MAX(a.age_data) IS NULL
        ORDER BY ultima_visita NULLS FIRST
    `,
            [dias]
        )
    ).rows;
}
