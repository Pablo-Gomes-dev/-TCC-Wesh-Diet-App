-- BANCO DE DADOS DO WESH DIET
-- PRIMEIRA VERSÃO

BEGIN;
--1. CONTAS DOS PACIENTES E DOS NUTRICIONISTAS
CREATE TABLE usuarios(
	id 	BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nome VARCHAR(150) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	senha_hash VARCHAR(255) NOT NULL,
	tipo_usuario VARCHAR(20) NOT NULL,
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT chk_usuarios_tipo
		CHECK (tipo_usuario IN ('paciente', 'nutricionista'))
);

--2. PERFIL DO PACIENTE, AS MEDIDAS FICAM NA QUARTA TABELA.
CREATE TABLE pacientes(
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	usuario_id BIGINT NOT NULL UNIQUE,
	data_nascimento DATE,
	objetivo TEXT,
	restricoes_alimentares TEXT,
	observacoes TEXT,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_pacientes_usuario
			FOREIGN KEY (usuario_id)
			REFERENCES usuarios(id)
			ON  DELETE RESTRICT
);

--3. TABELA DE VINCULOS ATUAIS E HISTORICOS ENTRE NUTICIONISTAS E PACIENTES.
CREATE TABLE vinculos_nutricionistas(
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nutricionista_id BIGINT NOT NULL,
	paciente_id BIGINT NOT NULL,
	data_vinculo TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	CONSTRAINT fk_vinculos_nutricionista
		FOREIGN KEY (nutricionista_id)
		REFERENCES usuarios(id)
		ON DELETE RESTRICT,
	CONSTRAINT fk_vinculos_paciente
		FOREIGN KEY (paciente_id)
		REFERENCES pacientes(id)
		ON DELETE RESTRICT
);

--4. TABELA DE HISTORICO DE MEDIDAS, ALTURA EM CENTIMETROS.
CREATE TABLE avaliacoes_nutricionais(
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	paciente_id BIGINT NOT NULL,
	peso_kg NUMERIC(5,2) NOT NULL,
	altura_cm NUMERIC(5,2) NOT NULL,
	data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	observacoes TEXT,
	CONSTRAINT fk_avaliacoes_paciente
		FOREIGN KEY (paciente_id)
		REFERENCES pacientes(id)
		ON DELETE RESTRICT,
	CONSTRAINT chk_avaliacoes_peso
		CHECK (peso_kg > 0),
	CONSTRAINT chk_avaliacoes_altura
		CHECK (altura_cm > 0)
);

--5. TABELA DE METADADOS E REFERENCIAS PRIVADA DE ARQUIVOS DE EXAME.
CREATE TABLE exames(
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	paciente_id BIGINT NOT NULL,
	enviado_por_usuario_id BIGINT NOT NULL,
	nome_arquivo VARCHAR(255) NOT NULL,
	tipo_arquivo VARCHAR(100) NOT NULL,
	referencia_arquivo TEXT NOT NULL,
	data_envio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	status_processamento VARCHAR(30) NOT NULL DEFAULT 'pendente',
	CONSTRAINT fk_exames_paciente
		FOREIGN KEY (paciente_id)
		REFERENCES pacientes(id)
		ON DELETE RESTRICT,
	CONSTRAINT fk_exames_remetente
		FOREIGN KEY (enviado_por_usuario_id)
		REFERENCES usuarios(id)
		ON DELETE RESTRICT,
	CONSTRAINT chk_exames_status
		CHECK (status_processamento IN ('pendente', 'processando', 'concluido', 'erro'))
);

--6. TABELA DE RELATORIOS E HISTORICOS DE CORRECAO
CREATE TABLE relatorios_exames(
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	exame_id BIGINT NOT NULL,
	relatorio_anterior_id BIGINT,
	texto_extraido TEXT,
	conteudo_relatorio TEXT,
	data_geracao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	status VARCHAR(30) NOT NULL DEFAULT 'gerando',
	CONSTRAINT fk_relatorios_exame
		FOREIGN KEY (exame_id)
		REFERENCES exames(id)
		ON DELETE RESTRICT,
-- CHAVE CANDIDATA  NECESSARIA PARA FK COMPOSTA ABAIXO.
	CONSTRAINT uq_relatorios_id_exame UNIQUE (id, exame_id),
--UMA CORRECAO SO PODE REFERENCIAR RELATOERIO DO MESMO EXAME.
	CONSTRAINT fk_relatorio_anterior_mesmo_exame
		FOREIGN KEY (relatorio_anterior_id, exame_id)
		REFERENCES relatorios_exames(id, exame_id)
		ON DELETE RESTRICT,
	CONSTRAINT chk_relatorio_status
		CHECK (status IN ('gerando', 'finalizado', 'erro')),
	CONSTRAINT chk_relatorio_nao_referenciar_a_si
		CHECK (relatorio_anterior_id IS NULL OR relatorio_anterior_id <> id),
	CONSTRAINT chk_relatorio_finalizado_com_conteudo
		CHECK (
			status <> 'finalizado'
			OR (conteudo_relatorio IS NOT NULL AND LENGTH(TRIM(conteudo_relatorio)) > 0)
		)	
);

-- INDICE PARCIAL, NO MAXIMO UM VINCULO POR PACIENTE.
CREATE UNIQUE INDEX uq_vinculo_ativo_por_paciente
	ON vinculos_nutricionistas (paciente_id)
	WHERE ativo = TRUE;

-- 	INDICE ADICIONAIS PARA CONSULTAS COMUNS DO APP.
CREATE INDEX idx_vinculos_nutricionista
	ON vinculos_nutricionistas (nutricionista_id);
	
CREATE INDEX idx_avaliacoes_pacientes_data
	ON avaliacoes_nutricionais (paciente_id, data_avaliacao DESC);

CREATE INDEX idx_exames_paciente_data
 	ON exames (paciente_id, data_envio DESC);

CREATE INDEX idx_exames_remetente
	ON exames (enviado_por_usuario_id);

CREATE INDEX idx_relatorios_exames_data
	ON relatorios_exames (exame_id, data_geracao DESC);

COMMIT;

--OBS IMPORTANTE:
-- A API FASTAPI AINDA DEVE VALIDAR OS PAPEIS, AUTORIACAO POR PACIENTE
-- TRANSICOES DE STATUS, IMUTABILIDADE DE RELATORIOS FINALIZAD0S,
-- E A CADEIA DE CORRECOES.
-- OS PDF DEVE SER GUARDADO EM LOCAL PRIVADO | NÃO EXPOR REFERENCIAS E CAMINHOS.
-- ESSE SCRIPT É APENAS UM SCHEMA INICIAL PODENDO SOFRER ALTERACOES. :)