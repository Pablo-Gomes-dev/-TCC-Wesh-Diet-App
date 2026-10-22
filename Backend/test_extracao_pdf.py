# ==============================================================================
# TESTES UNITÁRIOS DE EXTRAÇÃO DE TEXTO DE PDFS - WESHDIET
# ==============================================================================
# Estes testes validam o comportamento do módulo 'extrator_pdf.py' em múltiplos
# cenários: documentos com texto selecionável, páginas em branco/digitalizadas,
# arquivos corrompidos, arquivos vazios e arquivos que excedem o tamanho máximo.
#
# IMPORTANTE: Todos os testes utilizam dados e arquivos 100% sintéticos gerados
# em memória, sem expor nenhum dado pessoal ou médico de pacientes reais.
# ==============================================================================

import io
from pypdf import PdfWriter
from extrator_pdf import extrair_texto_pdf, LIMITE_TAMANHO_BYTES

# FUNÇÃO AUXILIAR PARA GERAR UM PDF SINTÉTICO VÁLIDO COM TEXTO EM MEMÓRIA
def gerar_pdf_sintetico_com_texto(conteudo_texto: str = "Exame Sintetico: Glicose 85 mg/dL") -> bytes:
    """
    Gera um binário de PDF estruturado com um bloco de texto selecionável.
    """
    pdf_bytes = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length {len(conteudo_texto) + 30} >> stream
