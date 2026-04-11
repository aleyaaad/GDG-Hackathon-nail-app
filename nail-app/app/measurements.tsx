// measurements page - allows users to take nail measurements for left or right hand using ai image analysis or manual input
// users can pick an image, use gemini ai to automatically extract measurements, and save them to firestore
// measurements are tagged with the profileid and which hand (left/right) they belong to

import React, { useState, useEffect } from "react";
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
import { addDoc, collection, serverTimestamp, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useLocalSearchParams, router } from "expo-router";
import { extractMeasurementsFromImage } from "../gemini/geminiClient";

// interface for nail tip sizes - contains the label (0, 1, 2 etc) and the width in millimeters
interface TipSize {
  label: string;
  sizeMm: string;
}

// interface for nail brands - contains the brand name and array of available tip sizes
interface Brand {
  id: string;
  name: string;
  tipSizes: TipSize[];
}

// main measurements screen component - handles all measurement input and ai analysis
export default function MeasurementsScreen() {
  const { profileId } = useLocalSearchParams();

  const [thumbMm, setThumbMm] = useState("");
  const [indexMm, setIndexMm] = useState("");
  const [middleMm, setMiddleMm] = useState("");
  const [ringMm, setRingMm] = useState("");
  const [pinkyMm, setPinkyMm] = useState("");
  const [handSide, setHandSide] = useState("left");
  const [brands, setBrands] = useState<Brand[]>([]);

  const [imageUri, setImageUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // load user's nail brands from firestore in real-time whenever the component mounts
  // this allows users to see reference brand sizes while entering measurements
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const brandsRef = collection(db, "brands");
    const q = query(brandsRef, where("ownerUid", "==", currentUser.uid));

    // subscribe to real-time updates of user's brands collection so reference section stays current
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedBrands = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Brand));
        setBrands(loadedBrands);
      },
      (error) => {
        console.log("Error loading brands:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // opens the device's image library to let user select a photo of their hand for nail analysis
  // user can crop and edit the image before confirming selection
  const handlePickImage = async () => {
    try {
      // launch image picker with editing enabled for cropping and quality set to 0.8 for faster processing
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

  // uses google gemini ai to analyze the selected hand image and extract nail measurements in millimeters
  // the ai model estimates the width of each nail bed by analyzing the photo using computer vision
  // automatically fills in the measurement input fields with the extracted values
  const handleAnalyzeImage = async () => {
    if (!imageUri) {
      Alert.alert("No image", "Please select an image first.");
      return;
    }

    try {
      setAnalyzing(true);

      // send image to gemini api for measurement extraction
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

  // saves all entered nail measurements to firestore database, tagged with profile id and hand side
  // validates that all five fingers have measurements before saving to prevent incomplete data
  // after successful save, navigates back to profile details page
  const handleSaveMeasurements = async () => {
    // check if all five fingers (thumb, index, middle, ring, pinky) have measurements entered
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

    // validate that we have a valid profile id from route parameters
    if (!profileId || typeof profileId !== "string") {
      Alert.alert("Error", "Invalid profile ID.");
      return;
    }

    try {
      setLoading(true);

      // create new measurement document in firestore with all data
      await addDoc(collection(db, "measurements"), {
        ownerUid: currentUser.uid,
        profileId: profileId,
        handSide: handSide,
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
    Choose a hand, upload an image, and let Gemini estimate nail widths.
  </Text>

  <View style={styles.handSelection}>
    <TouchableOpacity
      style={[styles.handButton, handSide === 'left' && styles.selectedHand]}
      onPress={() => setHandSide('left')}
    >
      <Text style={[styles.handButtonText, handSide === 'left' && styles.selectedHandText]}>Left Hand</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.handButton, handSide === 'right' && styles.selectedHand]}
      onPress={() => setHandSide('right')}
    >
      <Text style={[styles.handButtonText, handSide === 'right' && styles.selectedHandText]}>Right Hand</Text>
    </TouchableOpacity>
  </View>

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

      {brands.length > 0 && (
        <View style={styles.brandsSection}>
          <Text style={styles.brandsTitle}>Nail Brand Reference</Text>
          {brands.map((brand) => (
            <View key={brand.id} style={styles.brandCard}>
              <Text style={styles.brandName}>{brand.name}</Text>
              <View style={styles.tipSizesContainer}>
                {brand.tipSizes.map((tip, index) => (
                  <Text key={index} style={styles.tipSizeText}>
                    {tip.label}: {tip.sizeMm}mm
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

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
  handSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  handButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    flex: 1,
    marginHorizontal: 5,
  },
  selectedHand: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  handButtonText: {
    textAlign: 'center',
    color: '#555',
  },
  selectedHandText: {
    color: '#fff',
  },
  brandsSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
  },
  brandsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  brandCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  tipSizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tipSizeText: {
    fontSize: 14,
    color: '#555',
    marginRight: 12,
    marginBottom: 2,
  },
});