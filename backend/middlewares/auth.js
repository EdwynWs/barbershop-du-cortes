import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export async function auth(req, res, next) {
    let sessao;
    try {
        const token = req.cookies?.session;
        if (!token) return res.status(401).json({ erro: 'Faça login' });
        sessao = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ erro: 'Sessão inválida' });
    }

    try {
        const { rows: [usuario] } = await query(
            'SELECT usu_tipo, usu_sessao_versao FROM tb_usuario WHERE usu_id = $1 AND usu_ativo = TRUE',
            [sessao.id]
        );
        // Sessões emitidas antes da migração equivalem à versão zero.
        if (!usuario || (sessao.versao ?? 0) !== usuario.usu_sessao_versao) {
            return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
        }
        req.user = { ...sessao, tipo: usuario.usu_tipo };
        next();
    } catch (error) {
        next(error);
    }
}

export const roles =
    (...allowed) =>
    (req, res, next) =>
        allowed.includes(req.user?.tipo) ? next() : res.status(403).json({ erro: 'Sem permissão' });
