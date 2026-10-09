//IMPORTAÇÃO DE BIBLIOTECAS E COMPONENTES NECESSÁRIOS PARA A TELA DE PACIENTES, ONDE O USUÁRIO PODE GERENCIAR SUAS INFORMAÇÕES E RECURSOS DO PACIENTE.
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export default function PacientesScreen() {
  //COMPONENTE PRINCIPAL DA TELA DE PACIENTES, ONDE O USUÁRIO PODE GERENCIAR SUAS INFORMAÇÕES E RECURSOS DO PACIENTE.
  const router = useRouter();

  return (
    //PARAMETRO UTILIZADO PARA CRIAR A TELA DE PACIENTES, ONDE O USUÁRIO PODE GERENCIAR SUAS INFORMAÇÕES E RECURSOS DO PACIENTE.
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => router.back()}
      >
        <Text style={styles.textoVoltar}>⬅ Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Pacientes</Text>
      <Text style={styles.subtitle}>
        Gerencie suas informações e recursos do paciente.
      </Text>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE ANÁLISE COM IA, ONDE O USUÁRIO PODE ACESSAR A TELA DE ANÁLISE COM IA.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Analise_IA")}
      >
        <Text style={styles.ButtonText}>Análise com IA.</Text>
      </Pressable>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE CHECK-INS, ONDE O USUÁRIO PODE ACESSAR A TELA DE CHECK-INS.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Check-ins")}
      >
        <Text style={styles.ButtonText}>Check-ins.</Text>
      </Pressable>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE DETALHES DO PACIENTE, ONDE O USUÁRIO PODE ACESSAR A TELA DE DETALHES DO PACIENTE.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Detalhes_do_paciente")}
      >
        <Text style={styles.ButtonText}>Detalhes do paciente.</Text>
      </Pressable>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE EDITAR PLANO, ONDE O USUÁRIO PODE ACESSAR A TELA DE EDITAR PLANO.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Editar_plano")}
      >
        <Text style={styles.ButtonText}>Editar Plano.</Text>
      </Pressable>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE EVOLUÇÃO, ONDE O USUÁRIO PODE ACESSAR A TELA DE EVOLUÇÃO.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Evolucao")}
      >
        <Text style={styles.ButtonText}>Evolução.</Text>
      </Pressable>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE EXAMES, ONDE O USUÁRIO PODE ACESSAR A TELA DE EXAMES.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Exames")}
      >
        <Text style={styles.ButtonText}>Exames.</Text>
      </Pressable>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE PLANO ALIMENTAR, ONDE O USUÁRIO PODE ACESSAR A TELA DE PLANO ALIMENTAR.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Plano_alimentar")}
      >
        <Text style={styles.ButtonText}>Plano alimentar.</Text>
      </Pressable>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE RELATÓRIOS, ONDE O USUÁRIO PODE ACESSAR A TELA DE RELATÓRIOS.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Relatorio")}
      >
        <Text style={styles.ButtonText}>Relatórios.</Text>
      </Pressable>

      <Pressable //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE SUBSTITUIÇÃO, ONDE O USUÁRIO PODE ACESSAR A TELA DE SUBSTITUIÇÃO.
        style={styles.Button}
        onPress={() => router.push("/Pacientes/Substituicao")}
      >
        <Text style={styles.ButtonText}>Substituição.</Text>
      </Pressable>
    </ScrollView>
  );
}
//PARAMETRO UTILIZADO PARA CRIAR OS ESTILOS DA TELA DE PACIENTES, ONDE O USUÁRIO PODE GERENCIAR SUAS INFORMAÇÕES E RECURSOS DO PACIENTE.
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  Button: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  ButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
