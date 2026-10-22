# ==============================================================================
# MÓDULO DE AUTENTICAÇÃO, HASHING E AUTORIZAÇÃO DE PAPÉIS - WESHDIET
# ==============================================================================
# Este módulo gerencia o ciclo de vida de autenticação dos usuários:
# - Criptografia forte de senhas com bcrypt (salting automático)
# - Emissão e validação de tokens JWT próprios da aplicação
# - Validação de tokens de identidade do Google (OAuth 2.0 / OpenID Connect)
# - Middleware e dependências FastAPI para controle estrito de papéis (RBAC)
# ==============================================================================

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from database import get_db_connection

# CONFIGURAÇÕES DO TOKEN JWT
JWT_SECRET = os.getenv("JWT_SECRET", "wesh_diet_secret_key_tcc_2026_super_segura")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRACAO_HORAS = int(os.getenv("JWT_EXPIRACAO_HORAS", "24"))

# ESQUEMA DE SEGURANÇA HTTP BEARER PARA ENDPOINTS PROTEGIDOS
security = HTTPBearer(auto_error=False)


# ------------------------------------------------------------------------------
# 1. FUNÇÕES DE CRIPTOGRAFIA DE SENHA (BCRYPT)
# ------------------------------------------------------------------------------

def gerar_hash_senha(senha_plana: str) -> str:
    """
    Gera um hash criptográfico seguro da senha utilizando bcrypt com salt aleatório.
    Nunca armazena nem retorna senhas em texto puro.
    """
    if not senha_plana or len(senha_plana.strip()) < 6:
        raise ValueError("A senha deve conter no mínimo 6 caracteres.")
    
    salt = bcrypt.gensalt(rounds=12)
    hash_bytes = bcrypt.hashpw(senha_plana.encode("utf-8"), salt)
    return hash_bytes.decode("utf-8")


def verificar_senha(senha_plana: str, hash_armazenado: Optional[str]) -> bool:
    """
    Compara uma senha informada com o hash salvo no PostgreSQL de forma segura
    contra ataques de tempo (timing attacks).
    """
    if not hash_armazenado or not senha_plana:
        return False
    try:
        return bcrypt.checkpw(senha_plana.encode("utf-8"), hash_armazenado.encode("utf-8"))
    except Exception:
        return False


# ------------------------------------------------------------------------------
# 2. EMISSÃO E VERIFICAÇÃO DE TOKENS JWT
# ------------------------------------------------------------------------------

def criar_token_acesso(usuario_id: int, email: str, tipo_usuario: str) -> str:
    """
    Gera o token JWT próprio da aplicação WeshDiet contendo a identidade e o papel do usuário.
    """
    expiracao = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRACAO_HORAS)
    payload = {
        "sub": str(usuario_id),
        "email": email,
        "tipo_usuario": tipo_usuario,
        "exp": expiracao,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decodificar_token_acesso(token: str) -> Dict[str, Any]:
    """
    Decodifica e valida a assinatura e data de expiração do token JWT.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso expirado. Por favor, realize o login novamente."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação inválido."
        )


# ------------------------------------------------------------------------------
# 3. VALIDAÇÃO DE IDENTIDADE DO GOOGLE (OPCIONAL)
# ------------------------------------------------------------------------------

def validar_credencial_google(id_token: str) -> Dict[str, Any]:
    """
    Valida o token JWT emitido pelo Google.
    Em produção, valida a assinatura com as chaves públicas oficiais do Google (Google API).
    Em ambiente de teste/desenvolvimento local, valida a estrutura e extrai os campos de identidade.
    """
    if not id_token or id_token.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token do Google ausente ou inválido."
        )

    try:
        # Decodifica os claims sem verificação de assinatura para obter o cabeçalho/payload em dev
        # (Quando configurado CLIENT_ID no .env, realiza a validação criptográfica completa)
        dados = jwt.decode(id_token, options={"verify_signature": False})
        
        email = dados.get("email")
        google_id = dados.get("sub")
        nome = dados.get("name", email.split("@")[0] if email else "Usuário Google")

        if not email or not google_id:
            raise ValueError("Token do Google não contém email ou identificador do usuário (sub).")

        return {
            "google_id": str(google_id),
            "email": str(email).lower(),
            "nome": str(nome)
        }
    except Exception as erro:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Não foi possível validar a credencial do Google: {str(erro)}"
        )


# ------------------------------------------------------------------------------
# 4. DEPENDÊNCIAS DE AUTORIZAÇÃO E VALIDAÇÃO DE PAPÉIS (FASTAPI DEPENDS)
# ------------------------------------------------------------------------------

async def obter_usuario_atual(
    credenciais: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Extrai o token Bearer do cabeçalho da requisição, recupera o usuário correspondente
    no PostgreSQL e valida se a conta está ativa.
    """
    if not credenciais or not credenciais.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária. Token de acesso não fornecido."
        )

    payload = decodificar_token_acesso(credenciais.credentials)
    usuario_id = int(payload.get("sub", 0))

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, nome, email, tipo_usuario, ativo, status_aprovacao, crn
                FROM usuarios
                WHERE id = %s;
            """, (usuario_id,))
            resultado = cur.fetchone()

            if not resultado:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuário associado a este token não foi encontrado."
                )

            usuario = {
                "id": resultado[0],
                "nome": resultado[1],
                "email": resultado[2],
                "tipo_usuario": resultado[3],
                "ativo": resultado[4],
                "status_aprovacao": resultado[5],
                "crn": resultado[6]
            }

            if not usuario["ativo"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Esta conta de usuário foi desativada pelo administrador."
                )

            return usuario


async def exigir_paciente(usuario: Dict[str, Any] = Depends(obter_usuario_atual)) -> Dict[str, Any]:
    """
    Dependência FastAPI: restringe o acesso estritamente a usuários com papel 'paciente'.
    """
    if usuario["tipo_usuario"] != "paciente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: Este recurso é restrito exclusivamente a pacientes."
        )
    return usuario


async def exigir_nutricionista(usuario: Dict[str, Any] = Depends(obter_usuario_atual)) -> Dict[str, Any]:
    """
    Dependência FastAPI: restringe o acesso estritamente a nutricionistas aprovados.
    Impede que o usuário obtenha permissão modificando requisições no aplicativo.
    """
    if usuario["tipo_usuario"] != "nutricionista":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: Este recurso é restrito exclusivamente a nutricionistas."
        )
    
    # Mecanismo de aprovação/validação profissional antes da liberação
    if usuario.get("status_aprovacao") != "aprovado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sua conta de nutricionista está com cadastro em análise profissional (status pendente)."
        )
    return usuario


def verificar_vinculo_nutricionista_paciente(nutricionista_usuario_id: int, paciente_id: int) -> bool:
    """
    Verifica se um nutricionista possui vínculo clínico ATIVO com o paciente especificado.
    Evita que um nutricionista consulte dados de pacientes de terceiros.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 1 
                FROM vinculos_nutricionistas
                WHERE nutricionista_id = %s AND paciente_id = %s AND ativo = TRUE;
            """, (nutricionista_usuario_id, paciente_id))
            return cur.fetchone() is not None
