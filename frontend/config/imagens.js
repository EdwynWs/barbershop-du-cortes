// Coloque os arquivos nestes caminhos dentro de frontend/public.
// As telas exibem ícones e iniciais enquanto você não adicionar as fotos.
export const imagens = {
    logo: '/images/logo.png',
    ambiente: '/images/ambiente.png',
    banner: '/images/banner-corte.jpg',
    perfil: '/images/perfil.jpg',
};

export function imagemServico(servico) {
    if (servico.ser_imagem) return servico.ser_imagem;
    const nome = servico.ser_nome.toLowerCase();
    if (nome.includes('+')) return '/images/servicos/corte-barba.jpg';
    if (nome.includes('sobrancelha')) return '/images/servicos/sobrancelha.jpg';
    if (nome.includes('pigment')) return '/images/servicos/pigmentacao.jpg';
    if (nome.includes('tratamento')) return '/images/servicos/tratamento.jpg';
    if (nome.includes('barba')) return '/images/servicos/barba.jpg';
    return '/images/servicos/corte.jpg';
}

export function imagemBarbeiro(barbeiro) {
    return (
        barbeiro.bar_foto ||
        `/images/barbeiros/${barbeiro.usu_nome.split(' ')[0].toLowerCase()}.png`
    );
}
