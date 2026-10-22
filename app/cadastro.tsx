// ==============================================================================
// TELA DE CADASTRO DE USUÁRIOS - WESHDIET
// ==============================================================================
// Esta tela permite que novos usuários se cadastrem no sistema, escolhendo
// obrigatoriamente o seu papel: 'Paciente' ou 'Nutricionista'.
// Salva o token de acesso e direciona imediatamente para a área apropriada.
// ==============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// CONFIGURAÇÃO DA URL BASE DA API DO BACKEND
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.0.23:8000";

export default function CadastroScreen() {
  const router = useRouter();

  // ESTADOS DOS CAMPOS DO FORMULÁRIO
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<"paciente" | "nutricionista">("paciente");
  const [crn, setCrn] = useState("");
  const [carregando, setCarregando] = useState(false);

  // FUNÇÃO DE VALIDAÇÃO E ENVIO DO CADASTRO
  const handleCadastro = async () => {
    if (!nome.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, digite seu nome completo.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, digite seu e-mail.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Senha curta", "A senha deve conter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Senhas divergentes", "A confirmação de senha não confere.");
      return;
    }
    if (tipoUsuario === "nutricionista" && !crn.trim()) {
      Alert.alert(
        "CRN obrigatório",
        "Nutricionistas devem informar o registro no CRN para liberação profissional."
      );
      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch(`${API_BASE_URL}/auth/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha: senha,
          tipo_usuario: tipoUsuario,
          crn: tipoUsuario === "nutricionista" ? crn.trim() : null,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.detail || "Não foi possível realizar o cadastro.");
      }

      // PERSISTÊNCIA DA SESSÃO LOCAL (TOKEN E PERFIL DO USUÁRIO)
      await AsyncStorage.setItem("@weshdiet:token", dados.token);
      await AsyncStorage.setItem("@weshdiet:usuario", JSON.stringify(dados.usuario));

      Alert.alert("Bem-vindo!", dados.mensagem);

      // DIRECIONAMENTO CONFORME O PAPEL ESCOLHIDO
      if (dados.usuario.tipo_usuario === "paciente") {
        router.replace("/home");
      } else {
        router.replace("/(tabs)/Pacientes");
      }
    } catch (erro) {
      console.error("Erro no cadastro:", erro);
      Alert.alert(
        "Falha no Cadastro",
        erro instanceof Error ? erro.message : "Ocorreu um erro ao cadastrar."
      );
    } finally {
      setCarregando(false);
    }
  };

  // AUTENTICAÇÃO COM GOOGLE (OPCIONAL)
  const handleGoogleAuth = () => {
    Alert.alert(
      "Autenticação com Google",
      "O login e cadastro com Google estão disponíveis como opção adicional. Em ambiente de homologação, utilize as credenciais configuradas."
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Junte-se ao WeshDiet para acompanhamento nutricional inteligente</Text>

      {/* SELEÇÃO OBRIGATÓRIA DO PAPEL (PACIENTE OU NUTRICIONISTA) */}
      <Text style={styles.labelSecao}>Selecione o seu perfil:</Text>
      <View style={styles.containerPapeis}>
        {/* BOTÃO DO PAPEL: PACIENTE */}
        <TouchableOpacity
          style={[
            styles.botaoPapel,
            tipoUsuario === "paciente" && styles.botaoPapelSelecionado,
          ]}
          onPress={() => setTipoUsuario("paciente")}
        >
          <Text style={styles.iconePapel}>👤</Text>
          <Text
            style={[
              styles.textoPapel,
              tipoUsuario === "paciente" && styles.textoPapelSelecionado,
            ]}
          >
            Paciente
          </Text>
          <Text style={styles.descricaoPapel}>
            Acesse seus planos, envie exames e acompanhe sua evolução
          </Text>
        </TouchableOpacity>

        {/* BOTÃO DO PAPEL: NUTRICIONISTA */}
        <TouchableOpacity
          style={[
            styles.botaoPapel,
            tipoUsuario === "nutricionista" && styles.botaoPapelSelecionado,
          ]}
          onPress={() => setTipoUsuario("nutricionista")}
        >
          <Text style={styles.iconePapel}>🩺</Text>
          <Text
            style={[
              styles.textoPapel,
              tipoUsuario === "nutricionista" && styles.textoPapelSelecionado,
            ]}
          >
            Nutricionista
          </Text>
          <Text style={styles.descricaoPapel}>
            Gerencie pacientes, avalie exames e construa planos clínicos
          </Text>
        </TouchableOpacity>
      </View>

      {/* FORMULÁRIO DE DADOS PESSOAIS */}
      <Text style={styles.label}>Nome Completo:</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite seu nome completo"
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>E-mail:</Text>
      <TextInput
        style={styles.input}
        placeholder="exemplo@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* CAMPO DE CRN EXIBIDO APENAS SE FOR NUTRICIONISTA */}
      {tipoUsuario === "nutricionista" && (
        <View>
          <Text style={styles.label}>Número do CRN (com região):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: CRN-3 12345/P"
            value={crn}
            onChangeText={setCrn}
          />
        </View>
      )}

      <Text style={styles.label}>Senha:</Text>
      <TextInput
        style={styles.input}
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <Text style={styles.label}>Confirmar Senha:</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite a senha novamente"
        secureTextEntry
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
      />

      {/* BOTÃO DE CONFIRMAÇÃO DO CADASTRO */}
      <TouchableOpacity
        style={styles.botaoPrincipal}
        onPress={handleCadastro}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBotaoPrincipal}>Cadastrar como {tipoUsuario === "paciente" ? "Paciente" : "Nutricionista"}</Text>
        )}
      </TouchableOpacity>

      {/* SEPARADOR PARA AUTENTICAÇÃO ALTERNATIVA */}
      <View style={styles.divisorContainer}>
        <View style={styles.linhaDivisoria} />
        <Text style={styles.textoDivisor}>ou continue com</Text>
        <View style={styles.linhaDivisoria} />
      </View>

      {/* BOTÃO ALTERNATIVO DO GOOGLE */}
      <TouchableOpacity style={styles.botaoGoogle} onPress={handleGoogleAuth}>
        <Text style={styles.textoGoogle}>Cadastrar com Google</Text>
      </TouchableOpacity>

      {/* LINK DE RETORNO AO LOGIN */}
      <View style={styles.containerLogin}>
        <Text style={styles.textoJaTemConta}>Já possui uma conta?</Text>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.linkEntrar}> Entrar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ------------------------------------------------------------------------------
// ESTILOS VISUAIS DA TELA DE CADASTRO
// ------------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 20,
  },
  labelSecao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
  },
  containerPapeis: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  botaoPapel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  botaoPapelSelecionado: {
    borderColor: "#2562EB",
    backgroundColor: "#EFF6FF",
  },
  iconePapel: {
    fontSize: 28,
    marginBottom: 6,
  },
  textoPapel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 4,
  },
  textoPapelSelecionado: {
    color: "#2562EB",
  },
  descricaoPapel: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  botaoPrincipal: {
    backgroundColor: "#2562EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  textoBotaoPrincipal: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  divisorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  linhaDivisoria: {
    flex: 1,
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  textoDivisor: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#6B7280",
  },
  botaoGoogle: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  textoGoogle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  containerLogin: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  textoJaTemConta: {
    fontSize: 14,
    color: "#4B5563",
  },
  linkEntrar: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2562EB",
  },
});
