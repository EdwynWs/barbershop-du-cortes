import { pool, query } from '../config/db.js';
import { fail } from '../middlewares/error.js';

export default class BarbeiroRepository {
    async listar(administrativo = false) {
        const sql = `
            SELECT b.bar_id, b.bar_descricao, b.bar_foto, b.bar_ativo, u.usu_nome,
                CASE WHEN $1 THEN u.usu_email END AS usu_email,
                CASE WHEN $1 THEN u.usu_telefone END AS usu_telefone,
                (SELECT ROUND(AVG(ava_nota)::numeric, 1) FROM tb_avaliacao WHERE bar_id = b.bar_id) AS avaliacao,
                ARRAY(SELECT ser_id FROM tb_barbeiro_servico WHERE bar_id = b.bar_id) AS servicos,
                COALESCE((SELECT json_agg(h ORDER BY h.hor_dia_semana) FROM tb_horario_barbeiro h WHERE h.bar_id = b.bar_id AND h.hor_ativo), '[]') AS horarios
            FROM tb_barbeiro b JOIN tb_usuario u ON u.usu_id = b.usu_id
            WHERE $1 OR (b.bar_ativo AND u.usu_ativo)
            ORDER BY b.bar_id
        `;
        return (await query(sql, [administrativo])).rows;
    }

    async gravar(barbeiro, senhaCriptografada, id = null) {
        const conexao = await pool.connect();
        try {
            await conexao.query('BEGIN');
            let registro;
            if (id) {
                registro = (
                    await conexao.query('SELECT * FROM tb_barbeiro WHERE bar_id = $1 FOR UPDATE', [
                        id,
                    ])
                ).rows[0];
                if (!registro) fail('Barbeiro não encontrado.', 404);
                await conexao.query(
                    `
                    UPDATE tb_usuario SET usu_nome = $1, usu_email = $2, usu_telefone = $3
                    WHERE usu_id = $4
                `,
                    [
                        barbeiro.nome.trim(),
                        barbeiro.email.toLowerCase().trim(),
                        barbeiro.telefone || null,
                        registro.usu_id,
                    ]
                );
                registro = (
                    await conexao.query(
                        `
                    UPDATE tb_barbeiro SET bar_descricao = $1, bar_foto = $2, bar_ativo = $3
                    WHERE bar_id = $4 RETURNING *
                `,
                        [
                            barbeiro.descricao || null,
                            barbeiro.foto || null,
                            barbeiro.ativo !== false,
                            id,
                        ]
                    )
                ).rows[0];
                await conexao.query('DELETE FROM tb_barbeiro_servico WHERE bar_id = $1', [id]);
                await conexao.query('DELETE FROM tb_horario_barbeiro WHERE bar_id = $1', [id]);
            } else {
                const usuario = (
                    await conexao.query(
                        `
                    INSERT INTO tb_usuario (usu_nome, usu_email, usu_telefone, usu_senha, usu_tipo)
                    VALUES ($1, $2, $3, $4, 'BARBEIRO') RETURNING usu_id
                `,
                        [
                            barbeiro.nome.trim(),
                            barbeiro.email.toLowerCase().trim(),
                            barbeiro.telefone || null,
                            senhaCriptografada,
                        ]
                    )
                ).rows[0];
                registro = (
                    await conexao.query(
                        `
                    INSERT INTO tb_barbeiro (usu_id, bar_descricao, bar_foto, bar_ativo)
                    VALUES ($1, $2, $3, $4) RETURNING *
                `,
                        [
                            usuario.usu_id,
                            barbeiro.descricao || null,
                            barbeiro.foto || null,
                            barbeiro.ativo !== false,
                        ]
                    )
                ).rows[0];
            }
            for (const servicoId of new Set(barbeiro.servicos.map(Number))) {
                await conexao.query(
                    'INSERT INTO tb_barbeiro_servico (bar_id, ser_id) VALUES ($1, $2)',
                    [registro.bar_id, servicoId]
                );
            }
            for (const horario of barbeiro.horarios) {
                await conexao.query(
                    `
                    INSERT INTO tb_horario_barbeiro (bar_id, hor_dia_semana, hor_inicio, hor_fim, hor_intervalo_inicio, hor_intervalo_fim)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `,
                    [
                        registro.bar_id,
                        horario.dia,
                        horario.inicio,
                        horario.fim,
                        horario.intervaloInicio || null,
                        horario.intervaloFim || null,
                    ]
                );
            }
            await conexao.query('COMMIT');
            return registro;
        } catch (error) {
            await conexao.query('ROLLBACK');
            throw error;
        } finally {
            conexao.release();
        }
    }
}
