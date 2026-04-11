// nail brands management page - allows users to create and manage their personal nail tip brand library
// users can add nail brands with multiple tip sizes for each brand
// brands are referenced in measurements page and profile-details page to help compare measurements

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
  FlatList,
} from "react-native";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { router } from "expo-router";

// interface for nail tip sizes within a brand
interface TipSize {
  label: string;
  sizeMm: string;
}

// interface for complete brand with all its tip sizes
interface Brand {
  id: string;
  name: string;
  tipSizes: TipSize[];
  ownerUid: string;
  createdAt: any;
}

// main nail brands management screen
export default function NailBrandsScreen() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newTipSizes, setNewTipSizes] = useState<TipSize[]>([{ label: "", sizeMm: "" }]);

  // load user's brands from firestore on component mount
  // subscribes to real-time updates so changes are instantly reflected
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const brandsRef = collection(db, "brands");
    const unsubscribe = onSnapshot(
      brandsRef,
      (snapshot) => {
        const loadedBrands = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Brand))
          .filter((brand) => brand.ownerUid === currentUser.uid);
        setBrands(loadedBrands);
        setLoading(false);
      },
      (error) => {
        console.log("Error loading brands:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // adds a new empty tip size row to the form so user can enter more sizes for this brand
  }, []);

  const handleAddTipSize = () => {
    setNewTipSizes([...newTipSizes, { label: "", sizeMm: "" }]);
  };
// updates a specific tip size field (label or millimeter value) at the given index
  // accepts the array index, field name (label or sizeMm), and new value
  
  const handleUpdateTipSize = (index: number, field: keyof TipSize, value: string) => {
    const updated = [...newTipSizes];
    updated[index][field] = value;
  // removes a tip size row from the form at the given index (only if more than one row remains)
    setNewTipSizes(updated);
  };

  const handleRemoveTipSize = (index: number) => {
    if (newTipSizes.length > 1) {
      setNewTipSizes(newTipSizes.filter((_, i) => i !== index));
  // validates and saves new brand to firestore with all entered tip sizes
  // clears form and closes add brand modal after successful save
    }
  };

  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) {
      Alert.alert("Error", "Please enter a brand name.");
      return;
    }

    const validTipSizes = newTipSizes.filter(ts => ts.label.trim() && ts.sizeMm.trim());
    if (validTipSizes.length === 0) {
      Alert.alert("Error", "Please add at least one tip size.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user logged in.");
      return;
    }

    try {
      await addDoc(collection(db, "brands"), {
        name: newBrandName.trim(),
        tipSizes: validTipSizes,
        ownerUid: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setNewBrandName("");
      setNewTipSizes([{ label: "", sizeMm: "" }]);
      setAddingBrand(false);
      Alert.alert("Success", "Brand saved successfully!");
  // prompts user for confirmation and then deletes brand from firestore database
  // once deleted, brand will no longer appear in measurements or profile reference sections
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    Alert.alert(
      "Delete Brand",
      "Are you sure you want to delete this brand?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "brands", brandId));
              Alert.alert("Success", "Brand deleted.");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const renderBrand = ({ item }: { item: Brand }) => (
    <View style={styles.brandCard}>
      <Text style={styles.brandName}>{item.name}</Text>
      <Text style={styles.tipSizesTitle}>Tip Sizes:</Text>
      {item.tipSizes.map((tip, index) => (
        <Text key={index} style={styles.tipSizeText}>
          {tip.label}: {tip.sizeMm}mm
        </Text>
      ))}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteBrand(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete Brand</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nail Brands</Text>
      <Text style={styles.subtitle}>Manage your nail tip brands and sizes</Text>

      {!addingBrand ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setAddingBrand(true)}>
          <Text style={styles.addButtonText}>Add New Brand</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addBrandForm}>
          <TextInput
            style={styles.input}
            placeholder="Brand Name"
            value={newBrandName}
            onChangeText={setNewBrandName}
          />

          <Text style={styles.sectionTitle}>Tip Sizes</Text>
          {newTipSizes.map((tipSize, index) => (
            <View key={index} style={styles.tipSizeRow}>
              <TextInput
                style={[styles.input, styles.tipInput]}
                placeholder="Label (e.g., 0, 1, 2)"
                value={tipSize.label}
                onChangeText={(value) => handleUpdateTipSize(index, "label", value)}
              />
              <TextInput
                style={[styles.input, styles.tipInput]}
                placeholder="Size (mm)"
                value={tipSize.sizeMm}
                onChangeText={(value) => handleUpdateTipSize(index, "sizeMm", value)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveTipSize(index)}
                disabled={newTipSizes.length === 1}
              >
                <Text style={[styles.removeButtonText, newTipSizes.length === 1 && styles.disabledText]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addTipButton} onPress={handleAddTipSize}>
            <Text style={styles.addTipButtonText}>Add Tip Size</Text>
          </TouchableOpacity>

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setAddingBrand(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveBrand}>
              <Text style={styles.saveButtonText}>Save Brand</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Your Brands</Text>
      {brands.length === 0 ? (
        <Text style={styles.emptyText}>No brands added yet.</Text>
      ) : (
        <FlatList
          data={brands}
          renderItem={renderBrand}
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
  addButton: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
  },
  addButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  addBrandForm: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  tipSizeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tipInput: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: "#e74c3c",
    fontWeight: "500",
  },
  disabledText: {
    color: "#ccc",
  },
  addTipButton: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addTipButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#27ae60",
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  brandCard: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  tipSizesTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  tipSizeText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  deleteButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    fontStyle: "italic",
  },
  backText: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "500",
    marginTop: 16,
  },
});