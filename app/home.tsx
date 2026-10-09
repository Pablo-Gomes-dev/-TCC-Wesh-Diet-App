import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Resumo</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pacientes ativos</Text>
        <Text style={styles.cardNumber}>24</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Check-ins pendentes</Text>
        <Text style={styles.cardNumber}>5</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consultas hoje</Text>
        <Text style={styles.cardNumber}>3</Text>
      </View>

      <Text style={styles.sectionTitle}>Acesso rápido</Text>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/(tabs)/Pacientes")}
      >
        <Text style={styles.cardTitle}>Pacientes</Text>
        <Text style={styles.cardText}>Visualizar seus pacientes.</Text>
      </Pressable>
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
    fontSize: 20,
    marginTop: 5,
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  card: {
    width: "100%",
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 15,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  cardNumber: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 8,
  },

  cardText: {
    fontSize: 15,
    marginTop: 8,
  },
});
