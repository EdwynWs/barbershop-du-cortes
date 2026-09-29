import { test, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const db = new PGlite();
const emails = [];
const query = async (sql, params = []) => {
    const result = await db.query(sql, params);
    return { rows: result.rows, rowCount: result.affectedRows };
};
mock.module('../config/db.js', { namedExports: { query, pool: {} } });
mock.module('../services/email.js', {
    namedExports: {
        enviarMensagem: async (...args) => { emails.push(args); },
        enviarConfirmacaoAgendamento: async () => {},
    },
});
process.env.FRONTEND_URL = 'https://barbearia.example';
process.env.JWT_SECRET = 'segredo-exclusivo-dos-testes-com-32-caracteres';
const { default: app } = await import('../app.js');
const { confirmarNovaSenha } = await import('../services/recuperacaoSenha.js');
const { auth } = await import('../middlewares/auth.js');
const migration = await readFile(new URL('../db/migrations/20260929_recuperacao_senha.sql', import.meta.url), 'utf8');
let server;
let base;
let originalHash;

before(async () => {
    await db.exec(`CREATE TABLE tb_usuario (
        usu_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        usu_email TEXT UNIQUE NOT NULL,
        usu_senha TEXT NOT NULL,
        usu_tipo TEXT NOT NULL DEFAULT 'CLIENTE',
        usu_ativo BOOLEAN NOT NULL DEFAULT TRUE,
        usu_email_confirmado BOOLEAN NOT NULL DEFAULT FALSE
    );`);
    await db.exec(migration);
    await db.exec(migration); // Reaplicar não pode apagar dados ou falhar.
    originalHash = await bcrypt.hash('senha-antiga-123', 4);
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}/api/auth`;
});

beforeEach(async () => {
    emails.length = 0;
    await db.exec('TRUNCATE tb_usuario RESTART IDENTITY');
    await query('INSERT INTO tb_usuario (usu_email, usu_senha) VALUES ($1, $2)', ['cliente@example.com', originalHash]);
});
after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
});

async function post(path, body) {
    const response = await fetch(base + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
}
async function solicitar(email = 'cliente@example.com') {
    return post('/esqueci-senha', { email });
}
function tokenAtual() {
    const link = emails.at(-1)[2].split('\n').find((line) => line.startsWith('https://'));
    return new URLSearchParams(new URL(link).hash.slice(1)).get('token');
}
async function usuario() { return (await query('SELECT * FROM tb_usuario')).rows[0]; }
async function verificarSessao(versao) {
    const row = await usuario();
    const token = jwt.sign({ id: row.usu_id, tipo: 'CLIENTE', ...(versao === undefined ? {} : { versao }) }, process.env.JWT_SECRET);
    let status = 200;
    let passed = false;
    await auth({ cookies: { session: token } }, {
        status(value) { status = value; return this; }, json() {},
    }, (error) => { if (error) throw error; passed = true; });
    return { status, passed };
}

test('resposta genérica para contas existentes, inexistentes e inativas', async () => {
    const existing = await solicitar(' CLIENTE@EXAMPLE.COM ');
    const unknown = await solicitar('ausente@example.com');
    await query('UPDATE tb_usuario SET usu_ativo = FALSE');
    const inactive = await solicitar();
    assert.equal(existing.status, 200);
    assert.deepEqual(existing.body, unknown.body);
    assert.deepEqual(existing.body, inactive.body);
    assert.equal(emails.length, 1);
    assert.equal(existing.headers.get('cache-control'), 'no-store');
});

test('token aleatório fica apenas como hash no banco; solicitar não troca a senha', async () => {
    await solicitar();
    const token = tokenAtual();
    assert.match(token, /^[a-f0-9]{64}$/);
    const row = await usuario();
    assert.equal(row.usu_senha_token_hash, createHash('sha256').update(token).digest('hex'));
    assert.notEqual(row.usu_senha_token_hash, token);
    assert.equal(row.usu_senha, originalHash);
    assert.ok(new Date(row.usu_senha_token_expira) > new Date());
});

test('reenvio respeita um minuto e substitui o link anterior', async () => {
    await solicitar();
    const old = tokenAtual();
    await solicitar();
    assert.equal(emails.length, 1);
    await query("UPDATE tb_usuario SET usu_senha_token_enviado_em = NOW() - INTERVAL '2 minutes'");
    await solicitar();
    assert.equal(emails.length, 2);
    assert.notEqual(tokenAtual(), old);
    await assert.rejects(confirmarNovaSenha(old, 'senha-nova-123'), /Link inválido/);
});

test('troca senha, mantém confirmação pendente e rejeita reutilização', async () => {
    await solicitar();
    const token = tokenAtual();
    const result = await post('/redefinir-senha', { token, senha: 'senha-nova-123' });
    assert.equal(result.status, 200);
    const row = await usuario();
    assert.equal(await bcrypt.compare('senha-nova-123', row.usu_senha), true);
    assert.equal(await bcrypt.compare('senha-antiga-123', row.usu_senha), false);
    assert.equal(row.usu_email_confirmado, false);
    assert.equal(row.usu_senha_token_hash, null);
    assert.equal(row.usu_sessao_versao, 1);
    assert.match(result.headers.get('set-cookie'), /session=;/);
    await assert.rejects(confirmarNovaSenha(token, 'outra-senha-123'), /Link inválido/);
});

test('link expirado e conta desativada não permitem troca', async () => {
    await solicitar();
    const token = tokenAtual();
    await query("UPDATE tb_usuario SET usu_senha_token_expira = NOW() - INTERVAL '1 minute'");
    await assert.rejects(confirmarNovaSenha(token, 'senha-nova-123'), /Link inválido/);
    await query("UPDATE tb_usuario SET usu_senha_token_expira = NOW() + INTERVAL '1 minute', usu_ativo = FALSE");
    await assert.rejects(confirmarNovaSenha(token, 'senha-nova-123'), /Link inválido/);
    assert.equal((await usuario()).usu_senha, originalHash);
});

test('tokens malformados e senhas fora dos limites são recusados', async () => {
    await solicitar();
    for (const token of ['', 'abc', null, {}]) {
        await assert.rejects(confirmarNovaSenha(token, 'senha-nova-123'), /Link inválido/);
    }
    for (const senha of ['', '1234567', 'a'.repeat(73), '😀'.repeat(19), null]) {
        await assert.rejects(confirmarNovaSenha(tokenAtual(), senha), /Use uma senha/);
    }
    assert.equal((await post('/esqueci-senha', { email: 'invalido' })).status, 400);
});

test('duas tentativas concorrentes consomem o link apenas uma vez', async () => {
    await solicitar();
    const token = tokenAtual();
    const attempts = await Promise.allSettled([
        confirmarNovaSenha(token, 'nova-senha-um'), confirmarNovaSenha(token, 'nova-senha-dois'),
    ]);
    assert.equal(attempts.filter((x) => x.status === 'fulfilled').length, 1);
    assert.equal((await usuario()).usu_sessao_versao, 1);
});

test('troca revoga sessões antigas e permite versão nova; bloqueia usuário inativo', async () => {
    assert.equal((await verificarSessao()).passed, true);
    assert.equal((await verificarSessao(0)).passed, true);
    await solicitar();
    await confirmarNovaSenha(tokenAtual(), 'nova-senha-123');
    assert.equal((await verificarSessao()).status, 401);
    assert.equal((await verificarSessao(0)).status, 401);
    assert.equal((await verificarSessao(1)).passed, true);
    await query('UPDATE tb_usuario SET usu_ativo = FALSE');
    assert.equal((await verificarSessao(1)).status, 401);
});
