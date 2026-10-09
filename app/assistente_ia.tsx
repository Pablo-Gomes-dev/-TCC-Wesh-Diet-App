import { StyleSheet, Text, View } from "react-native";

export default function assistente_IAScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assistente IA</Text>

      <Text style={styles.subtitle}>
        Tire suas dúvidas com o nosso assistente de IA.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>troca de alimentação.</Text>
        <Text style={styles.cardText}>
          troca de alimentação recomendada pelo seu plano.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>duvida sobre o plano</Text>
        <Text style={styles.cardText}>
          Faca sua pergunta sobre o plano alimentar e receba uma resposta do
          assistente IA.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sugestão de alimentos</Text>
        <Text style={styles.cardText}>
          Sugestão de alimentos recomendados pelo assistente IA.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 30,
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
    fontSize: 20,
    marginTop: 8,
  },

  cardText: {
    fontSize: 15,
    marginTop: 8,
  },
});