BT
/F1 12 Tf
50 200 Td
({conteudo_texto}) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000349 00000 n 
trailer << /Root 1 0 R /Size 6 >>
startxref
450
%%EOF""".encode("latin-1")
    return pdf_bytes


# FUNÇÃO AUXILIAR PARA GERAR UM PDF SINTÉTICO SEM CAMADA DE TEXTO (PÁGINA EM BRANCO)
def gerar_pdf_sintetico_sem_texto() -> bytes:
    """
    Gera um PDF sintético válido com uma página em branco (simulando documento sem camada de texto).
    """
    escritor = PdfWriter()
    escritor.add_blank_page(width=300, height=300)
    buffer = io.BytesIO()
    escritor.write(buffer)
    return buffer.getvalue()


# ------------------------------------------------------------------------------
# TESTE 1: PDF VÁLIDO COM TEXTO SELECIONÁVEL
# ------------------------------------------------------------------------------
def test_extrair_texto_pdf_valido():
    pdf_bytes = gerar_pdf_sintetico_com_texto("Hemograma Completo Sintetico")
    resultado = extrair_texto_pdf(pdf_bytes, "exame_valido.pdf")

    assert resultado["sucesso"] is True
    assert resultado["total_paginas"] == 1
    assert "Hemograma Completo Sintetico" in resultado["texto_extraido"]
    assert len(resultado["paginas"]) == 1
    assert resultado["paginas"][0]["caracteres"] > 0
    assert len(resultado["alertas"]) == 0


# ------------------------------------------------------------------------------
# TESTE 2: PDF VÁLIDO SEM CAMADA DE TEXTO (DIGITALIZADO / SCAN / PÁGINA EM BRANCO)
# ------------------------------------------------------------------------------
def test_extrair_texto_pdf_sem_texto():
    pdf_bytes = gerar_pdf_sintetico_sem_texto()
    resultado = extrair_texto_pdf(pdf_bytes, "exame_digitalizado.pdf")

    # O processamento deve ter sucesso (o PDF foi lido), mas apontar alerta de ausência de texto
    assert resultado["sucesso"] is True
    assert resultado["total_paginas"] == 1
    assert resultado["texto_extraido"] == ""
    assert len(resultado["alertas"]) > 0
    # Verifica que o aviso explícito sobre scans/imagens está presente
    assert "imagem digitalizada" in resultado["alertas"][0].lower()


# ------------------------------------------------------------------------------
# TESTE 3: ARQUIVO CORROMPIDO (BYTES INVÁLIDOS COM CABEÇALHO %PDF-)
# ------------------------------------------------------------------------------
def test_extrair_texto_arquivo_corrompido():
    bytes_corrompidos = b"%PDF-1.4\nbytes_totalmente_corrompidos_que_quebram_o_leitor"
    resultado = extrair_texto_pdf(bytes_corrompidos, "corrompido.pdf")

    assert resultado["sucesso"] is False
    assert resultado["total_paginas"] == 0
    assert "corrompido" in resultado["mensagem"].lower() or "não foi possível ler" in resultado["mensagem"].lower()


# ------------------------------------------------------------------------------
# TESTE 4: ARQUIVO VAZIO (0 BYTES)
# ------------------------------------------------------------------------------
def test_extrair_texto_arquivo_vazio():
    resultado = extrair_texto_pdf(b"", "vazio.pdf")

    assert resultado["sucesso"] is False
    assert resultado["tamanho_bytes"] == 0
    assert "vazio" in resultado["mensagem"].lower()


# ------------------------------------------------------------------------------
# TESTE 5: ARQUIVO QUE EXCEDE O LIMITE DE TAMANHO PERMITIDO (15 MB)
# ------------------------------------------------------------------------------
def test_extrair_texto_limite_tamanho():
    # Cria bytes simulando arquivo ligeiramente maior que o limite
    bytes_excedentes = b"A" * (LIMITE_TAMANHO_BYTES + 1024)
    resultado = extrair_texto_pdf(bytes_excedentes, "arquivo_grande.pdf")

    assert resultado["sucesso"] is False
    assert "limite" in resultado["mensagem"].lower()


# ------------------------------------------------------------------------------
# TESTE 6: ARQUIVO SEM CABEÇALHO VÁLIDO DE PDF
# ------------------------------------------------------------------------------
def test_extrair_texto_cabecalho_invalido():
    bytes_texto_puro = b"Este nao e um arquivo PDF valido, apenas texto puro."
    resultado = extrair_texto_pdf(bytes_texto_puro, "falso.pdf")

    assert resultado["sucesso"] is False
    assert "cabeçalho" in resultado["mensagem"].lower()


# ------------------------------------------------------------------------------
# TESTE 7: INTEGRAÇÃO DO ENDPOINT POST /analisar-exame COM TESTCLIENT
# ------------------------------------------------------------------------------
def test_endpoint_analisar_exame_sucesso():
    from fastapi.testclient import TestClient
    from main import app

    cliente = TestClient(app)
    pdf_bytes = gerar_pdf_sintetico_com_texto("Glicose em Jejum: 92 mg/dL")

    # Simula envio de formulário multipart exatamente como o Expo FileSystem envia
    arquivos = {
        "arquivo": ("exame_glicose.pdf", pdf_bytes, "application/pdf")
    }

    resposta = cliente.post("/analisar-exame", files=arquivos)

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["sucesso"] is True
    assert dados["nome_arquivo"] == "exame_glicose.pdf"
    assert dados["total_paginas"] == 1
    assert "Glicose em Jejum" in dados["texto_extraido"]
    assert "mensagem" in dados  # Contrato esperado pelo frontend Exames.tsx


# ------------------------------------------------------------------------------
# TESTE 8: INTEGRAÇÃO DO ALIAS DO ENDPOINT POST /analise-exame
# ------------------------------------------------------------------------------
def test_endpoint_alias_analise_exame():
    from fastapi.testclient import TestClient
    from main import app

    cliente = TestClient(app)
    pdf_bytes = gerar_pdf_sintetico_com_texto("Colesterol Total: 180 mg/dL")

    arquivos = {
        "arquivo": ("exame_colesterol.pdf", pdf_bytes, "application/pdf")
    }

    resposta = cliente.post("/analise-exame", files=arquivos)

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["sucesso"] is True
    assert "Colesterol Total" in dados["texto_extraido"]


# ------------------------------------------------------------------------------
# TESTE 9: INTEGRAÇÃO DO ENDPOINT COM ARQUIVO CORROMPIDO (TRATAMENTO DE ERRO)
# ------------------------------------------------------------------------------
def test_endpoint_analisar_exame_corrompido():
    from fastapi.testclient import TestClient
    from main import app

    cliente = TestClient(app)
    bytes_corrompidos = b"%PDF-1.4\nbytes_corrompidos_teste"

    arquivos = {
        "arquivo": ("exame_corrompido.pdf", bytes_corrompidos, "application/pdf")
    }

    resposta = cliente.post("/analisar-exame", files=arquivos)

    # O servidor deve responder com status 200 e informar o erro sem quebrar
    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["sucesso"] is False
    assert "corrompido" in dados["mensagem"].lower() or "não foi possível ler" in dados["mensagem"].lower()
