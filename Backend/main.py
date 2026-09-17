from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Paciente(BaseModel):
    nome: str
    idade: str
    peso: str
    altura: str
    objetivo: str
    restricoes: str
    obsevarcoes: str

    @app.get("/")
    def inicio():
        return{
            "status": "online",
            "mensagem": " Backend WeshDiet funcionando"
        }

    @app.post("/analise")
    def analisar_paciente(paciente: Paciente):
        return{
            "status": "sucesso",
            "mensagem": "dados recebidos pelo backend",
            "paciente": paciente
        }

