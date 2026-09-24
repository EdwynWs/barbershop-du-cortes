import jwt from 'jsonwebtoken';
export function auth(req, res, next) {
    try {
        const token = req.cookies?.session;
        if (!token) return res.status(401).json({ erro: 'Faça login' });
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ erro: 'Sessão inválida' });
    }
}
export const roles =
    (...allowed) =>
    (req, res, next) =>
        allowed.includes(req.user?.tipo) ? next() : res.status(403).json({ erro: 'Sem permissão' });
