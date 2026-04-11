import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useLocalSearchParams, router } from "expo-router";

interface TipSize {
  label: string;
  sizeMm: string;
}

interface Brand {
  id: string;
  name: string;
  tipSizes: TipSize[];
}

export default function ProfileDetailsScreen() {
  const { profileId } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [appointmentDateString, setAppointmentDateString] = useState("");

  useEffect(() => {
    if (!profileId || typeof profileId !== "string") {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, "profiles", profileId));
        if (profileDoc.exists()) {
          const profileData: any = { id: profileDoc.id, ...profileDoc.data() };
          setProfile(profileData);
          setNotes(profileData.notes || "");
          if (profileData.appointmentDate) {
            const dateStr = typeof profileData.appointmentDate === "string" 
              ? profileData.appointmentDate 
              : profileData.appointmentDate.toDate?.().toISOString();
            if (dateStr) {
              setAppointmentDate(new Date(dateStr));
              setAppointmentDateString(dateStr.split("T")[0]); // Format as YYYY-MM-DD
            }
          }
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
      }
    };

    const measurementsRef = collection(db, "measurements");
    const q = query(measurementsRef, where("profileId", "==", profileId));

    const unsubscribeMeasurements = onSnapshot(
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

    const currentUser = auth.currentUser;
    let unsubscribeBrands: () => void = () => {};

    if (currentUser) {
      const brandsRef = collection(db, "brands");
      const brandsQuery = query(brandsRef, where("ownerUid", "==", currentUser.uid));

      unsubscribeBrands = onSnapshot(
        brandsQuery,
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
    }

    fetchProfile();
    return () => {
      unsubscribeMeasurements();
      unsubscribeBrands();
    };
  }, [profileId]);

  const leftMeasurements = measurements.filter(m => m.handSide === 'left');
  const rightMeasurements = measurements.filter(m => m.handSide === 'right');

  const handleSaveNotes = async () => {
    try {
      await updateDoc(doc(db, "profiles", profileId as string), {
        notes: notes,
        updatedAt: new Date(),
      });
      setEditingNotes(false);
    } catch (error) {
      console.log("Error saving notes:", error);
    }
  };

  const handleDateChange = async (dateString: string) => {
    if (!dateString.trim()) return;
    
    try {
      const newDate = new Date(dateString);
      if (isNaN(newDate.getTime())) {
        Alert.alert("Invalid date", "Please enter a valid date (YYYY-MM-DD or MM/DD/YYYY)");
        return;
      }
      
      setAppointmentDate(newDate);
      setAppointmentDateString(dateString);
      
      await updateDoc(doc(db, "profiles", profileId as string), {
        appointmentDate: newDate.toISOString(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.log("Error saving appointment date:", error);
      Alert.alert("Error", "Could not save appointment date");
    }
  };

  const handleClearAppointment = async () => {
    setAppointmentDate(null);
    try {
      await updateDoc(doc(db, "profiles", profileId as string), {
        appointmentDate: null,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.log("Error clearing appointment date:", error);
    }
  };

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

      <View style={styles.clientInfoSection}>
        <View style={styles.notesContainer}>
          <Text style={styles.sectionTitle}>Client Notes</Text>
          {!editingNotes ? (
            <View style={styles.notesDisplay}>
              <Text style={styles.notesText}>
                {notes || "No notes yet. Tap to add notes about this client."}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditingNotes(true)}
              >
                <Text style={styles.editButtonText}>{notes ? "Edit" : "Add Notes"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                style={styles.notesInput}
                placeholder="Enter notes about this client..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
              <View style={styles.notesButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditingNotes(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveNotes}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.appointmentContainer}>
          <Text style={styles.sectionTitle}>Appointment Date</Text>
          <View style={styles.appointmentDisplay}>
            <Text style={styles.appointmentText}>
              {appointmentDate
                ? appointmentDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "No appointment scheduled"}
            </Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD or MM/DD/YYYY"
              value={appointmentDateString}
              onChangeText={setAppointmentDateString}
              placeholderTextColor="#999"
            />
            <View style={styles.appointmentButtons}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => handleDateChange(appointmentDateString)}
              >
                <Text style={styles.dateButtonText}>
                  {appointmentDate ? "Update" : "Set"} Date
                </Text>
              </TouchableOpacity>
              {appointmentDate && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearAppointment}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {renderMeasurements(leftMeasurements, "Left")}
      {renderMeasurements(rightMeasurements, "Right")}

      <View style={styles.brandsSection}>
        <Text style={styles.sectionTitle}>Nail Brand Reference</Text>
        {brands.length === 0 ? (
          <Text style={styles.noBrands}>No brands added yet. Go to Manage Nail Brands to add some.</Text>
        ) : (
          brands.map((brand) => (
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
          ))
        )}
      </View>

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
  brandsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  noBrands: {
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
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
  tipSizesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tipSizeText: {
    fontSize: 14,
    color: "#555",
    marginRight: 16,
    marginBottom: 4,
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
  clientInfoSection: {
    marginBottom: 20,
  },
  notesContainer: {
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesDisplay: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  notesText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  notesButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 12,
  },
  appointmentContainer: {
    backgroundColor: "#fff0f0",
    padding: 16,
    borderRadius: 12,
  },
  appointmentDisplay: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  appointmentText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#333",
  },
  appointmentButtons: {
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
  },
  dateButtonText: {
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  clearButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    padding: 10,
    borderRadius: 6,
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
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
});