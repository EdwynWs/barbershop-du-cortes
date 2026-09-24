import * as repository from '../repositories/clienteRepository.js';
import { fail } from '../middlewares/error.js';
export async function listar(req, res) {
    res.json(await repository.listar(req.query.busca || ''));
}
export async function buscar(req, res) {
    const cliente = await repository.buscar(req.params.id);
    if (!cliente) fail('Cliente não encontrado.', 404);
    res.json({ ...cliente, historico: await repository.historico(cliente.cli_id) });
}
export async function inativos(req, res) {
    const dias = Number(req.query.dias || 30);
    if (![30, 60, 90].includes(dias)) fail('Escolha 30, 60 ou 90 dias.');
    res.json(await repository.inativos(dias));
}
