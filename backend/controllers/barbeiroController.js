import bcrypt from 'bcrypt';
import BarbeiroRepository from '../repositories/barbeiroRepository.js';
import BarbeiroEntity from '../entities/barbeiroEntity.js';
const repository = new BarbeiroRepository();
export default class BarbeiroController {
    async listar(req, res) {
        res.json(await repository.listar());
    }
    async listarAdministrativo(req, res) {
    const barbeiros = await repository.listar(true);
    return res.json(barbeiros);
    }
    async cadastrar(req, res) {
        const barbeiro = new BarbeiroEntity(req.body);
        barbeiro.validar(true);
        const senha = await bcrypt.hash(barbeiro.senha, 12);
        res.status(201).json(await repository.gravar(barbeiro, senha));
    }
    async editar(req, res) {
        const barbeiro = new BarbeiroEntity(req.body);
        barbeiro.validar();
        res.json(await repository.gravar(barbeiro, null, req.params.id));
    }
}
