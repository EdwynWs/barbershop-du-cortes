CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS tb_usuario (
    usu_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usu_nome VARCHAR(120) NOT NULL,
    usu_email VARCHAR(255) NOT NULL UNIQUE,
    usu_telefone VARCHAR(25),
    usu_senha TEXT NOT NULL,
    usu_tipo VARCHAR(12) NOT NULL CHECK (usu_tipo IN ('ADMIN', 'BARBEIRO', 'CLIENTE')),
    usu_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    usu_data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tb_cliente (
    cli_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usu_id BIGINT NOT NULL UNIQUE REFERENCES tb_usuario(usu_id),
    cli_data_nascimento DATE,
    cli_observacoes TEXT
);

CREATE TABLE IF NOT EXISTS tb_barbeiro (
    bar_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usu_id BIGINT NOT NULL UNIQUE REFERENCES tb_usuario(usu_id),
    bar_descricao TEXT,
    bar_foto TEXT,
    bar_ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tb_servico (
    ser_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ser_nome VARCHAR(100) NOT NULL,
    ser_descricao TEXT,
    ser_valor NUMERIC(12, 2) NOT NULL CHECK (ser_valor>=0),
    ser_duracao INTEGER NOT NULL CHECK (ser_duracao BETWEEN 5 AND 600),
    ser_imagem TEXT,
    ser_ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tb_barbeiro_servico (
    bar_id BIGINT REFERENCES tb_barbeiro(bar_id) ON DELETE CASCADE,
    ser_id BIGINT REFERENCES tb_servico(ser_id) ON DELETE CASCADE,
    PRIMARY KEY(bar_id, ser_id)
);

CREATE TABLE IF NOT EXISTS tb_horario_barbeiro (
    hor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bar_id BIGINT NOT NULL REFERENCES tb_barbeiro(bar_id),
    hor_dia_semana SMALLINT NOT NULL CHECK (hor_dia_semana BETWEEN 0 AND 6),
    hor_inicio TIME NOT NULL,
    hor_fim TIME NOT NULL,
    hor_intervalo_inicio TIME,
    hor_intervalo_fim TIME,
    hor_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK(hor_inicio<hor_fim),
    CHECK((hor_intervalo_inicio IS NULL AND hor_intervalo_fim IS NULL) OR (hor_inicio<=hor_intervalo_inicio AND hor_intervalo_inicio<hor_intervalo_fim AND hor_intervalo_fim<=hor_fim)),
    UNIQUE(bar_id, hor_dia_semana)
);

CREATE TABLE IF NOT EXISTS tb_bloqueio_barbeiro (
    blo_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bar_id BIGINT NOT NULL REFERENCES tb_barbeiro(bar_id),
    blo_inicio TIMESTAMPTZ NOT NULL,
    blo_fim TIMESTAMPTZ NOT NULL,
    blo_motivo TEXT,
    CHECK(blo_inicio<blo_fim)
);

CREATE TABLE IF NOT EXISTS tb_agendamento (
    age_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cli_id BIGINT NOT NULL REFERENCES tb_cliente(cli_id),
    bar_id BIGINT NOT NULL REFERENCES tb_barbeiro(bar_id),
    ser_id BIGINT NOT NULL REFERENCES tb_servico(ser_id),
    age_data DATE NOT NULL,
    age_hora_inicio TIME NOT NULL,
    age_hora_fim TIME NOT NULL,
    age_valor NUMERIC(12, 2) NOT NULL CHECK(age_valor>=0),
    age_status VARCHAR(20) NOT NULL DEFAULT 'AGENDADO' CHECK(age_status IN ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'NAO_COMPARECEU')),
    age_observacao TEXT,
    age_data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK(age_hora_inicio<age_hora_fim)
);

ALTER TABLE tb_agendamento
    ADD CONSTRAINT sem_sobreposicao
    EXCLUDE USING gist (bar_id WITH =, tsrange((age_data + age_hora_inicio),(age_data + age_hora_fim),'[)') WITH &&)
    WHERE (age_status NOT IN ('CANCELADO','NAO_COMPARECEU'));

CREATE TABLE IF NOT EXISTS tb_pagamento (
    pag_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    age_id BIGINT NOT NULL REFERENCES tb_agendamento(age_id),
    pag_valor NUMERIC(12, 2) NOT NULL CHECK(pag_valor>0),
    pag_forma VARCHAR(20) NOT NULL CHECK(pag_forma IN ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'OUTRO')),
    pag_status VARCHAR(12) NOT NULL DEFAULT 'PAGO' CHECK(pag_status IN ('PAGO', 'PENDENTE', 'CANCELADO', 'ESTORNADO')),
    pag_data TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tb_despesa (
    des_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    des_descricao TEXT NOT NULL,
    des_categoria VARCHAR(80) NOT NULL,
    des_valor NUMERIC(12, 2) NOT NULL CHECK(des_valor>0),
    des_data DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS tb_avaliacao (
    ava_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    age_id BIGINT NOT NULL UNIQUE REFERENCES tb_agendamento(age_id),
    cli_id BIGINT NOT NULL REFERENCES tb_cliente(cli_id),
    bar_id BIGINT NOT NULL REFERENCES tb_barbeiro(bar_id),
    ava_nota SMALLINT NOT NULL CHECK(ava_nota BETWEEN 1 AND 5),
    ava_comentario TEXT,
    ava_data TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tb_notificacao (
    not_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usu_id BIGINT NOT NULL REFERENCES tb_usuario(usu_id),
    not_titulo VARCHAR(160) NOT NULL,
    not_mensagem TEXT NOT NULL,
    not_lida BOOLEAN DEFAULT FALSE,
    not_data TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tb_promocao (
    pro_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pro_titulo VARCHAR(120) NOT NULL,
    pro_descricao TEXT,
    ser_id BIGINT REFERENCES tb_servico(ser_id),
    pro_desconto NUMERIC(12, 2) NOT NULL CHECK(pro_desconto>=0),
    pro_data_inicio DATE NOT NULL,
    pro_data_fim DATE NOT NULL,
    pro_ativo BOOLEAN DEFAULT TRUE,
    CHECK(pro_data_inicio<=pro_data_fim)
);

CREATE INDEX IF NOT EXISTS idx_agenda_data ON tb_agendamento(age_data, bar_id, age_status);

CREATE INDEX IF NOT EXISTS idx_agenda_cliente ON tb_agendamento(cli_id, age_data);

CREATE INDEX IF NOT EXISTS idx_pag_data ON tb_pagamento(pag_data) WHERE pag_status='PAGO';

CREATE INDEX IF NOT EXISTS idx_cliente_nome ON tb_usuario(LOWER(usu_nome));
