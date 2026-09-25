import { query } from '../config/db.js';

export async function reservarToken(email, tokenHash) {
    const resultado = await query(
        `
            UPDATE tb_usuario
            SET
                usu_email_token_hash = $2,
                usu_email_token_expira = NOW() + INTERVAL '30 minutes',
                usu_email_token_enviado_em = NOW()
            WHERE usu_email = $1
                AND usu_tipo = 'CLIENTE'
                AND usu_ativo = TRUE
                AND usu_email_confirmado = FALSE
                AND (
                    usu_email_token_enviado_em IS NULL
                    OR usu_email_token_enviado_em <= NOW() - INTERVAL '1 minute'
                )
            RETURNING usu_id, usu_nome, usu_email
        `,
        [email, tokenHash]
    );

    return resultado.rows[0];
}

export async function confirmarToken(tokenHash) {
    const resultado = await query(
        `
            UPDATE tb_usuario
            SET
                usu_email_confirmado = TRUE,
                usu_email_token_hash = NULL,
                usu_email_token_expira = NULL
            WHERE usu_email_token_hash = $1
                AND usu_email_token_expira > NOW()
                AND usu_email_confirmado = FALSE
                AND usu_tipo = 'CLIENTE'
                AND usu_ativo = TRUE
            RETURNING usu_id
        `,
        [tokenHash]
    );

    return resultado.rowCount === 1;
}