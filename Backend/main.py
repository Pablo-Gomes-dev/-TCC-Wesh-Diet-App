# ==============================================================================
# BACKEND WESHDIET - API FASTAPI
# ==============================================================================
# Servidor principal da aplicação backend WeshDiet:
# - Gerenciamento de rotas de autenticação (Cadastro, Login e Google OAuth)
# - Controle de autorização baseado em papéis (Paciente vs Nutricionista)
# - Análise de exames em PDF e assistência nutricional
# ==============================================================================

import os
import uuid
import pathlib
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# DIRETÓRIO PRIVADO PARA ARMAZENAMENTO DOS PDFs DOS EXAMES
# Os arquivos são guardados fora da pasta pública para proteger dados sensíveis de saúde.
# O frontend nunca acessa este diretório diretamente — todo acesso passa pela API.
STORAGE_DIR = pathlib.Path(__file__).parent / "storage_privado" / "exames"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# IMPORTAÇÃO DOS MÓDULOS INTERNOS DO BACKEND
from database import get_db_connection
from extrator_pdf import extrair_texto_pdf
from auth import (
    gerar_hash_senha,
    verificar_senha,
    criar_token_acesso,
    validar_credencial_google,
    obter_usuario_atual,
    exigir_paciente,
    exigir_nutricionista,
    verificar_vinculo_nutricionista_paciente
)

# CARREGAMENTO DAS VARIÁVEIS DE AMBIENTE (.env)
load_dotenv()

# INICIALIZAÇÃO DA APLICAÇÃO FASTAPI
app = FastAPI(
    title="WeshDiet Backend API",
    description="API para gestão nutricional, autenticação por papéis e análise de exames",
    version="1.1.0"
)

# CONFIGURAÇÃO DE CORS PARA COMUNICAÇÃO COM O FRONTEND EXPO / REACT NATIVE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# ESQUEMAS PYDANTIC PARA VALIDAÇÃO DAS REQUISIÇÕES DE AUTENTICAÇÃO
# ==============================================================================

class CadastroUsuarioRequest(BaseModel):
    nome: str = Field(..., min_length=2, max_length=150, description="Nome completo do usuário")
    email: str = Field(..., min_length=5, max_length=255, description="E-mail único de acesso")
    senha: str = Field(..., min_length=6, description="Senha de acesso (mínimo 6 caracteres)")
    tipo_usuario: str = Field(..., description="Papel da conta: 'paciente' ou 'nutricionista'")
    crn: Optional[str] = Field(None, max_length=50, description="Conselho Regional de Nutricionistas (obrigatório para aprovação profissional)")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="E-mail cadastrado")
    senha: str = Field(..., description="Senha da conta")



class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., description="Token de identidade OpenID Connect do Google")
    tipo_usuario: Optional[str] = Field(None, description="Papel do usuário (obrigatório somente se for uma nova conta)")


# ==============================================================================
# 1. ROTAS DE STATUS E BOAS-VINDAS
# ==============================================================================

@app.get("/")
def inicio():
    return {
        "status": "online",
        "mensagem": "Backend WeshDiet funcionando com PostgreSQL e FastAPI"
    }


# ==============================================================================
# 2. ROTAS DE CADASTRO E AUTENTICAÇÃO (AUTH)
# ==============================================================================

