# ==============================================================================
# MÓDULO DE EXTRAÇÃO DE TEXTO DE PDFS - WESHDIET
# ==============================================================================
# Este módulo é responsável por processar o arquivo PDF recebido pelo backend,
# validar suas dimensões e integridade, e extrair o texto de todas as páginas
# de maneira determinística e totalmente em memória RAM (sem salvar em disco).
# ==============================================================================

import io
from typing import Any, Dict
from pypdf import PdfReader
from pypdf.errors import PdfReadError

# ------------------------------------------------------------------------------
# CONSTANTES DE CONFIGURAÇÃO E SEGURANÇA
# ------------------------------------------------------------------------------
# Limite máximo de tamanho do arquivo permitido para upload (15 Megabytes).
# Evita consumo excessivo de memória no servidor caso arquivos gigantes sejam enviados.
LIMITE_TAMANHO_BYTES: int = 15 * 1024 * 1024  # 15 MB


def extrair_texto_pdf(conteudo_bytes: bytes, nome_arquivo: str = "documento.pdf") -> Dict[str, Any]:
    """
    Extrai o texto contido em um arquivo PDF fornecido em formato de bytes.

    Parâmetros:
        conteudo_bytes (bytes): Conteúdo binário bruto do arquivo enviado.
        nome_arquivo (str): Nome original do arquivo para identificação e logs.

    Retorno:
        dict: Estrutura contendo o status da extração, mensagens informativas,
              número de páginas processadas, texto extraído e possíveis alertas.
    """
    tamanho_bytes = len(conteudo_bytes) if conteudo_bytes else 0

    # 1. VALIDAÇÃO DE CONTEÚDO VAZIO
    if not conteudo_bytes or tamanho_bytes == 0:
        return {
            "sucesso": False,
            "mensagem": "O arquivo PDF enviado está vazio (0 bytes).",
            "nome_arquivo": nome_arquivo,
            "tamanho_bytes": 0,
            "total_paginas": 0,
            "texto_extraido": "",
            "paginas": [],
            "alertas": ["Arquivo vazio ou não fornecido."]
        }

    # 2. VALIDAÇÃO DO LIMITE MÁXIMO DE TAMANHO
    if tamanho_bytes > LIMITE_TAMANHO_BYTES:
        tamanho_mb = round(tamanho_bytes / (1024 * 1024), 2)
        return {
            "sucesso": False,
            "mensagem": f"O arquivo excede o limite máximo permitido de 15 MB (tamanho atual: {tamanho_mb} MB).",
            "nome_arquivo": nome_arquivo,
            "tamanho_bytes": tamanho_bytes,
            "total_paginas": 0,
            "texto_extraido": "",
            "paginas": [],
            "alertas": ["Arquivo ultrapassa o limite de tamanho."]
        }

    # 3. VALIDAÇÃO DO CABEÇALHO DO PDF (%PDF-)
    # Verifica se os primeiros bytes contêm a assinatura padrão de um documento PDF
    if not conteudo_bytes.startswith(b"%PDF-"):
        return {
            "sucesso": False,
            "mensagem": "O arquivo enviado não possui um cabeçalho válido de documento PDF.",
            "nome_arquivo": nome_arquivo,
            "tamanho_bytes": tamanho_bytes,
            "total_paginas": 0,
            "texto_extraido": "",
            "paginas": [],
            "alertas": ["Formato de arquivo incompatível ou cabeçalho inválido."]
        }

    # 4. PROCESSAMENTO E LEITURA DO PDF EM MEMÓRIA RAM
    # io.BytesIO cria um fluxo de arquivo virtual na memória, sem necessidade de gravar em disco
    fluxo_memoria = io.BytesIO(conteudo_bytes)

    try:
        leitor = PdfReader(fluxo_memoria)

        # 5. TRATAMENTO DE PDF PROTEGIDO COM SENHA
        if leitor.is_encrypted:
            # Tenta descriptografar com senha vazia (comum em alguns geradores de PDF)
            try:
                descriptografado = leitor.decrypt("")
                if descriptografado == 0:
                    return {
                        "sucesso": False,
                        "mensagem": "O arquivo PDF está protegido por senha e não pôde ser aberto.",
                        "nome_arquivo": nome_arquivo,
                        "tamanho_bytes": tamanho_bytes,
                        "total_paginas": len(leitor.pages) if hasattr(leitor, "pages") else 0,
                        "texto_extraido": "",
                        "paginas": [],
                        "alertas": ["Documento criptografado requer senha."]
                    }
            except Exception:
                return {
                    "sucesso": False,
                    "mensagem": "O arquivo PDF está protegido por senha e não pôde ser aberto.",
                    "nome_arquivo": nome_arquivo,
                    "tamanho_bytes": tamanho_bytes,
                    "total_paginas": 0,
                    "texto_extraido": "",
                    "paginas": [],
                    "alertas": ["Documento criptografado requer senha."]
                }

        total_paginas = len(leitor.pages)

        # 6. VERIFICAÇÃO SE O PDF POSSUI PÁGINAS
        if total_paginas == 0:
            return {
                "sucesso": False,
                "mensagem": "O documento PDF não contém páginas válidas.",
                "nome_arquivo": nome_arquivo,
                "tamanho_bytes": tamanho_bytes,
                "total_paginas": 0,
                "texto_extraido": "",
                "paginas": [],
                "alertas": ["Documento sem páginas."]
            }

        textos_paginas = []
        alertas = []
        texto_acumulado = []

        # 7. EXTRAÇÃO PÁGINA POR PÁGINA
        for indice, pagina in enumerate(leitor.pages):
            try:
                texto_pagina = pagina.extract_text() or ""
            except Exception as erro_pagina:
                texto_pagina = ""
                alertas.append(f"Aviso: Não foi possível extrair o texto da página {indice + 1}: {str(erro_pagina)}")

            texto_limpo = texto_pagina.strip()

            textos_paginas.append({
                "numero": indice + 1,
                "caracteres": len(texto_limpo),
                "texto": texto_pagina
            })

            if texto_limpo:
                texto_acumulado.append(texto_pagina)

        texto_total = "\n\n".join(texto_acumulado).strip()

        # 8. TRATAMENTO PARA DOCUMENTOS SEM CAMADA DE TEXTO (DIGITALIZADOS / SCANS)
        # Importante: A ausência de texto NÃO significa ausência de alterações laboratoriais!
        if len(texto_total) == 0:
            aviso_sem_texto = (
                "Nenhum texto selecionável foi encontrado no documento processado. "
                "O exame pode ser uma imagem digitalizada (scan). "
                "Atenção: A ausência de texto extraível não deve ser interpretada como ausência de alterações laboratoriais."
            )
            alertas.append(aviso_sem_texto)

            # LOG SEGURO: Apenas metadados técnicos, sem exibir dados pessoais ou médicos
            print(f"[EXTRATOR PDF] Arquivo: {nome_arquivo} | Páginas: {total_paginas} | Aviso: Sem camada de texto.")

            return {
                "sucesso": True,
                "mensagem": "Documento processado, porém sem texto selecionável identificado.",
                "nome_arquivo": nome_arquivo,
                "tamanho_bytes": tamanho_bytes,
                "total_paginas": total_paginas,
                "texto_extraido": "",
                "paginas": textos_paginas,
                "alertas": alertas
            }

        # LOG SEGURO: Exibe apenas quantidade de páginas e total de caracteres processados
        print(f"[EXTRATOR PDF] Arquivo: {nome_arquivo} | Páginas processadas: {total_paginas} | Caracteres extraídos: {len(texto_total)}")

        return {
            "sucesso": True,
            "mensagem": f"Texto extraído com sucesso de {total_paginas} página(s).",
            "nome_arquivo": nome_arquivo,
            "tamanho_bytes": tamanho_bytes,
            "total_paginas": total_paginas,
            "texto_extraido": texto_total,
            "paginas": textos_paginas,
            "alertas": alertas
        }

    except PdfReadError as erro_leitura:
        return {
            "sucesso": False,
            "mensagem": f"Não foi possível ler o arquivo PDF. O documento pode estar corrompido ou mal formatado ({str(erro_leitura)}).",
            "nome_arquivo": nome_arquivo,
            "tamanho_bytes": tamanho_bytes,
            "total_paginas": 0,
            "texto_extraido": "",
            "paginas": [],
            "alertas": ["Erro de leitura na estrutura interna do PDF."]
        }
    except Exception as erro_inesperado:
        return {
            "sucesso": False,
            "mensagem": f"Ocorreu um erro inesperado ao processar o PDF: {str(erro_inesperado)}",
            "nome_arquivo": nome_arquivo,
            "tamanho_bytes": tamanho_bytes,
            "total_paginas": 0,
            "texto_extraido": "",
            "paginas": [],
            "alertas": ["Falha inesperada no processamento."]
        }
