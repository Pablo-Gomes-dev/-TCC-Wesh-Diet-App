// ==============================================================================
// TELA DE PAINEL INICIAL (HOME) - WESHDIET
// ==============================================================================
// Esta tela exibe a visão personalizada de acordo com o papel do usuário:
// - Para Paciente: Acesso aos seus exames, plano alimentar e assistente de IA.
// - Para Nutricionista: Painel de gestão clínica, pacientes ativos e check-ins.
// Possui também o botão de logout seguro que limpa a sessão local.
// ==============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<{
    id: number;
    nome: string;
    email: string;
    tipo_usuario: "paciente" | "nutricionista";
    crn?: string;
  } | null>(null);

  // RECUPERA O USUÁRIO AUTENTICADO DO ARMAZENAMENTO LOCAL
  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const dadosArmazenados = await AsyncStorage.getItem("@weshdiet:usuario");
        if (dadosArmazenados) {
          setUsuario(JSON.parse(dadosArmazenados));
        }
      } catch (e) {
        console.error("Erro ao carregar sessão local:", e);
      }
    };
    carregarUsuario();
  }, []);

  // ENCERRAMENTO SEGURO DA SESSÃO (LOGOUT)
  const handleLogout = async () => {
    Alert.alert("Sair da Conta", "Deseja realmente encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("@weshdiet:token");
          await AsyncStorage.removeItem("@weshdiet:usuario");
          router.replace("/login");
        },
      },
    ]);
  };

  const isNutricionista = usuario?.tipo_usuario === "nutricionista";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* CABEÇALHO COM BOAS-VINDAS E BOTÃO DE SAÍDA */}
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.saudacao}>Olá, {usuario ? usuario.nome : "Usuário"}</Text>
          <View style={styles.badgePapel}>
            <Text style={styles.textoBadge}>
              Perfil: {isNutricionista ? "🩺 Nutricionista" : "👤 Paciente"}
            </Text>
            {isNutricionista && usuario?.crn && (
              <Text style={styles.textoCrn}> | {usuario.crn}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
          <Text style={styles.textoBotaoSair}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* =====================================================================
          1. VISÃO ESPECÍFICA DO NUTRICIONISTA
          ===================================================================== */}
      {isNutricionista ? (
        <View>
          <Text style={styles.sectionTitle}>Painel Clínico</Text>

          <View style={styles.gridResumo}>
            <View style={styles.cardResumo}>
              <Text style={styles.cardTitle}>Pacientes Ativos</Text>
              <Text style={styles.cardNumber}>24</Text>
            </View>

            <View style={styles.cardResumo}>
              <Text style={styles.cardTitle}>Check-ins</Text>
              <Text style={styles.cardNumber}>5</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Gestão de Pacientes</Text>

          <Pressable
            style={styles.cardAcao}
            onPress={() => router.push("/(tabs)/Pacientes")}
          >
            <Text style={styles.iconeAcao}>👥</Text>
            <View style={styles.infoAcao}>
              <Text style={styles.tituloAcao}>Meus Pacientes</Text>
              <Text style={styles.subtituloAcao}>
                Acessar prontuários, planos e exames laboratoriais vinculados.
              </Text>
            </View>
          </Pressable>
        </View>
      ) : (
        /* =====================================================================
            2. VISÃO ESPECÍFICA DO PACIENTE
            ===================================================================== */
        <View>
          <Text style={styles.sectionTitle}>Meu Espaço Nutricional</Text>

          {/* CARD: ENVIAR EXAMES */}
          <Pressable
            style={styles.cardAcao}
            onPress={() => router.push("/(tabs)/Pacientes/Exames")}
          >
            <Text style={styles.iconeAcao}>📄</Text>
            <View style={styles.infoAcao}>
              <Text style={styles.tituloAcao}>Meus Exames Laboratoriais</Text>
              <Text style={styles.subtituloAcao}>
                Envie documentos em PDF e acompanhe a extração de dados.
              </Text>
            </View>
          </Pressable>

          {/* CARD: DETALHES DO PACIENTE */}
          <Pressable
            style={styles.cardAcao}
            onPress={() => router.push("/(tabs)/Pacientes/Detalhes_do_paciente")}
          >
            <Text style={styles.iconeAcao}>⚖️</Text>
            <View style={styles.infoAcao}>
              <Text style={styles.tituloAcao}>Meus Dados & IMC</Text>
              <Text style={styles.subtituloAcao}>
                Consulte suas medidas, objetivos e restrições alimentares.
              </Text>
            </View>
          </Pressable>

          {/* CARD: ASSISTENTE DE IA */}
          <Pressable
            style={styles.cardAcao}
            onPress={() => router.push("/(tabs)/Pacientes/Analise_IA")}
          >
            <Text style={styles.iconeAcao}>🤖</Text>
            <View style={styles.infoAcao}>
              <Text style={styles.tituloAcao}>Assistente IA WeshDiet</Text>
              <Text style={styles.subtituloAcao}>
                Tire dúvidas e visualize orientações nutricionais personalizadas.
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

// ------------------------------------------------------------------------------
// ESTILOS VISUAIS DA TELA HOME
// ------------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  saudacao: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  badgePapel: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  textoBadge: {
    fontSize: 13,
    color: "#2562EB",
    fontWeight: "600",
  },
  textoCrn: {
    fontSize: 12,
    color: "#6B7280",
  },
  botaoSair: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  textoBotaoSair: {
    color: "#DC2626",
    fontWeight: "bold",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 10,
    marginBottom: 12,
  },
  gridResumo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  cardResumo: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  cardNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2562EB",
    marginTop: 6,
  },
  cardAcao: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    elevation: 1,
  },
  iconeAcao: {
    fontSize: 32,
    marginRight: 14,
  },
  infoAcao: {
    flex: 1,
  },
  tituloAcao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  subtituloAcao: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
});
