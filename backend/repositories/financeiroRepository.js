import { pool, query } from '../config/db.js';
import { fail } from '../middlewares/error.js';
export async function receitas() {
    return (
        await query(`
        SELECT p.*, to_char(p.pag_data AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS pag_dia, a.age_data, s.ser_nome, uc.usu_nome AS cliente, ub.usu_nome AS barbeiro
        FROM tb_pagamento p JOIN tb_agendamento a ON a.age_id = p.age_id
        JOIN tb_servico s ON s.ser_id = a.ser_id JOIN tb_cliente c ON c.cli_id = a.cli_id
        JOIN tb_usuario uc ON uc.usu_id = c.usu_id JOIN tb_barbeiro b ON b.bar_id = a.bar_id
        JOIN tb_usuario ub ON ub.usu_id = b.usu_id
        WHERE p.pag_status = 'PAGO' AND a.age_status = 'CONCLUIDO'
            AND p.pag_data <= CURRENT_TIMESTAMP
        ORDER BY p.pag_data DESC, p.pag_id DESC LIMIT 200
    `)
    ).rows;
}
export async function despesas() {
    return (await query('SELECT * FROM tb_despesa ORDER BY des_data DESC LIMIT 200')).rows;
}
export async function cadastrarDespesa({ descricao, categoria, valor, data }) {
    validarValor(valor);
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
    validarValor(valor);
    if (
        !/^[1-9]\d*$/.test(String(ageId)) ||
        !['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'OUTRO'].includes(forma)
    ) {
        fail('Confira o atendimento e a forma de pagamento.');
    }
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
                AND pag_data <= CURRENT_TIMESTAMP
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

function validarValor(valor) {
    // Evita arredondar silenciosamente valores com mais de duas casas decimais.
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(String(valor)) || Number(valor) <= 0) {
        fail('Informe um valor positivo com no máximo duas casas decimais.');
    }
}

export async function pendencias() {
    return (
        await query(`
        SELECT a.age_id, to_char(a.age_data, 'YYYY-MM-DD') AS age_data,
            a.age_valor, s.ser_nome, u.usu_nome AS cliente,
            COALESCE(p.recebido, 0) AS recebido,
            a.age_valor - COALESCE(p.recebido, 0) AS saldo
        FROM tb_agendamento a
        JOIN tb_servico s ON s.ser_id = a.ser_id
        JOIN tb_cliente c ON c.cli_id = a.cli_id
        JOIN tb_usuario u ON u.usu_id = c.usu_id
        LEFT JOIN (
            SELECT age_id, SUM(pag_valor) AS recebido FROM tb_pagamento
            WHERE pag_status = 'PAGO' AND pag_data <= CURRENT_TIMESTAMP
            GROUP BY age_id
        ) p ON p.age_id = a.age_id
        WHERE a.age_status = 'CONCLUIDO'
            AND a.age_data <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
            AND a.age_valor > COALESCE(p.recebido, 0)
        ORDER BY a.age_data, a.age_id
    `)
    ).rows;
}
