import { pool, query } from '../config/db.js';
export default class UsuarioRepository {
    async buscarPorEmail(email) {
        return (await query('SELECT * FROM tb_usuario WHERE usu_email = $1 AND usu_ativo', [email]))
            .rows[0];
    }
    async buscarPorId(id) {
        return (
            await query(
                `
            SELECT usu_id, usu_nome, usu_email, usu_telefone, usu_tipo
            FROM tb_usuario WHERE usu_id = $1 AND usu_ativo
        `,
                [id]
            )
        ).rows[0];
    }
    async cadastrarCliente({ nome, email, telefone }, senha) {
        const conexao = await pool.connect();
        try {
            await conexao.query('BEGIN');
            const usuario = (
                await conexao.query(
                    `
                INSERT INTO tb_usuario (usu_nome, usu_email, usu_telefone, usu_senha, usu_tipo)
                VALUES ($1, $2, $3, $4, 'CLIENTE')
                RETURNING usu_id, usu_nome, usu_email, usu_telefone, usu_tipo
            `,
                    [nome.trim(), email.toLowerCase().trim(), telefone || null, senha]
                )
            ).rows[0];
            await conexao.query('INSERT INTO tb_cliente (usu_id) VALUES ($1)', [usuario.usu_id]);
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
