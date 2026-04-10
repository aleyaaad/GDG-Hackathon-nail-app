import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useLocalSearchParams, router } from "expo-router";

export default function ProfileDetailsScreen() {
  const { profileId } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileDetails = async () => {
    if (!profileId || typeof profileId !== "string") {
      setLoading(false);
      return;
    }

    try {
      const profileRef = doc(db, "profiles", profileId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setProfile({
          id: profileSnap.id,
          ...profileSnap.data(),
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.log("Error fetching profile details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [profileId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Profile not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Details</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Profile Name</Text>
        <Text style={styles.value}>{profile.name}</Text>

        <Text style={styles.label}>Profile ID</Text>
        <Text style={styles.value}>{profile.id}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/measurements",
            params: { profileId: profile.id },
          })
        }
      >
        <Text style={styles.buttonText}>Add Measurements</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 18,
    backgroundColor: "#fafafa",
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: "#777",
    marginBottom: 4,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 10,
    marginBottom: 18,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  backText: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
    color: "red",
  },
});