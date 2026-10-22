// ==============================================================================
// TELA DE ANÁLISE COM INTELIGÊNCIA ARTIFICIAL - WESHDIET
// ==============================================================================
// Esta tela permite recuperar os dados do paciente salvos localmente (AsyncStorage)
// e enviá-los ao backend FastAPI para geração de uma análise nutricional com IA.
// ==============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// CONFIGURAÇÃO DA URL BASE DO BACKEND
// Utiliza a variável de ambiente EXPO_PUBLIC_API_URL se definida, ou o IP local como fallback.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.0.23:8000";

// COMPONENTE PRINCIPAL DA TELA DE ANÁLISE COM IA
// Nomeado em PascalCase ('AssistenteIAScreen') para respeitar as regras de hooks do React e linter
export default function AssistenteIAScreen() {
  // ESTADO PARA ARMAZENAR E EXIBIR A RESPOSTA GERADA PELO BACKEND / IA
  const [resposta, setResposta] = useState("");

  // FUNÇÃO RESPONSÁVEL POR ENVIAR OS DADOS DO PACIENTE PARA O BACKEND PYTHON
  async function enviarParabackend() {
    try {
      // LEITURA DOS DADOS DO PACIENTE ARMAZENADOS NO ASYNCSTORAGE LOCAL
      const dadosSalvos = await AsyncStorage.getItem("paciente");

      if (!dadosSalvos) {
        Alert.alert("Atenção", "Nenhum paciente cadastrado foi encontrado.");
        return;
      }

      const paciente = JSON.parse(dadosSalvos);

      // REQUISIÇÃO POST PARA O ENDPOINT /analise DO BACKEND FASTAPI
      const response = await fetch(`${API_BASE_URL}/analise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paciente),
      });

      // VERIFICAÇÃO DE RESPOSTA HTTP BEM-SUCEDIDA (CORREÇÃO DE TEMPLATE STRING COM CRASE)
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const dados = await response.json();

      // PROCESSAMENTO E FORMATAÇÃO DA ANÁLISE RETORNADA
      if (dados.analise) {
        const analise = dados.analise;

        const orientacoes = analise.orientacoes
          .map((item: string) => `• ${item}`)
          .join("\n");

        let textoFinal =
          `Perfil: ${analise.perfil}\n\n` +
          `Objetivo: ${analise.objetivo}\n\n` +
          `Restrições: ${analise.restricoes}\n\n` +
          `Observações: ${analise.observacoes}\n\n` +
          `Orientações:\n${orientacoes}`;

        // SE HOUVER RESPOSTA GERADA ESPECIFICAMENTE PELA OPENAI, EXIBE EM DESTAQUE
        if (dados.analise_ia) {
          textoFinal += `\n\n--- Análise da IA ---\n${dados.analise_ia}`;
        }

        setResposta(textoFinal);
      } else {
        setResposta(dados.mensagem || "Análise concluída.");
      }
    } catch (error) {
      console.log("Erro ao enviar paciente para o backend:", error);

      Alert.alert(
        "Erro de Conexão",
        "Não foi possível conectar ao backend Python. Verifique se o servidor está ativo."
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {/* BOTÃO DE VOLTAR PARA A NAVEGAÇÃO ANTERIOR */}
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => router.back()}
      >
        <Text style={styles.textoVoltar}>⬅ Voltar</Text>
      </TouchableOpacity>

      {/* CABEÇALHO DA TELA */}
      <Text style={styles.title}>Assistente IA</Text>
      <Text style={styles.subtitle}>
        Tire suas dúvidas e obtenha análises com nosso assistente de IA.
      </Text>

      {/* CARDS INFORMATIVOS SOBRE OS RECURSOS DISPONÍVEIS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Troca de alimentação</Text>
        <Text style={styles.cardText}>
          Sugestões de substituição e troca de alimentação recomendadas.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dúvidas sobre o plano</Text>
        <Text style={styles.cardText}>
          Tire dúvidas frequentes sobre metas nutricionais e rotina.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sugestão de alimentos</Text>
        <Text style={styles.cardText}>
          Sugestão de alimentos compatíveis com o objetivo do paciente.
        </Text>
      </View>

      {/* BOTÃO DE ENVIO DO PACIENTE PARA ANÁLISE NO BACKEND */}
      <Pressable style={styles.button} onPress={enviarParabackend}>
        <Text style={styles.buttonText}>Enviar paciente para análise</Text>
      </Pressable>

      {/* ÁREA DE EXIBIÇÃO DO RESULTADO DA ANÁLISE */}
      {resposta !== "" && (
        <View style={styles.cardResposta}>
          <Text style={styles.tituloResposta}>Resultado da Análise:</Text>
          <Text style={styles.textoResposta}>{resposta}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ------------------------------------------------------------------------------
// ESTILOS VISUAIS DA TELA
// ------------------------------------------------------------------------------
// Área responsável por definir dimensões, espaçamentos e estética da interface.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#F5F7FA",
  },

  contentContainer: {
    paddingBottom: 40,
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
    color: "#1F2937",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 24,
  },

  card: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },

  cardText: {
    fontSize: 14,
    color: "#6B7280",
  },

  button: {
    width: "100%",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#2562EB",
    marginTop: 10,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  cardResposta: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  tituloResposta: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },

  textoResposta: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
});