@app.post("/auth/cadastro", status_code=status.HTTP_201_CREATED)
def cadastrar_usuario(dados: CadastroUsuarioRequest):
    """
    Cadastra um novo usuário no sistema WeshDiet.
    - Exige a escolha do papel ('paciente' ou 'nutricionista').
    - Valida o e-mail único.
    - Criptografa a senha com bcrypt.
    - Se for nutricionista, valida a presença de CRN para aprovação.
    - Se for paciente, cria o perfil correspondente na tabela pacientes.
    - Emite o token JWT próprio da aplicação para login imediato.
    """
    tipo_limpo = dados.tipo_usuario.strip().lower()
    if tipo_limpo not in ("paciente", "nutricionista"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Papel inválido. Escolha entre 'paciente' ou 'nutricionista'."
        )

    email_formatado = dados.email.strip().lower()

    # Validação profissional para nutricionista
    status_aprovacao = "aprovado"
    if tipo_limpo == "nutricionista":
        if not dados.crn or dados.crn.strip() == "":
            status_aprovacao = "pendente"  # Requer validação profissional antes do acesso pleno

    senha_criptografada = gerar_hash_senha(dados.senha)

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Verifica duplicidade de e-mail
            cur.execute("SELECT id FROM usuarios WHERE email = %s;", (email_formatado,))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Este e-mail já está cadastrado. Por favor, faça login ou use outro e-mail."
                )

            # 2. Insere na tabela 'usuarios'
            cur.execute("""
                INSERT INTO usuarios (
                    nome, email, senha_hash, tipo_usuario, ativo, metodo_auth, crn, status_aprovacao
                )
                VALUES (%s, %s, %s, %s, TRUE, 'local', %s, %s)
                RETURNING id, nome, email, tipo_usuario, status_aprovacao;
            """, (
                dados.nome.strip(),
                email_formatado,
                senha_criptografada,
                tipo_limpo,
                dados.crn.strip() if dados.crn else None,
                status_aprovacao
            ))
            novo_usuario = cur.fetchone()
            usuario_id = novo_usuario[0]

            # 3. Se for paciente, cria o registro correspondente na tabela 'pacientes'
            if tipo_limpo == "paciente":
                cur.execute("""
                    INSERT INTO pacientes (usuario_id)
                    VALUES (%s)
                    ON CONFLICT (usuario_id) DO NOTHING;
                """, (usuario_id,))

    # 4. Emite o token JWT com o papel atribuído
    token = criar_token_acesso(
        usuario_id=usuario_id,
        email=email_formatado,
        tipo_usuario=tipo_limpo
    )

    return {
        "sucesso": True,
        "mensagem": "Cadastro realizado com sucesso!",
        "token": token,
        "usuario": {
            "id": usuario_id,
            "nome": novo_usuario[1],
            "email": novo_usuario[2],
            "tipo_usuario": novo_usuario[3],
            "status_aprovacao": novo_usuario[4]
        }
    }


