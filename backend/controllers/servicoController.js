import ServicoRepository from '../repositories/servicoRepository.js';
import ServicoEntity from '../entities/servicoEntity.js';
import { fail } from '../middlewares/error.js';
const repository = new ServicoRepository();

export default class ServicoController {
    async listar(req, res) {
        res.json(await repository.listar(req.query.todos === 'true'));
    }
    async cadastrar(req, res) {
        const servico = new ServicoEntity(req.body);
        servico.validar();
        res.status(201).json(await repository.gravar(servico));
    }
    async editar(req, res) {
        const servico = new ServicoEntity(req.body);
        servico.validar();
        const result = await repository.gravar(servico, req.params.id);
        if (!result) fail('Serviço não encontrado.', 404);
        res.json(result);
    }
    async desativar(req, res) {
        const result = await repository.desativar(req.params.id);
        if (!result) fail('Serviço não encontrado.', 404);
        res.json({ ok: true });
    }
}
