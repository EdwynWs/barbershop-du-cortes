import * as repository from '../repositories/avaliacaoRepository.js';
import { fail } from '../middlewares/error.js';
export async function cadastrar(req, res) {
    const { agendamentoId, nota, comentario } = req.body;
    if (!Number.isInteger(Number(nota)) || nota < 1 || nota > 5)
        fail('Escolha uma nota entre 1 e 5.');
    const agendamento = await repository.buscarAtendimento(agendamentoId, req.user.id);
    if (!agendamento) fail('O atendimento não está disponível para avaliação.', 403);
    res.status(201).json(await repository.cadastrar(agendamento, nota, comentario));
}
