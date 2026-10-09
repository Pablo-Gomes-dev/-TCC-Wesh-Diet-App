import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function assistente_IAScreen() {
  const [resposta, setResposta] = useState("");

  async function enviarParabackend() {
    try {
      const dadosSalvos = await AsyncStorage.getItem("paciente");

      if (!dadosSalvos) {
        Alert.alert("Atenção", "Nenhum paciente cadastrado foi encontardo");
        return;
      }

      const paciente = JSON.parse(dadosSalvos);

      const response = await fetch("http://10.0.0.23:8000/analise", {
        method: "POST",
        headers: { "content-Type": "application/json" },
        body: JSON.stringify(paciente),
      });

      if (!response.ok) {
        throw new Error("Erro HTTP: ${response.status}");
      }

      const dados = await response.json();
      if (dados.analise) {
        const analise = dados.analise;

        const orientacoes = analise.orientacoes
          .map((item: string) => `. ${item}`)
          .join("\n");

        setResposta(
          `Perfil: ${analise.perfil} \n\n` +
            `Obetivo: ${analise.objetivo}\n\n` +
            `Restrições: ${analise.restricoes} \n\n` +
            `Observações: ${analise.observacoes} \n\n` +
            `Orientações: \n ${orientacoes}`,
        );
      } else {
        setResposta(dados.mensagem);
      }
    } catch (error) {
      console.log("Erro ao enviar paciente:", error);

      Alert.alert("Erro", "Não foi possivel conectar ao backend python.");
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => router.back()}
      >
        <Text style={styles.textoVoltar}>⬅ Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Assistente IA</Text>

      <Text style={styles.subtitle}>
        Tire suas duvidas com nosso assitente de IA.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Troca de alimentação</Text>
        <Text style={styles.cardText}>
          Troca de alimentação recomendada pelo seu plano.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Duvidas sobre o plano</Text>
        <Text style={styles.cardText}>
          Faça sua pergunta sobre o plano e receba uma resposta da nossa IA.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sugestão de alimentos</Text>
        <Text style={styles.cardText}>
          Sugestão de alimentos recomendados pela assistente IA
        </Text>
      </View>

      <Pressable style={styles.button} onPress={enviarParabackend}>
        <Text style={styles.buttonText}>Enviar paciente para análise</Text>
      </Pressable>

      {resposta !== "" && <Text style={styles.resposta}>{resposta}</Text>}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
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
    fontSize: 16,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 30,
  },

  card: {
    width: "100%",
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 15,
    marginTop: 8,
  },
  cardText: {
    fontSize: 15,
    marginTop: 8,
  },

  button: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  resposta: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "bold",
  },
});
