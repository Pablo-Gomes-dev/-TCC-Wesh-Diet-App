def calcular_imc(peso, altura):
    """
    Calcula o IMC utilizando peso em kg e altura em metros.
    """
    return peso / (altura ** 2)


def classificar_imc(imc):
    """
    Classifica o IMC de acordo com faixas simplificadas.
    """
    if imc < 18.5:
        return "Abaixo do peso"
    elif imc < 25:
        return "Peso normal"
    elif imc < 30:
        return "Sobrepeso"
    elif imc < 35:
            return "Obesidade grau I"
    elif imc < 40:
            return "Obesidade grau II"
    else:
        return "Obesidade grau III"


def processar_dados_paciente(paciente):
    """
    Organiza os principais dados recebidos do paciente.
    """
    return {
        "nome": paciente.get("nome", ""),
        "idade": paciente.get("idade", ""),
        "peso": paciente.get("peso", ""),
        "altura": paciente.get("altura", ""),
        "objetivo": paciente.get("objetivo", ""),
        "restricoes": paciente.get("restricoes", ""),
        "observacoes": paciente.get("observacoes", "")
    }


def processar_restricoes(restricoes):
    """
    Verifica se existem restrições alimentares cadastradas.
    """
    if not restricoes:
        return []

    if isinstance(restricoes, str):
        return [restricoes]

    return restricoes


def construir_analise(paciente):
    """
    Cria uma análise estruturada a partir dos dados do paciente.
    """

    nome = paciente.get("nome", "")
    idade = paciente.get("idade", "")
    peso = paciente.get("peso", "")
    altura = paciente.get("altura", "")
    objetivo = paciente.get("objetivo", "")
    restricoes = paciente.get("restricoes", "")
    observacoes = paciente.get("observacoes", "")

    return {
        "perfil": f"{nome}, {idade} anos, {peso} kg e {altura} cm.",
        "objetivo": objetivo,
        "restricoes": restricoes,
        "observacoes": observacoes,
        "orientacoes": [
            "Manter uma alimentação equilibrada.",
            "Considerar o objetivo informado pelo paciente.",
            "Respeitar as restrições alimentares cadastradas.",
            "Buscar acompanhamento de um nutricionista para orientação personalizada."
        ]
    }