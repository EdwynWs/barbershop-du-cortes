import { query } from '../config/db.js';

export default class ServicoRepository {
    async listar(incluirInativos = false) {
        const sql = `
            SELECT servico.*,
                COUNT(agendamento.age_id) FILTER (
                    WHERE agendamento.age_status = 'CONCLUIDO'
                )::int AS realizados
            FROM tb_servico servico
            LEFT JOIN tb_agendamento agendamento ON agendamento.ser_id = servico.ser_id
            WHERE servico.ser_ativo OR $1::boolean
            GROUP BY servico.ser_id
            ORDER BY servico.ser_id
        `;
        return (await query(sql, [incluirInativos])).rows;
    }

    async gravar(servico, id = null) {
        const values = [
            servico.nome,
            servico.descricao,
            servico.valor,
            servico.duracao,
            servico.imagem || null,
            servico.ativo,
        ];
        if (id) {
            const sql = `
                UPDATE tb_servico SET ser_nome = $1, ser_descricao = $2,
                    ser_valor = $3, ser_duracao = $4, ser_imagem = $5, ser_ativo = $6
                WHERE ser_id = $7 RETURNING *
            `;
            return (await query(sql, [...values, id])).rows[0];
        }
        const sql = `
            INSERT INTO tb_servico (ser_nome, ser_descricao, ser_valor, ser_duracao, ser_imagem, ser_ativo)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
        return (await query(sql, values)).rows[0];
    }

    async desativar(id) {
        return (
            await query(
                'UPDATE tb_servico SET ser_ativo = FALSE WHERE ser_id = $1 RETURNING ser_id',
                [id]
            )
        ).rows[0];
    }
}
