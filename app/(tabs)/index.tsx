//IMPORTAÇÕES NECESSÁRIAS PARA O FUNCIONAMENTO DA TELA INICIAL DO APLICATIVO, ONDE O USUÁRIO PODE INICIAR O PROCESSO DE LOGIN.
import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  //COMPONENTE PRINCIPAL DA TELA INICIAL DO APLICATIVO, ONDE O USUÁRIO PODE INICIAR O PROCESSO DE LOGIN.
  const router = useRouter();

  return (
    //PARAMETRO UTILIZADO PARA CRIAR A TELA INICIAL DO APLICATIVO, ONDE O USUÁRIO PODE INICIAR O PROCESSO DE LOGIN.
    <View style={styles.container}>
      <Text style={styles.title}>Wesh Diet</Text>
      <Text style={styles.subtitle}>
        Seu acompanhamento nutricional inteligente
      </Text>

      <Button //PARAMETRO UTILIZADO PARA CRIAR O BOTÃO DE INÍCIO, ONDE O USUÁRIO PODE INICIAR O PROCESSO DE LOGIN.
        title="Começar"
        onPress={() => {
          router.push("/login");
        }}
      />
    </View>
  );
}
//PARAMETRO UTILIZADO PARA CRIAR OS ESTILOS DA TELA INICIAL DO APLICATIVO, ONDE O USUÁRIO PODE INICIAR O PROCESSO DE LOGIN.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  title: {
    fontSize: 40,
    fontWeight: "bold",
  },

  subtitle: {
    //PARAMETRO UTILIZADO PARA CRIAR O SUBTÍTULO DA TELA INICIAL DO APLICATIVO, ONDE O USUÁRIO PODE INICIAR O PROCESSO DE LOGIN.
    fontSize: 16, //ESSA LINHA DEFINE O TAMANHO DA FONTE DO SUBTÍTULO.
    marginTop: 10, //ESSA LINHA DEFINE A MARGEM SUPERIOR DO SUBTÍTULO.
    textAlign: "center", //ESSA LINHA DEFINE O ALINHAMENTO DO TEXTO DO SUBTÍTULO.
  },
});