@app.post("/auth/login")
def login_usuario(dados: LoginRequest):
    """
    Autentica um usuário existente com e-mail e senha.
    - Busca o usuário no PostgreSQL.
    - Valida o hash com bcrypt.
    - Recupera o papel registrado no banco de dados (não permite alteração pelo frontend).
    - Emite o token JWT com o papel correto para direcionamento.
    """
    email_formatado = dados.email.strip().lower()

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, nome, email, senha_hash, tipo_usuario, ativo, status_aprovacao, metodo_auth
                FROM usuarios
                WHERE email = %s;
            """, (email_formatado,))
            registro = cur.fetchone()

            if not registro:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="E-mail ou senha incorretos."
                )

            usuario_id, nome, email, senha_hash, tipo_usuario, ativo, status_aprovacao, metodo_auth = registro

            if not ativo:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Esta conta de usuário foi desativada."
                )

            # Se a conta foi criada exclusivamente pelo Google e não possui senha cadastrada
            if not senha_hash:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Esta conta foi cadastrada com o Google. Por favor, entre utilizando o botão 'Entrar com Google'."
                )

            # Validação criptográfica da senha
            if not verificar_senha(dados.senha, senha_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="E-mail ou senha incorretos."
                )

    token = criar_token_acesso(
        usuario_id=usuario_id,
        email=email,
        tipo_usuario=tipo_usuario
    )

    return {
        "sucesso": True,
        "mensagem": "Login realizado com sucesso!",
        "token": token,
        "usuario": {
            "id": usuario_id,
            "nome": nome,
            "email": email,
            "tipo_usuario": tipo_usuario,
            "status_aprovacao": status_aprovacao
        }
    }


@app.post("/auth/google")
def login_google(dados: GoogleAuthRequest):
    """
    Autentica ou cadastra um usuário utilizando a credencial do Google (Opcional).
    - Valida o id_token recebido.
    - Se a conta já existe: recupera o papel registrado no PostgreSQL (NÃO sobrescreve).
    - Se for uma conta nova: exige a escolha do papel ('paciente' ou 'nutricionista') e cadastra.
    - Se o e-mail já existir cadastrado por senha local: não vincula automaticamente às cegas.
    """
    info_google = validar_credencial_google(dados.id_token)
    google_id = info_google["google_id"]
    email = info_google["email"]
    nome = info_google["nome"]

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Verifica se já existe um usuário com este google_id
            cur.execute("""
                SELECT id, nome, email, tipo_usuario, ativo, status_aprovacao
                FROM usuarios
                WHERE google_id = %s;
            """, (google_id,))
            usuario_existente = cur.fetchone()

            if usuario_existente:
                usuario_id, nome_db, email_db, tipo_usuario, ativo, status_aprovacao = usuario_existente
                if not ativo:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Esta conta de usuário foi desativada."
                    )
            else:
                # 2. Verifica se o e-mail já existe com outro método de autenticação
                cur.execute("SELECT id, metodo_auth FROM usuarios WHERE email = %s;", (email,))
                conflito_email = cur.fetchone()
                if conflito_email:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Este e-mail já possui uma conta criada com e-mail e senha. Por segurança, entre com sua senha para vincular sua conta Google."
                    )

                # 3. É um novo usuário Google: a escolha do papel é obrigatória agora
                if not dados.tipo_usuario or dados.tipo_usuario.strip().lower() not in ("paciente", "nutricionista"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Conta nova identificada: Selecione o seu papel ('paciente' ou 'nutricionista') para concluir o cadastro com o Google."
                    )

                tipo_usuario = dados.tipo_usuario.strip().lower()
                status_aprovacao = "aprovado"

                # Insere o novo usuário Google (senha_hash permanece NULL de forma segura)
                cur.execute("""
                    INSERT INTO usuarios (
                        nome, email, senha_hash, tipo_usuario, ativo, google_id, metodo_auth, status_aprovacao
                    )
                    VALUES (%s, %s, NULL, %s, TRUE, %s, 'google', %s)
                    RETURNING id;
                """, (nome, email, tipo_usuario, google_id, status_aprovacao))
                usuario_id = cur.fetchone()[0]

                # Se paciente, cria registro correspondente
                if tipo_usuario == "paciente":
                    cur.execute("""
                        INSERT INTO pacientes (usuario_id)
                        VALUES (%s)
                        ON CONFLICT (usuario_id) DO NOTHING;
                    """, (usuario_id,))

    token = criar_token_acesso(
        usuario_id=usuario_id,
        email=email,
        tipo_usuario=tipo_usuario
    )

    return {
        "sucesso": True,
        "mensagem": "Autenticação com Google realizada com sucesso!",
        "token": token,
        "usuario": {
            "id": usuario_id,
            "nome": nome,
            "email": email,
            "tipo_usuario": tipo_usuario,
            "status_aprovacao": status_aprovacao
        }
    }


@app.get("/auth/me")
def obter_perfil_logado(usuario: dict = Depends(obter_usuario_atual)):
    """
    Retorna os dados do usuário autenticado a partir do token JWT.
    Utilizado pelo frontend ao iniciar o aplicativo para validar a sessão salva
    e direcionar imediatamente para a área correta sem refazer login.
    """
    return {
        "sucesso": True,
        "usuario": usuario
    }


# ==============================================================================
# 3. ROTAS PROTEGIDAS PARA TESTE E VALIDAÇÃO DE AUTORIZAÇÃO POR PAPEL
# ==============================================================================

@app.get("/auth/paciente/meu-espaco")
def espaco_do_paciente(usuario: dict = Depends(exigir_paciente)):
    """
    Rota exclusiva para pacientes. Rejeita com 403 se um nutricionista tentar acessar.
    """
    return {
        "sucesso": True,
        "mensagem": f"Bem-vindo à área do paciente, {usuario['nome']}!",
        "area": "paciente",
        "usuario_id": usuario["id"]
    }


@app.get("/auth/nutricionista/meu-painel")
def painel_do_nutricionista(usuario: dict = Depends(exigir_nutricionista)):
    """
    Rota exclusiva para nutricionistas aprovados. Rejeita com 403 se um paciente tentar acessar.
    """
    return {
        "sucesso": True,
        "mensagem": f"Bem-vindo ao painel do nutricionista, {usuario['nome']}!",
        "area": "nutricionista",
        "crn": usuario.get("crn"),
        "usuario_id": usuario["id"]
    }


@app.get("/pacientes/{paciente_id}/dados-clinicos")
def consultar_dados_clinicos_paciente(
    paciente_id: int,
    usuario: dict = Depends(obter_usuario_atual)
):
    """
    Consulta dados clínicos garantindo que:
    - Um paciente só acessa o seu próprio prontuário.
    - Um nutricionista só acessa pacientes com vínculo clínico ATIVO.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, usuario_id, objetivo, restricoes_alimentares FROM pacientes WHERE id = %s;", (paciente_id,))
            paciente = cur.fetchone()
            if not paciente:
                raise HTTPException(status_code=404, detail="Paciente não encontrado.")

            paciente_usuario_id = paciente[1]

            # Validação estrita de autorização
            if usuario["tipo_usuario"] == "paciente":
                if usuario["id"] != paciente_usuario_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Acesso negado: Você não tem permissão para consultar dados de outro paciente."
                    )
            elif usuario["tipo_usuario"] == "nutricionista":
                tem_vinculo = verificar_vinculo_nutricionista_paciente(usuario["id"], paciente_id)
                if not tem_vinculo:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Acesso negado: Nutricionista não possui vínculo clínico ativo com este paciente."
                    )

            return {
                "sucesso": True,
                "paciente_id": paciente[0],
                "objetivo": paciente[2],
                "restricoes": paciente[3]
            }


