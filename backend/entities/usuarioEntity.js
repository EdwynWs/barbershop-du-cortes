export default class UsuarioEntity {
    constructor(row) {
        this.id = row.usu_id;
        this.nome = row.usu_nome;
        this.email = row.usu_email;
        this.telefone = row.usu_telefone;
        this.tipo = row.usu_tipo;
    }
    // Dados de sessão enviados ao frontend. A senha nunca faz parte do retorno.
    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            email: this.email,
            telefone: this.telefone,
            tipo: this.tipo,
        };
    }
    static toMap(row) {
        return new UsuarioEntity(row);
    }
}
