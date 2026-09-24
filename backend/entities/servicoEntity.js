import { fail } from '../middlewares/error.js';

export default class ServicoEntity {
    constructor({ nome, descricao = '', valor, duracao, imagem = '', ativo = true }) {
        this.nome = typeof nome === 'string' ? nome.trim() : '';
        this.descricao = descricao;
        this.valor = valor;
        this.duracao = Number(duracao);
        this.imagem = imagem;
        this.ativo = ativo !== false;
    }

    validar() {
        if (!this.nome || !Number.isFinite(Number(this.valor)) || Number(this.valor) < 0) {
            fail('Informe o nome e um preço válido.');
        }
        if (!Number.isInteger(this.duracao) || this.duracao < 5 || this.duracao > 600) {
            fail('A duração precisa estar entre 5 e 600 minutos.');
        }
        return true;
    }
}