# ==============================================================================
# 4. ROTAS DE EXAMES E ANÁLISE PREEXISTENTES (PRESERVADAS INTEGRALMENTE)
# ==============================================================================

@app.post("/analise")
async def analisar_paciente(paciente: dict):
    """
    Gera análise estruturada do paciente (compatível com a tela Analise_IA.tsx).
    """
    nome = paciente.get("nome", "")
    idade = paciente.get("idade", "")
    peso = paciente.get("peso", "")
    altura = paciente.get("altura", "")
    objetivo = paciente.get("objetivo", "")
    resticoes = paciente.get("restricoes", "")
    observacoes = paciente.get("observacoes", "")

    prompt = f"""Você é o assistente de análise nutricional do WeshDiet.
Dados do paciente: {nome}, {idade} anos, {peso} kg, {altura} cm, Objetivo: {objetivo}, Restrições: {resticoes}."""

    api_key = os.getenv("OPENAI_API_KEY")

    analise_padrao = {
        "perfil": f"{nome}, {idade} anos, {peso} kg e {altura} cm.",
        "objetivo": objetivo,
        "restricoes": resticoes,
        "observacoes": observacoes,
        "orientacoes": [
            "Manter uma alimentação equilibrada e variada.",
            "Mantenha-se hidratado ao longo do dia.",
            "Respeitar as restrições alimentares cadastradas.",
            "Buscar acompanhamento profissional para plano individualizado."
        ]
    }

    if api_key and api_key.strip() != "":
        try:
            client = OpenAI(api_key=api_key)
            resposta = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}]
            )
            return {
                "status": "sucesso",
                "mensagem": "Análise gerada com IA.",
                "paciente": paciente,
                "analise": analise_padrao,
                "analise_ia": resposta.choices[0].message.content
            }
        except Exception:
            pass

    return {
        "status": "aguardando_api_key",
        "mensagem": "Análise estruturada criada pelo backend WeshDiet.",
        "paciente": paciente,
        "analise": analise_padrao
    }


