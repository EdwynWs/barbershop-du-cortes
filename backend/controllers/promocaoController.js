import * as repository from '../repositories/promocaoRepository.js';
import { validDate } from '../entities/appointment.js';
import { fail } from '../middlewares/error.js';
export async function listar(req, res) {
    res.json(await repository.listarAtivas());
}
export async function cadastrar(req, res) {
    const { titulo, desconto, inicio, fim } = req.body;
    if (
        !titulo?.trim() ||
        !validDate(inicio) ||
        !validDate(fim) ||
        inicio > fim ||
        !Number.isFinite(Number(desconto)) ||
        Number(desconto) < 0
    )
        fail('Confira o título, desconto e as datas da promoção.');
    res.status(201).json(await repository.cadastrar(req.body));
}
