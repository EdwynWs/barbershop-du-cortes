export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export function errors(err, req, res, next) {
    console.error(err);
    if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ erro: 'A imagem precisa ter no máximo 3 MB.' });
    if (err.code === '23P01')
        return res.status(409).json({ erro: 'Este horário acabou de ser reservado' });
    if (err.code === '23505') return res.status(409).json({ erro: 'Registro duplicado' });
    if (err.code === '23503') return res.status(409).json({ erro: 'Registro em uso' });
    res.status(err.status || 500).json({
        erro: err.status ? err.message : 'Erro interno do servidor',
    });
}
export function fail(message, status = 400) {
    const e = new Error(message);
    e.status = status;
    throw e;
}
