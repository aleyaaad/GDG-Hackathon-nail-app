import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useLocalSearchParams, router } from "expo-router";
import { extractMeasurementsFromImage } from "../gemini/geminiClient";

export default function MeasurementsScreen() {
  const { profileId } = useLocalSearchParams();

  const [thumbMm, setThumbMm] = useState("");
  const [indexMm, setIndexMm] = useState("");
  const [middleMm, setMiddleMm] = useState("");
  const [ringMm, setRingMm] = useState("");
  const [pinkyMm, setPinkyMm] = useState("");

  const [imageUri, setImageUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageUri) {
      Alert.alert("No image", "Please select an image first.");
      return;
    }

    try {
      setAnalyzing(true);

      const result = await extractMeasurementsFromImage(imageUri);

      setThumbMm(String(result.thumbMm ?? ""));
      setIndexMm(String(result.indexMm ?? ""));
      setMiddleMm(String(result.middleMm ?? ""));
      setRingMm(String(result.ringMm ?? ""));
      setPinkyMm(String(result.pinkyMm ?? ""));

      Alert.alert("Success", "Measurements auto-filled from image.");
    } catch (error: any) {
      console.log("Gemini image analysis error:", error);
      Alert.alert(
        "Analysis failed",
        error?.message || "Could not analyze image."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveMeasurements = async () => {
    if (
      !thumbMm.trim() ||
      !indexMm.trim() ||
      !middleMm.trim() ||
      !ringMm.trim() ||
      !pinkyMm.trim()
    ) {
      Alert.alert("Missing info", "Please fill in all measurement fields.");
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("Error", "No logged in user found.");
      return;
    }

    if (!profileId || typeof profileId !== "string") {
      Alert.alert("Error", "Invalid profile ID.");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "measurements"), {
        ownerUid: currentUser.uid,
        profileId: profileId,
        imageUri: imageUri || null,
        thumbMm: Number(thumbMm),
        indexMm: Number(indexMm),
        middleMm: Number(middleMm),
        ringMm: Number(ringMm),
        pinkyMm: Number(pinkyMm),
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Measurements saved successfully.");

      router.replace({
        pathname: "/profile-details",
        params: { profileId },
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Measurements</Text>
      <Text style={styles.subtitle}>
        Upload an image and let Gemini estimate the nail widths, or edit them
        manually.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handlePickImage}>
        <Text style={styles.buttonText}>Choose Image</Text>
      </TouchableOpacity>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      ) : null}

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={handleAnalyzeImage}
        disabled={analyzing}
      >
        <Text style={styles.buttonText}>
          {analyzing ? "Analyzing..." : "Analyze with Gemini"}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Thumb (mm)"
        value={thumbMm}
        onChangeText={setThumbMm}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Index (mm)"
        value={indexMm}
        onChangeText={setIndexMm}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Middle (mm)"
        value={middleMm}
        onChangeText={setMiddleMm}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Ring (mm)"
        value={ringMm}
        onChangeText={setRingMm}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Pinky (mm)"
        value={pinkyMm}
        onChangeText={setPinkyMm}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveMeasurements}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Saving..." : "Save Measurements"}
        </Text>
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 10,
    marginBottom: 14,
  },
  secondaryButton: {
    backgroundColor: "#444",
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
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: "cover",
  },
});