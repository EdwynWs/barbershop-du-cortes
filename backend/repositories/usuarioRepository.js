import { pool, query } from '../config/db.js';

export default class UsuarioRepository {
    async buscarPorEmail(email) {
        const resultado = await query(
            `
                SELECT *
                FROM tb_usuario
                WHERE usu_email = $1
                    AND usu_ativo = TRUE
            `,
            [email]
        );

        return resultado.rows[0];
    }

    async buscarPorId(id) {
        const resultado = await query(
            `
                SELECT
                    usu_id,
                    usu_nome,
                    usu_email,
                    usu_telefone,
                    usu_tipo,
                    usu_email_confirmado
                FROM tb_usuario
                WHERE usu_id = $1
                    AND usu_ativo = TRUE
            `,
            [id]
        );

        return resultado.rows[0];
    }

    async cadastrarCliente({ nome, email, telefone }, senha) {
        const conexao = await pool.connect();

        try {
            await conexao.query('BEGIN');

            const sqlUsuario = `
                INSERT INTO tb_usuario (
                    usu_nome,
                    usu_email,
                    usu_telefone,
                    usu_senha,
                    usu_tipo,
                    usu_email_confirmado
                )
                VALUES ($1, $2, $3, $4, 'CLIENTE', FALSE)
                RETURNING
                    usu_id,
                    usu_nome,
                    usu_email,
                    usu_telefone,
                    usu_tipo,
                    usu_email_confirmado
            `;

            const parametrosUsuario = [
                nome.trim(),
                email.trim().toLowerCase(),
                telefone || null,
                senha,
            ];

            const resultado = await conexao.query(
                sqlUsuario,
                parametrosUsuario
            );

            const usuario = resultado.rows[0];

            const sqlCliente = `
                INSERT INTO tb_cliente (usu_id)
                VALUES ($1)
            `;

            await conexao.query(sqlCliente, [usuario.usu_id]);

            await conexao.query('COMMIT');

            return usuario;
        } catch (error) {
            await conexao.query('ROLLBACK');
            throw error;
        } finally {
            conexao.release();
        }
    }
}