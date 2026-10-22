import os
import psycopg 
from dotenv import load_dotenv

#Carrega as variaveis do arquivo .env desta pasta.
load_dotenv()

config = {
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME"),
    "user":os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
} 
#Confere se as variaveis obrigatoria estão configuradas.
obrigatorias = ("host","dbname","user","password")
faltantes =[
    nome for nome in obrigatorias
    if not config[nome]
]

if faltantes:
    raise RuntimeError (
        "Variaveis ausentes no .env:"
        + ",".join(faltantes)
    )

try:
    with psycopg.connect(**config, connect_timeout=5) as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(
                "SELECT current_database(), current_user;"
            )
            banco, usuario = cursor.fetchone()

    print("Conexão com PostgreSQL realizada com sucesso!")
    print(f"Banco conectado:{banco}")
    print(f"Usuario conectado:{usuario}")

except psycopg.Error as erro:
    print("Não foi possivel conectar ao postgreSQL.")
    print(f"Tipo do erro: {type(erro).__name__}")
    print(f"Detalhes:{erro}")
    raise

## ARQUIVO FEITO COM O OBJETIVO DE REALIZAR A CONEXÃO DO BANCO DE DADOS COM O BACKEND.