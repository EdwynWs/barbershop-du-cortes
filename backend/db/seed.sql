-- Demonstração SQL alternativa a `npm run seed` (execute apenas uma das duas).
-- pgcrypto é usado somente para criar senhas bcrypt dos usuários de demonstração.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE secret TEXT := 'TroqueEstaSenha123!'; u BIGINT; b BIGINT; cl BIGINT; service_id BIGINT; ap BIGINT; i INTEGER; d INTEGER; current_day DATE; start_time TIME; duration_minutes INTEGER; price NUMERIC(12,2);
BEGIN
  INSERT INTO tb_usuario(usu_nome,usu_email,usu_senha,usu_tipo) VALUES('Du Cortes','admin@ducortes.com.br',crypt(secret,gen_salt('bf')),'ADMIN') ON CONFLICT (usu_email) DO NOTHING;
  INSERT INTO tb_servico(ser_nome,ser_valor,ser_duracao) SELECT v.nome,v.valor,v.duracao FROM (VALUES ('Corte de Cabelo',40.00,45),('Barba',30.00,30),('Corte + Barba',60.00,75),('Sobrancelha',20.00,20),('Pigmentação',50.00,45),('Tratamento Capilar',80.00,60)) AS v(nome,valor,duracao) WHERE NOT EXISTS(SELECT 1 FROM tb_servico s WHERE s.ser_nome=v.nome);
  FOR i IN 1..4 LOOP
    INSERT INTO tb_usuario(usu_nome,usu_email,usu_senha,usu_tipo) VALUES((ARRAY['Lucas','Rafael','Mateus','Gustavo'])[i],'barbeiro'||i||'@ducortes.com.br',crypt(secret,gen_salt('bf')),'BARBEIRO') ON CONFLICT(usu_email) DO UPDATE SET usu_email=EXCLUDED.usu_email RETURNING usu_id INTO u;
    INSERT INTO tb_barbeiro(usu_id,bar_descricao) VALUES(u,'Especialista em estilo e cuidado masculino') ON CONFLICT(usu_id) DO UPDATE SET bar_descricao=EXCLUDED.bar_descricao RETURNING bar_id INTO b;
    INSERT INTO tb_barbeiro_servico(bar_id,ser_id) SELECT b,ser_id FROM tb_servico ON CONFLICT DO NOTHING;
    FOR d IN 1..6 LOOP
      INSERT INTO tb_horario_barbeiro(bar_id,hor_dia_semana,hor_inicio,hor_fim,hor_intervalo_inicio,hor_intervalo_fim) VALUES(b,d,'09:00','19:00','12:00','13:00') ON CONFLICT(bar_id,hor_dia_semana) DO NOTHING;
    END LOOP;
  END LOOP;
  FOR i IN 1..20 LOOP
    INSERT INTO tb_usuario(usu_nome,usu_email,usu_telefone,usu_senha,usu_tipo) VALUES('Cliente '||i,'cliente'||i||'@exemplo.com','1499666'||LPAD(i::text,4,'0'),crypt(secret,gen_salt('bf')),'CLIENTE') ON CONFLICT(usu_email) DO UPDATE SET usu_email=EXCLUDED.usu_email RETURNING usu_id INTO u;
    INSERT INTO tb_cliente(usu_id) VALUES(u) ON CONFLICT(usu_id) DO NOTHING;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM tb_agendamento) THEN
    FOR i IN 1..70 LOOP
      current_day := current_date-i;
      IF EXTRACT(DOW FROM current_day)=0 THEN CONTINUE; END IF;
      SELECT bar_id INTO b FROM tb_barbeiro ORDER BY bar_id OFFSET ((i-1)%4) LIMIT 1;
      SELECT cli_id INTO cl FROM tb_cliente ORDER BY cli_id OFFSET ((i-1)%20) LIMIT 1;
      SELECT ser_id,ser_valor,ser_duracao INTO service_id,price,duration_minutes FROM tb_servico ORDER BY ser_id OFFSET ((i-1)%6) LIMIT 1;
      start_time := make_time(9+(i%8),0,0);
      INSERT INTO tb_agendamento(cli_id,bar_id,ser_id,age_data,age_hora_inicio,age_hora_fim,age_valor,age_status) VALUES(cl,b,service_id,current_day,start_time,start_time+make_interval(mins=>duration_minutes),price,'CONCLUIDO') RETURNING age_id INTO ap;
      INSERT INTO tb_pagamento(age_id,pag_valor,pag_forma,pag_status,pag_data) VALUES(ap,price,'PIX','PAGO',current_day::timestamp+interval '12 hours');
      IF i%3=0 THEN INSERT INTO tb_avaliacao(age_id,cli_id,bar_id,ava_nota) VALUES(ap,cl,b,4+i%2); END IF;
    END LOOP;
  END IF;
  INSERT INTO tb_despesa(des_descricao,des_categoria,des_valor,des_data) SELECT 'Produtos','Produtos',250,current_date WHERE NOT EXISTS(SELECT 1 FROM tb_despesa);
END $$;
