// ==============================================================================
// TELA DE DETALHES DO PACIENTE - WESHDIET
// ==============================================================================
// Esta tela permite cadastrar, visualizar e editar os dados cadastrais do paciente
// (nome, idade, peso, altura, objetivos, restrições e observações), calculando
// automaticamente o IMC e sua respectiva classificação nutricional.
// ==============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ------------------------------------------------------------------------------
// FUNÇÃO AUXILIAR DE CLASSIFICAÇÃO DE IMC
// ------------------------------------------------------------------------------
// Retorna a faixa clínica de acordo com o valor calculado do IMC do paciente.
function obterClassificacaoIMC(imc: number): string {
  if (imc < 18.5) {
    return "Abaixo do peso";
  }
  if (imc < 25) {
    return "Peso adequado";
  }
  if (imc < 30) {
    return "Sobrepeso";
  }
  if (imc < 35) {
    return "Obesidade grau I";
  }
  if (imc < 40) {
    return "Obesidade grau II";
  }
  return "Obesidade grau III";
}

// ------------------------------------------------------------------------------
// COMPONENTE PRINCIPAL DA TELA
// ------------------------------------------------------------------------------
export default function DetalhesDoPacienteScreen() {
  // ESTADOS PARA OS DADOS DO FORMULÁRIO DO PACIENTE
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [restricoes, setRestricoes] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // FUNÇÃO DE CÁLCULO DO IMC A PARTIR DO PESO (KG) E ALTURA (CM)
  const calcularIMC = (): number | null => {
    const pesoNumero = parseFloat(peso.replace(",", "."));
    const alturaNumero = parseFloat(altura.replace(",", ".")) / 100;

    if (!pesoNumero || !alturaNumero || alturaNumero <= 0) {
      return null;
    }

    return pesoNumero / (alturaNumero * alturaNumero);
  };

  // CÁLCULO DO VALOR ATUAL DO IMC PARA EXIBIÇÃO EM TELA
  const valorIMC = calcularIMC();

  // CARREGAMENTO DOS DADOS DO PACIENTE PREVIAMENTE SALVOS NO ASYNCSTORAGE
  useEffect(() => {
    const carregarPaciente = async () => {
      try {
        const dadosSalvos = await AsyncStorage.getItem("paciente");
        if (dadosSalvos) {
          const paciente = JSON.parse(dadosSalvos);
          setNome(paciente.nome || "");
          setIdade(paciente.idade || "");
          setPeso(paciente.peso || "");
          setAltura(paciente.altura || "");
          setObjetivo(paciente.objetivo || "");
          setRestricoes(paciente.restricoes || "");
          setObservacoes(paciente.observacoes || "");
        }
      } catch (error) {
        console.error("Erro ao carregar os dados do paciente:", error);
      }
    };

    carregarPaciente();
  }, []);

  // FUNÇÃO PARA PERSISTIR OS DADOS DO PACIENTE NO ASYNCSTORAGE
  const salvarPaciente = async () => {
    if (!nome.trim() || !idade.trim() || !peso.trim() || !altura.trim()) {
      Alert.alert("Campos obrigatórios", "Por favor, preencha nome, idade, peso e altura.");
      return;
    }

    const paciente = {
      nome,
      idade,
      peso,
      altura,
      objetivo,
      restricoes,
      observacoes,
    };

    try {
      await AsyncStorage.setItem("paciente", JSON.stringify(paciente));
      Alert.alert("Sucesso", "Dados do paciente salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar os dados do paciente:", error);
      Alert.alert("Erro", "Ocorreu um erro ao salvar os dados do paciente.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* BOTÃO PARA RETORNAR À TELA ANTERIOR */}
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => router.back()}
      >
        <Text style={styles.textoVoltar}>⬅ Voltar</Text>
      </TouchableOpacity>

      {/* TÍTULO DA PÁGINA */}
      <Text style={styles.title}>Detalhes do Paciente</Text>

      {/* FORMULÁRIO DE ENTRADA DE DADOS */}
      <Text style={styles.label}>Nome:</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o nome do paciente"
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>Idade:</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite a idade do paciente"
        value={idade}
        onChangeText={setIdade}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Peso (kg):</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 75.5"
        value={peso}
        onChangeText={setPeso}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Altura (cm):</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 175"
        value={altura}
        onChangeText={setAltura}
        keyboardType="numeric"
      />

      {/* CARD DINÂMICO DE CÁLCULO E CLASSIFICAÇÃO DO IMC */}
      {valorIMC !== null && (
        <View style={styles.imcContainer}>
          <Text style={styles.imcTitulo}>IMC</Text>
          <Text style={styles.imcValor}>{valorIMC.toFixed(2)}</Text>
          <Text style={styles.imcClassificacao}>{obterClassificacaoIMC(valorIMC)}</Text>
        </View>
      )}

      <Text style={styles.label}>Objetivo:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Emagrecimento, hipertrofia..."
        value={objetivo}
        onChangeText={setObjetivo}
      />

      <Text style={styles.label}>Restrições alimentares:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Lactose, Glúten, Nenhuma..."
        value={restricoes}
        onChangeText={setRestricoes}
      />

      <Text style={styles.label}>Observações:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Digite outras informações importantes..."
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
      />

      {/* BOTÃO DE SALVAMENTO DOS DADOS */}
      <Pressable style={styles.button} onPress={salvarPaciente}>
        <Text style={styles.buttonText}>Salvar Dados</Text>
      </Pressable>
    </ScrollView>
  );
}

// ------------------------------------------------------------------------------
// ESTILOS VISUAIS DA TELA
// ------------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor: "#F5F7FA",
  },

  botaoVoltar: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },

  textoVoltar: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2562EB",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1F2937",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
    color: "#374151",
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#1F2937",
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#2562EB",
    padding: 16,
    marginTop: 25,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  imcContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  imcTitulo: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4B5563",
  },

  imcValor: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
    color: "#2562EB",
  },

  imcClassificacao: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: "600",
    color: "#059669",
  },
});
