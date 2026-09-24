import * as repository from '../repositories/perfilRepository.js';
import { fail } from '../middlewares/error.js';
export async function atualizarPerfil(req, res) {
    const { nome, telefone } = req.body;
    if (typeof nome !== 'string' || !nome.trim()) fail('Informe seu nome.');
    res.json(await repository.atualizar(req.user.id, nome.trim(), telefone));
}
