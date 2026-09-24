import { consultar } from '../repositories/relatorioRepository.js';
import { validDate } from '../entities/appointment.js';
import { fail } from '../middlewares/error.js';
export async function listar(req, res) {
    const tipos = ['faturamento', 'servicos', 'barbeiros', 'clientes', 'horarios'];
    if (!tipos.includes(req.params.type)) fail('Relatório desconhecido.', 404);
    const inicio = req.query.inicio || '2000-01-01';
    const fim = req.query.fim || '2100-01-01';
    if (!validDate(inicio) || !validDate(fim) || inicio > fim) fail('Período inválido.');
    res.json(await consultar(req.params.type, inicio, fim));
}
