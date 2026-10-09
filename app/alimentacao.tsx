import { StyleSheet, Text, View } from "react-native";

export default function alimentacaoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plano alimentar</Text>

      <Text style={styles.subtitle}>Seu plano alimentar aparecerá aqui.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Café da manhã</Text>
        <Text style={styles.cardText}>
          Refeição recomendada pelo seu plano.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Almoço</Text>
        <Text style={styles.cardText}>
          Refeição recomendada pelo seu plano.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Jantar</Text>
        <Text style={styles.cardText}>
          Refeição recomendada pelo seu plano.
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
