import * as documentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Exames() {
  const [exameSelecionado, setExameSelecionado] = useState<{
    nome: string;
    uri: string;
    tipo: string;
  } | null>(null);

  //Exames fictícios apenas para testar a interface.
  // Posteriomente esses dados virão do armazenamento/banco de dados.
  const exames = [
    {
      id: "1",
      nome: "Hemograma.pdf",
      origem: "Enviado pelo paciente",
      data: "15/09/2026",
    },
    {
      id: "2",
      nome: "Exame_sangue.pdf",
      origem: "Enviado pelo paciente",
      data: "18/09/2026",
    },
  ];

  function visualizarExame(nome: string) {
    Alert.alert("Visualizar exame", `exame selecionado:\n${nome}`);
  }

  async function analisarExame() {
    if (!exameSelecionado) {
      Alert.alert(
        "Nenhum exame",
        "Selecione um exame antes de enviar para análise.",
      );
      return;
    }

    try {
      console.log("Iniciando envio do PDF...");
      console.log("Arquivo:", exameSelecionado.nome);
      console.log("URI:", exameSelecionado.uri);

      const resposta = await FileSystem.uploadAsync(
        "http://10.0.0.23:8000/analisar-exame",
        exameSelecionado.uri,
        {
          fieldName: "arquivo",
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType: "application/pdf",
        },
      );

      console.log("STATUS:", resposta.status);
      console.log("RESPOSTA:", resposta.body);

      if (resposta.status < 200 || resposta.status >= 300) {
        throw new Error(
          `Backend respondeu com status ${resposta.status}: ${resposta.body}`,
        );
      }

      const dados = JSON.parse(resposta.body);

      Alert.alert("Sucesso", dados.mensagem || "PDF recebido pelo Backend!");
    } catch (error) {
      console.error("ERRO AO ENVIAR EXAME:", error);

      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o exame para o Backend.",
      );
    }
  }

  async function selecionarExame() {
    try {
      const resultado = await documentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (resultado.canceled) {
        return;
      }

      const arquivo = resultado.assets[0];
      setExameSelecionado({
        nome: arquivo.name,
        uri: arquivo.uri,
        tipo: arquivo.mimeType as string,
      });
    } catch (error) {
      console.error("Erro ao selecionar o exame:", error);

      Alert.alert(
        "Erro",

        "não foi possivel selecionar exame.",
      );
    }
  }

  async function visualizarExameSelecionado() {
    if (!exameSelecionado) {
      Alert.alert("Nenhum exame", "Selecione um exame para visualizar.");
      return;
    }

    try {
      const contentUri = await FileSystem.getContentUriAsync(
        exameSelecionado.uri,
      );

      console.log("URI original:", exameSelecionado.uri);
      console.log("URI para Android:", contentUri);

      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        type: "application/pdf",
        flags: 1,
      });
    } catch (error) {
      console.error("Erro ao abrir o exame:", error);

      Alert.alert("Erro", "Não foi possível abrir o PDF.");
    }
  }
  function trocarExame() {
    setExameSelecionado(null);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => router.back()}
      >
        <Text style={styles.textoVoltar}>⬅ Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Exames</Text>

      <Text style={styles.subtitulo}>Exames disponiveis para o paciente</Text>

      {/* EXAMES DO PACIENTE */}
      {exames.map((exame) => (
        <View key={exame.id} style={styles.card}>
          <Text style={styles.nomeExame}>📄{exame.nome}</Text>

          <Text style={styles.info}>{exame.origem}</Text>

          <Text style={styles.data}>{exame.data}</Text>

          <View style={styles.botoes}>
            <TouchableOpacity
              style={styles.botaoAnalise}
              onPress={() => visualizarExame(exame.nome)}
            >
              <Text style={styles.textoBotao}>Enviar para análise</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* ADICIONAR EXAME*/}
      <Text style={styles.subtitulo}>Adicionar novo exame</Text>

      <View style={styles.cardAdicionar}>
        {!exameSelecionado ? (
          <>
            <Text style={styles.icone}>📄</Text>

            <Text style={styles.textoAdicionar}>Adicione um exame em PDF</Text>

            <Text style={styles.descricao}>
              o exame poderá enviado posteriomente para analise.
            </Text>

            {/* BOTAO DE SELECIONAR O EXAME*/}
            <TouchableOpacity
              style={styles.botaoSelecionar}
              onPress={selecionarExame}
            >
              <Text style={styles.textoBotao}>Selecionar Exame</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.icone}>📄</Text>
            <Text style={styles.nomeExame}>{exameSelecionado.nome}</Text>

            <Text style={styles.info}>Novo exame selecionado</Text>

            <View style={styles.botoes}>
              {/* BOTAO DE VISUALIZAR O EXAME*/}
              <TouchableOpacity
                style={styles.botaoVisualizar}
                onPress={() => {
                  visualizarExameSelecionado();
                }}
              >
                <Text style={styles.textoBotao}>Visualizar</Text>
              </TouchableOpacity>

              {/* BOTAO DE TROCAR O EXAME SELECIONADO*/}
              <TouchableOpacity
                style={styles.botaoTrocar}
                onPress={trocarExame}
              >
                <Text style={styles.textoBotao}>Trocar Exame</Text>
              </TouchableOpacity>

              {/* BOTAO DE ANALISAR O EXAME*/}
              <TouchableOpacity
                style={styles.botaoAnalise}
                onPress={analisarExame}
              >
                <Text style={styles.textoBotao}>analisar exame</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
{
  /* AREA ONDE O CODIGO É RESPONSAVEL POR DEFINIR DIMENSOES E ESTETICA DOS BOTOES*/
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  content: {
    padding: 20,
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

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 20,
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  nomeExame: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },

  info: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },

  data: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 14,
  },

  botoes: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  botaoVisualizar: {
    backgroundColor: "#6B7280",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  botaoAnalise: {
    backgroundColor: "#2562EB",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  botaoTrocar: {
    backgroundColor: "#6B7280",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  cardAdicionar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
  },

  icone: {
    fontSize: 40,
    marginBottom: 12,
  },

  textoAdicionar: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 6,
  },

  descricao: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 18,
  },

  botaoSelecionar: {
    backgroundColor: "#2562EB",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
});
