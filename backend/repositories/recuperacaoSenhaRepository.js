import { query } from '../config/db.js';

export async function reservarToken(email, tokenHash) {
    const resultado = await query(
        `
            UPDATE tb_usuario
            SET usu_senha_token_hash = $2,
                usu_senha_token_expira = NOW() + INTERVAL '30 minutes',
                usu_senha_token_enviado_em = NOW()
            WHERE usu_email = $1
                AND usu_ativo = TRUE
                AND (
                    usu_senha_token_enviado_em IS NULL
                    OR usu_senha_token_enviado_em <= NOW() - INTERVAL '1 minute'
                )
            RETURNING usu_email
        `,
        [email, tokenHash]
    );
    return resultado.rows[0];
}

export async function redefinirSenha(tokenHash, senhaCriptografada) {
    // O UPDATE consome o token e troca a senha atomicamente: duas requisições
    // simultâneas com o mesmo link não conseguem alterar a senha duas vezes.
    const resultado = await query(
        `
            UPDATE tb_usuario
            SET usu_senha = $2,
                usu_senha_token_hash = NULL,
                usu_senha_token_expira = NULL,
                usu_sessao_versao = usu_sessao_versao + 1
            WHERE usu_senha_token_hash = $1
                AND usu_senha_token_expira > NOW()
                AND usu_ativo = TRUE
            RETURNING usu_id
        `,
        [tokenHash, senhaCriptografada]
    );
    return resultado.rowCount === 1;
}
