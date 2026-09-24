import * as repository from '../repositories/notificacaoRepository.js';
import { fail } from '../middlewares/error.js';
export async function listar(req, res) {
    res.json(await repository.listar(req.user.id));
}
export async function marcarComoLida(req, res) {
    const result = await repository.marcarComoLida(req.params.id, req.user.id);
    if (!result) fail('Notificação não encontrada.', 404);
    res.json(result);
}
