import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useLocalSearchParams, router } from "expo-router";

export default function ProfileDetailsScreen() {
  const { profileId } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId || typeof profileId !== "string") {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, "profiles", profileId));
        if (profileDoc.exists()) {
          setProfile({ id: profileDoc.id, ...profileDoc.data() });
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
      }
    };

    const measurementsRef = collection(db, "measurements");
    const q = query(measurementsRef, where("profileId", "==", profileId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMeasurements = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMeasurements(loadedMeasurements);
        setLoading(false);
      },
      (error) => {
        console.log("Error listening to measurements:", error);
        setLoading(false);
      }
    );

    fetchProfile();
    return () => unsubscribe();
  }, [profileId]);

  const leftMeasurements = measurements.filter(m => m.handSide === 'left');
  const rightMeasurements = measurements.filter(m => m.handSide === 'right');

  const renderMeasurements = (handMeasurements: any[], handName: string) => (
    <View style={styles.handSection}>
      <Text style={styles.handTitle}>{handName} Hand Measurements</Text>
      {handMeasurements.length === 0 ? (
        <Text style={styles.noMeasurements}>No measurements yet.</Text>
      ) : (
        handMeasurements.map((measurement) => (
          <View key={measurement.id} style={styles.measurementCard}>
            <Text style={styles.measurementText}>Thumb: {measurement.thumbMm} mm</Text>
            <Text style={styles.measurementText}>Index: {measurement.indexMm} mm</Text>
            <Text style={styles.measurementText}>Middle: {measurement.middleMm} mm</Text>
            <Text style={styles.measurementText}>Ring: {measurement.ringMm} mm</Text>
            <Text style={styles.measurementText}>Pinky: {measurement.pinkyMm} mm</Text>
            <Text style={styles.measurementDate}>
              Created: {measurement.createdAt?.toDate().toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{profile.name}</Text>
      <Text style={styles.subtitle}>Profile Details</Text>

      {renderMeasurements(leftMeasurements, "Left")}
      {renderMeasurements(rightMeasurements, "Right")}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({ pathname: "/measurements", params: { profileId } })}
      >
        <Text style={styles.buttonText}>Add New Measurements</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
  },
  handSection: {
    marginBottom: 20,
  },
  handTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  noMeasurements: {
    color: "#777",
    fontStyle: "italic",
  },
  measurementCard: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  measurementText: {
    fontSize: 16,
    marginBottom: 4,
  },
  measurementDate: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 10,
    marginBottom: 14,
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
    marginTop: 8,
  },
});