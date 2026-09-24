import * as repository from '../repositories/financeiroRepository.js';
import { dashboard } from '../repositories/analytics.js';
import { validDate } from '../entities/appointment.js';
import { fail } from '../middlewares/error.js';
export async function resumo(req, res) {
    const [resumo, receitas, despesas] = await Promise.all([
        dashboard(),
        repository.receitas(),
        repository.despesas(),
    ]);
    res.json({ resumo, receitas, despesas });
}
export async function pagamento(req, res) {
    const { ageId, valor, forma } = req.body;
    const formas = ['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'OUTRO'];
    if (
        !Number.isInteger(Number(ageId)) ||
        !Number.isFinite(Number(valor)) ||
        Number(valor) <= 0 ||
        !formas.includes(forma)
    )
        fail('Confira o atendimento, o valor e a forma de pagamento.');
    res.status(201).json(await repository.receberPagamento(req.body));
}
export async function despesa(req, res) {
    const { descricao, categoria, valor, data } = req.body;
    if (
        !descricao?.trim() ||
        !categoria ||
        !Number.isFinite(Number(valor)) ||
        Number(valor) <= 0 ||
        !validDate(data)
    )
        fail('Confira os dados da despesa.');
    res.status(201).json(await repository.cadastrarDespesa(req.body));
}