@app.post("/analise-exame")
@app.post("/analisar-exame")
async def analisar_exame(
    arquivo: UploadFile = File(...),
    paciente_id: Optional[int] = Form(None),
    usuario: dict = Depends(obter_usuario_atual)
):
    """
    Recebe o PDF do exame, extrai o texto, salva em armazenamento privado e
    registra os metadados no banco de dados.

    Segurança:
    - Requer autenticação via token JWT (Bearer).
    - Valida o tipo e o conteúdo do arquivo antes de salvar.
    - Nunca expõe o caminho absoluto do arquivo; usa apenas uma referência interna (UUID).
    - Operação atômica: se o registro no banco falhar, o arquivo salvo é removido.
    """
    # LEITURA DO CONTEÚDO BRUTO DO ARQUIVO ENVIADO
    conteudo = await arquivo.read()

    # VALIDAÇÃO DO TAMANHO MÁXIMO (10 MB)
    TAMANHO_MAXIMO = 10 * 1024 * 1024
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="O arquivo excede o tamanho máximo permitido de 10 MB."
        )

    # VALIDAÇÃO DO TIPO DO ARQUIVO PELOS BYTES MÁGICOS (não confia só na extensão)
    # Os PDFs sempre começam com os bytes %PDF (0x25 0x50 0x44 0x46).
    if not conteudo.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="O arquivo enviado não é um PDF válido."
        )

    # EXTRAÇÃO DO TEXTO DO PDF EM MEMÓRIA (sem salvar em disco ainda)
    resultado_extracao = extrair_texto_pdf(
        conteudo_bytes=conteudo,
        nome_arquivo=arquivo.filename or "exame.pdf"
    )

    # GERAÇÃO DE REFERÊNCIA INTERNA ÚNICA PARA O ARQUIVO
    # Usamos UUID para evitar colisões e não expor o nome original na estrutura de arquivos.
    referencia_interna = f"{uuid.uuid4()}.pdf"
    caminho_arquivo = STORAGE_DIR / referencia_interna

    # DETERMINAÇÃO DO PACIENTE ASSOCIADO AO EXAME
    # - Se o usuário for um paciente, o exame pertence a ele mesmo.
    # - Se for um nutricionista, o paciente_id deve ser enviado pelo frontend.
    id_usuario_logado = usuario["id"]
    tipo_usuario = usuario["tipo_usuario"]

    id_paciente_final: Optional[int] = None

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if tipo_usuario == "paciente":
                # BUSCA O ID DO REGISTRO DE PACIENTE VINCULADO AO USUÁRIO LOGADO
                cur.execute(
                    "SELECT id FROM pacientes WHERE usuario_id = %s",
                    (id_usuario_logado,)
                )
                registro_paciente = cur.fetchone()
                if not registro_paciente:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Registro de paciente não encontrado para o usuário autenticado."
                    )
                id_paciente_final = registro_paciente[0]

            elif tipo_usuario == "nutricionista":
                if not paciente_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="O campo paciente_id é obrigatório para nutricionistas."
                    )
                # VERIFICA SE O NUTRICIONISTA TEM VÍNCULO ATIVO COM O PACIENTE
                cur.execute(
                    """
                    SELECT 1 FROM vinculos_nutricionistas
                    WHERE nutricionista_id = %s AND paciente_id = %s AND ativo = TRUE
                    """,
                    (id_usuario_logado, paciente_id)
                )
                if not cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Você não possui vínculo ativo com este paciente."
                    )
                id_paciente_final = paciente_id

            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tipo de usuário não autorizado a enviar exames."
                )

            # SALVAMENTO DO ARQUIVO NO DIRETÓRIO PRIVADO
            # Realizado antes do INSERT para poder fazer rollback em caso de falha no banco.
            try:
                caminho_arquivo.write_bytes(conteudo)
            except OSError as erro_disco:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Falha ao salvar o arquivo no servidor."
                ) from erro_disco

            # REGISTRO DOS METADADOS DO EXAME NO BANCO DE DADOS
            # Em caso de falha, o arquivo salvo é removido para evitar arquivos órfãos.
            try:
                cur.execute(
                    """
                    INSERT INTO exames
                        (paciente_id, enviado_por_usuario_id, nome_arquivo, tipo_arquivo,
                         referencia_arquivo, data_envio, status_processamento)
                    VALUES (%s, %s, %s, %s, %s, NOW(), %s)
                    RETURNING id
                    """,
                    (
                        id_paciente_final,
                        id_usuario_logado,
                        arquivo.filename,
                        arquivo.content_type or "application/pdf",
                        referencia_interna,       # Apenas o UUID, nunca o caminho absoluto
                        "concluido"
                    )
                )
                exame_id = cur.fetchone()[0]
                conn.commit()
            except Exception as erro_bd:
                # ROLLBACK: remove o arquivo do disco se o banco falhou
                if caminho_arquivo.exists():
                    caminho_arquivo.unlink()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Falha ao registrar o exame no banco de dados."
                ) from erro_bd

    return {
        "sucesso": resultado_extracao["sucesso"],
        "mensagem": resultado_extracao["mensagem"],
        "exame_id": exame_id,
        "nome_arquivo": arquivo.filename,
        "tipo": arquivo.content_type,
        "tamanho": len(conteudo),
        "total_paginas": resultado_extracao["total_paginas"],
        "texto_extraido": resultado_extracao["texto_extraido"],
        "paginas": resultado_extracao["paginas"],
        "alertas": resultado_extracao["alertas"]
    }


