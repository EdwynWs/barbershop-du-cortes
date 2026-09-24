import { pool, query } from '../config/db.js';
import { fail } from '../middlewares/error.js';
export async function receitas() {
    return (
        await query(`
        SELECT p.*, a.age_data, s.ser_nome, uc.usu_nome AS cliente, ub.usu_nome AS barbeiro
        FROM tb_pagamento p JOIN tb_agendamento a ON a.age_id = p.age_id
        JOIN tb_servico s ON s.ser_id = a.ser_id JOIN tb_cliente c ON c.cli_id = a.cli_id
        JOIN tb_usuario uc ON uc.usu_id = c.usu_id JOIN tb_barbeiro b ON b.bar_id = a.bar_id
        JOIN tb_usuario ub ON ub.usu_id = b.usu_id ORDER BY p.pag_data DESC LIMIT 200
    `)
    ).rows;
}
export async function despesas() {
    return (await query('SELECT * FROM tb_despesa ORDER BY des_data DESC LIMIT 200')).rows;
}
export async function cadastrarDespesa({ descricao, categoria, valor, data }) {
    return (
        await query(
            `
        INSERT INTO tb_despesa (des_descricao, des_categoria, des_valor, des_data)
        VALUES ($1, $2, $3, $4) RETURNING *
    `,
            [descricao, categoria, valor, data]
        )
    ).rows[0];
}
export async function receberPagamento({ ageId, valor, forma }) {
    const conexao = await pool.connect();
    try {
        await conexao.query('BEGIN');
        const atendimento = (
            await conexao.query('SELECT * FROM tb_agendamento WHERE age_id = $1 FOR UPDATE', [
                ageId,
            ])
        ).rows[0];
        if (!atendimento || atendimento.age_status !== 'CONCLUIDO')
            fail('Conclua o atendimento antes de registrar o pagamento.');
        // A comparação é feita com NUMERIC no PostgreSQL e com a linha bloqueada.
        const {
            rows: [saldo],
        } = await conexao.query(
            `
            SELECT $1::numeric <= $2::numeric - COALESCE(SUM(pag_valor), 0) AS permitido
            FROM tb_pagamento WHERE age_id = $3 AND pag_status = 'PAGO'
        `,
            [valor, atendimento.age_valor, ageId]
        );
        if (!saldo.permitido) fail('O valor ultrapassa o saldo pendente deste atendimento.', 409);
        const pagamento = (
            await conexao.query(
                `
            INSERT INTO tb_pagamento (age_id, pag_valor, pag_forma, pag_status)
            VALUES ($1, $2, $3, 'PAGO') RETURNING *
        `,
                [ageId, valor, forma]
            )
        ).rows[0];
        await conexao.query('COMMIT');
        return pagamento;
    } catch (error) {
        await conexao.query('ROLLBACK');
        throw error;
    } finally {
        conexao.release();
    }
}
