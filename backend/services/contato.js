import { randomBytes } from 'node:crypto';
import { fail } from '../middlewares/error.js';
import { telefoneBrasil } from './telefone.js';

export async function criarContato(conexao, dados) {
    const nome = typeof dados?.nome === 'string' ? dados.nome.trim() : '';
    const telefone = telefoneBrasil(dados?.telefone);
    if (nome.length < 2 || nome.length > 120 || !telefone) {
        fail('Informe nome e telefone válido com DDD para o cliente sem cadastro.');
    }
    // Sem e-mail, inativo e sem hash de senha utilizável: não permite login/reset.
    // Não vincula automaticamente pelo telefone: números podem ser compartilhados.
    const { rows: [usuario] } = await conexao.query(`
        INSERT INTO tb_usuario
            (usu_nome, usu_email, usu_telefone, usu_senha, usu_tipo, usu_ativo, usu_contato)
        VALUES ($1, NULL, $2, $3, 'CLIENTE', FALSE, TRUE) RETURNING usu_id
    `, [nome, telefone, '!' + randomBytes(32).toString('hex')]);
    const { rows: [cliente] } = await conexao.query(
        'INSERT INTO tb_cliente(usu_id) VALUES($1) RETURNING cli_id', [usuario.usu_id]
    );
    return cliente.cli_id;
}
