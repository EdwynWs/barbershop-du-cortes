import { consultar } from '../repositories/relatorioRepository.js';
import { validDate } from '../entities/appointment.js';
import { fail } from '../middlewares/error.js';

export async function listar(req, res) {
    const tipos = [
        'faturamento',
        'servicos',
        'barbeiros',
        'clientes',
        'horarios',
    ];

    const { type } = req.params;
    const inicio = req.query.inicio || '2000-01-01';
    const fim = req.query.fim || '2100-01-01';

    if (!tipos.includes(type)) {
        fail('Relatório desconhecido.', 404);
    }

    if (!validDate(inicio) || !validDate(fim) || inicio > fim) {
        fail('Período inválido.');
    }

    const resultado = await consultar(type, inicio, fim);

    return res.json(resultado);
}