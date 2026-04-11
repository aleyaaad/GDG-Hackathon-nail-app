import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { router } from "expo-router";

interface PortfolioImage {
  id: string;
  imageUri: string;
  caption: string;
  ownerUid: string;
  createdAt: any;
}

export default function PortfolioScreen() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [caption, setCaption] = useState<string>("");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const imagesRef = collection(db, "portfolioImages");
    const unsubscribe = onSnapshot(
      imagesRef,
      (snapshot) => {
        const loadedImages = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as PortfolioImage))
          .filter((img) => img.ownerUid === currentUser.uid);
        setImages(loadedImages);
        setLoading(false);
      },
      (error) => {
        console.log("Error loading portfolio images:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image first.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user logged in.");
      return;
    }

    try {
      setUploading(true);

      await addDoc(collection(db, "portfolioImages"), {
        imageUri: selectedImage,
        caption: caption.trim(),
        ownerUid: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setSelectedImage("");
      setCaption("");
      Alert.alert("Success", "Image added to portfolio!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "portfolioImages", imageId));
              Alert.alert("Success", "Image deleted.");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      <Text style={styles.subtitle}>Add your nail work photos to showcase to clients</Text>

      <View style={styles.uploadSection}>
        <TouchableOpacity style={styles.pickButton} onPress={handlePickImage}>
          <Text style={styles.pickButtonText}>Pick Image</Text>
        </TouchableOpacity>

        {selectedImage && (
          <>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption (optional)"
              value={caption}
              onChangeText={setCaption}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              <Text style={styles.uploadButtonText}>
                {uploading ? "Uploading..." : "Upload Image"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>Your Portfolio</Text>
      {images.length === 0 ? (
        <Text style={styles.emptyText}>No images yet. Add your first portfolio image!</Text>
      ) : (
        <FlatList
          data={images}
          renderItem={({ item }) => (
            <View style={styles.imageCard}>
              <Image source={{ uri: item.imageUri }} style={styles.portfolioImage} />
              {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteImage(item.id)}
              >
                <Text style={styles.deleteButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}

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
  uploadSection: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  pickButton: {
    backgroundColor: "#3498db",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  pickButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#333",
  },
  uploadButton: {
    backgroundColor: "#27ae60",
    padding: 14,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 24,
  },
  imageCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  portfolioImage: {
    width: "100%",
    height: 250,
  },
  caption: {
    fontSize: 14,
    padding: 12,
    color: "#555",
    fontStyle: "italic",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: 10,
    margin: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  backText: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "500",
    marginTop: 16,
  },
});
