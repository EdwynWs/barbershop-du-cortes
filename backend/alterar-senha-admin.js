import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from './config/db.js';

async function alterarSenha() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const novaSenha = process.env.ADMIN_PASSWORD;

    if (!email || !novaSenha || novaSenha.length < 12) {
        throw new Error(
            'Preencha ADMIN_EMAIL e ADMIN_PASSWORD com uma senha de pelo menos 12 caracteres.'
        );
    }

    const hash = await bcrypt.hash(novaSenha, 12);

    const resultado = await pool.query(
        `
            UPDATE tb_usuario
            SET usu_senha = $1
            WHERE usu_email = $2
                AND usu_tipo = 'ADMIN'
            RETURNING usu_id
        `,
        [hash, email]
    );

    if (resultado.rowCount !== 1) {
        throw new Error('Administrador não encontrado. Nenhuma senha foi alterada.');
    }

    console.log('Senha do administrador alterada com sucesso.');
}

try {
    await alterarSenha();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}