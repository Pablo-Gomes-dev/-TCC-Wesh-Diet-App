from fastapi import FastAPI, UploadFile, File
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()


app = FastAPI()

@app.get("/")
def inicio():
        return{
            "status": "online",
            "mensagem": " Backend WeshDiet funcionando"
        }

@app.post("/analise")
async def analisar_paciente(paciente: dict):

    nome = paciente.get("nome", "")
    idade = paciente.get("idade", "")
    peso = paciente.get("peso", "")
    altura = paciente.get("altura", "")
    objetivo = paciente.get("objetivo", "")
    resticoes = paciente.get("restricoes", "")
    observacoes = paciente.get("observacoes", "")

    prompt = f"""
Você é o assistente de análise do WeshDiet.

Dados do paciente:

Nome: {nome}
Idade:{idade}
Peso: {peso} kg
Altura:{altura} cm
Objetivo:{objetivo}
Restrições alimentares:{resticoes}
Observações:{observacoes}

Prepare uma análise nutricional personalizada considerando os dados apresentados.

A análise deverá:
1. Resumir o perfil do paciente.
2. Considerar o objetivo informado.
3. Considerar as restrições alimentares.
4. Apontar cuidados e observações importantes.
5. Sugerir orientações gerais de alimentações.

Não faça diagnóstico médico e não substitua a avaliação de um nutricionista ou médico."""

    api_key = os.getenv("OPENSI_API_KEY")

    if not api_key:
       analise = {
            "perfil": f"{nome}, {idade} anos, {peso} kg e {altura} cm.",
            "objetivo": objetivo,
            "restricoes": resticoes,
            "observacoes": observacoes,
            "orientacoes":[
                 "Manter uma alimentação equilibrada.",
                 "Mantenha-se hidratado.",
                 "Considerar o objetivo informado pelo paciente.",
                 "Respeitar as restrições alimentares cadastrada.",
                 "Buscar acompanhamento de um nutricionista para uma orientação personalizada."
            ]
          }

    return {
        "status": "aguardando_api_key",
        "mensagem": "Análise estruturada criada pelo backend.",
        "paciente": paciente,
        "analise": analise

    }
@app.post("/analise-exame")
async def analisar_exame(arquivo: UploadFile = File(...)):
     conteudo= await arquivo.read()
     print("==================================")
     print("EXAME RECEBIDO PELO BACKEND")
     print("Nome:", arquivo.filename)
     print("Tipo:", arquivo.content_type)
     print("Tamanho:", len(conteudo), "bytes")
     print("==================================")

     return{
          "mensagem": "PDF recebido pelo Backend!",
          "nome_arquivo": arquivo.filename,
          "tipo": arquivo.content_type,
          "tamanho": len(conteudo)
     }
