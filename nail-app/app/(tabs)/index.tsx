import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/firebaseConfig";
import { router } from "expo-router";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

// 🔥 Gemini test import
import { testGeminiConnection } from "../../gemini/geminiClient";

export default function HomeScreen() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

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

  // 🔥 Gemini test function
  const handleTestGemini = async () => {
    try {
      const result = await testGeminiConnection();
      console.log("Gemini test result:", result);
alert(result);    
} catch (error) {
      console.log("Gemini test error:", error);
      alert("Gemini test failed");
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoadingProfiles(false);
      return;
    }

    const profilesRef = collection(db, "profiles");
    const q = query(profilesRef, where("ownerUid", "==", currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedProfiles = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProfiles(loadedProfiles);
        setLoadingProfiles(false);
      },
      (error) => {
        console.log("Error listening to profiles:", error);
        setLoadingProfiles(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nail Sizing App 💅</Text>
      <Text style={styles.subtitle}>
        Get accurate nail measurements and compare them with brand sizing charts.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProfile}>
        <Text style={styles.primaryButtonText}>Create Your Measurements</Text>
      </TouchableOpacity>

      {/* 🔥 Gemini test button */}
      <TouchableOpacity style={styles.primaryButton} onPress={handleTestGemini}>
        <Text style={styles.primaryButtonText}>Test Gemini</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Saved Profiles</Text>

        {loadingProfiles ? (
          <ActivityIndicator size="small" color="#111" />
        ) : profiles.length === 0 ? (
          <Text style={styles.emptyText}>No profiles yet.</Text>
        ) : (
          profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={styles.profileCard}
              onPress={() =>
                router.push({
                  pathname: "/profile-details",
                  params: { profileId: profile.id },
                })
              }
            >
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileSubtext}>Profile ID: {profile.id}</Text>
            </TouchableOpacity>
          ))
        )}
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
    marginBottom: 20,
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
  emptyText: {
    color: "#777",
    fontStyle: "italic",
  },
  profileCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileSubtext: {
    fontSize: 12,
    color: "#666",
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