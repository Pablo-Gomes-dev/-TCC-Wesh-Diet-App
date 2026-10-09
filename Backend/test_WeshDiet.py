from funcoes_weshdiet import (
    calcular_imc,
    classificar_imc,
    processar_dados_paciente,
    processar_restricoes,
    construir_analise
)


# TU01 - Teste do cálculo do IMC
def test_calcular_imc():
    # Entrada 1
    resultado1 = calcular_imc(80, 1.75)
    assert round(resultado1, 2) == 26.12

    # Entrada 2
    resultado2 = calcular_imc(60, 1.70)
    assert round(resultado2, 2) == 20.76

    # Entrada 3
    resultado3 = calcular_imc(73, 2.00)
    assert round(resultado3, 2) == 18.25

    # Entrada 4
    resultado4 = calcular_imc(98, 1.80)
    assert round(resultado4, 2) == 30.25

    # Entrada 5
    resultado5 = calcular_imc(120, 1.80)
    assert round(resultado5, 2) == 37.04

    # Entrada 6
    resultado6 = calcular_imc(150, 1.80)
    assert round(resultado6, 2) == 46.30


# TU02 - Teste da classificação do IMC
def test_classificar_imc():
    # Entrada 1
    resultado1 = classificar_imc(26.12)
    assert resultado1 == "Sobrepeso"

    # Entrada 2
    resultado2 = classificar_imc(20.76)
    assert resultado2 == "Peso normal"

    # Entrada 3
    resultado3 = classificar_imc(18.25)
    assert resultado3 == "Abaixo do peso"
    
    # Entrada 4
    resultado4 = classificar_imc(30.35)
    assert resultado4 == "Obesidade grau I"
    
    # Entrada 5 
    resultado5 = classificar_imc(35.49)
    assert resultado5 == "Obesidade grau II"

    # Entrada 6
    resultado6 = classificar_imc(46.30)
    assert resultado6 == "Obesidade grau III"

# TU03 - Teste do processamento dos dados do paciente
def test_processar_dados_paciente():
    paciente = {
        "nome": "João",
        "idade": 25,
        "peso": 80,
        "altura": 175,
        "objetivo": "Emagrecimento",
        "restricoes": "Lactose",
        "observacoes": "Sem observações"
    }

    resultado = processar_dados_paciente(paciente)

    assert resultado["nome"] == "João"
    assert resultado["idade"] == 25
    assert resultado["peso"] == 80
    assert resultado["altura"] == 175
    assert resultado["objetivo"] == "Emagrecimento"


# TU04 - Teste das restrições alimentares
def test_processar_restricoes():
    restricoes = "Lactose"

    resultado = processar_restricoes(restricoes)

    assert resultado == ["Lactose"]


# TU05 - Teste da construção da análise
def test_construir_analise():
    paciente = {
        "nome": "João",
        "idade": 25,
        "peso": 80,
        "altura": 175,
        "objetivo": "Emagrecimento",
        "restricoes": "Lactose",
        "observacoes": "Sem observações"
    }

    resultado = construir_analise(paciente)

    assert resultado["perfil"] == "João, 25 anos, 80 kg e 175 cm."
    assert resultado["objetivo"] == "Emagrecimento"
    assert resultado["restricoes"] == "Lactose"
    assert len(resultado["orientacoes"]) == 4