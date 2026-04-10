import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { router } from "expo-router";

export default function HomeScreen() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleCreateProfile = () => {
    router.push("/profile");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nail Sizing App 💅</Text>
      <Text style={styles.subtitle}>
        Get accurate nail measurements and compare them with brand sizing charts.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProfile}>
        <Text style={styles.primaryButtonText}>Create Your Measurements</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed Nail Clients</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Carousel / photo showcase will go here
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>
            Review carousel will go here
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  primaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  placeholderBox: {
    height: 140,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  placeholderText: {
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 40,
  },
  logoutText: {
    textAlign: "center",
    color: "red",
    fontWeight: "500",
  },
});