# ==============================================================================
# ROTA: LISTAGEM DOS EXAMES DO USUÁRIO AUTENTICADO
# ==============================================================================

@app.get("/exames/meus")
def listar_meus_exames(usuario: dict = Depends(obter_usuario_atual)):
    """
    Retorna a lista de exames visíveis para o usuário autenticado.

    Regras por papel:
    - Paciente: vê somente os próprios exames (filtrado pelo paciente vinculado ao seu usuário).
    - Nutricionista: vê os exames de todos os pacientes com vínculo ativo.

    Segurança:
    - Requer autenticação via JWT.
    - Nunca retorna a referência interna do arquivo (caminho privado) ao frontend.
    - Metadados sensíveis são omitidos da resposta.
    """
    id_usuario = usuario["id"]
    tipo_usuario = usuario["tipo_usuario"]

    with get_db_connection() as conn:
        with conn.cursor() as cur:

            if tipo_usuario == "paciente":
                # BUSCA OS EXAMES PERTENCENTES AO PACIENTE LOGADO
                cur.execute(
                    """
                    SELECT
                        e.id,
                        e.nome_arquivo,
                        e.data_envio,
                        e.status_processamento,
                        e.paciente_id,
                        u.nome AS nome_paciente
                    FROM exames e
                    JOIN pacientes p ON e.paciente_id = p.id
                    JOIN usuarios u ON p.usuario_id = u.id
                    WHERE p.usuario_id = %s
                    ORDER BY e.data_envio DESC
                    """,
                    (id_usuario,)
                )

            elif tipo_usuario == "nutricionista":
                # BUSCA OS EXAMES DE TODOS OS PACIENTES VINCULADOS AO NUTRICIONISTA
                cur.execute(
                    """
                    SELECT
                        e.id,
                        e.nome_arquivo,
                        e.data_envio,
                        e.status_processamento,
                        e.paciente_id,
                        u.nome AS nome_paciente
                    FROM exames e
                    JOIN vinculos_nutricionistas v ON e.paciente_id = v.paciente_id
                    JOIN pacientes p ON e.paciente_id = p.id
                    JOIN usuarios u ON p.usuario_id = u.id
                    WHERE v.nutricionista_id = %s AND v.ativo = TRUE
                    ORDER BY e.data_envio DESC
                    """,
                    (id_usuario,)
                )

            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tipo de usuário sem permissão para listar exames."
                )

            registros = cur.fetchall()

    # FORMATAÇÃO DA RESPOSTA — sem expor referencia_arquivo nem caminhos internos
    exames = []
    for registro in registros:
        exame_id, nome_arquivo, data_envio, status_proc, paciente_id, nome_paciente = registro
        exames.append({
            "id": exame_id,
            "nome_arquivo": nome_arquivo or "exame.pdf",
            "data_envio": data_envio.strftime("%d/%m/%Y") if data_envio else None,
            "status_processamento": status_proc,
            "paciente_id": paciente_id,
            "nome_paciente": nome_paciente,
        })

    return {"exames": exames}
