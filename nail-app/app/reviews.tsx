// reviews management page - allows users to add and manage client testimonials and ratings
// users can add client names, 1-5 star ratings, and review comments
// reviews are displayed on the home page to build social proof for potential clients

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
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { router } from "expo-router";

// interface for review data stored in firestore
interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  ownerUid: string;
  createdAt: any;
}

// main reviews management screen
export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingReview, setAddingReview] = useState(false);
  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  // load user's reviews from firestore on component mount
  // subscribes to real-time updates and sorts by most recent first
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const reviewsRef = collection(db, "reviews");
    const unsubscribe = onSnapshot(
      reviewsRef,
      (snapshot) => {
        const loadedReviews = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Review))
          .filter((review) => review.ownerUid === currentUser.uid)
          .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
        setReviews(loadedReviews);
        setLoading(false);
      },
      (error) => {
        console.log("Error loading reviews:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // validates review data and saves it to firestore with client name, rating (1-5), and comment
  // closes the form after successful save
  }, []);

  const handleAddReview = async () => {
    if (!clientName.trim()) {
      Alert.alert("Error", "Please enter client name.");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Error", "Please enter review comment.");
      return;
    }

    const ratingNum = parseInt(rating) || 5;
    if (ratingNum < 1 || ratingNum > 5) {
      Alert.alert("Error", "Rating must be between 1 and 5.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user logged in.");
      return;
    }

    try {
      await addDoc(collection(db, "reviews"), {
        clientName: clientName.trim(),
        rating: ratingNum,
        comment: comment.trim(),
        ownerUid: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setClientName("");
      setRating("5");
      setComment("");
      setAddingReview(false);
      Alert.alert("Success", "Review added successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  // prompts user for confirmation and then deletes review from firestore
  // once deleted, review will no longer appear in reviews list or on home page
  };

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "reviews", reviewId));
              Alert.alert("Success", "Review deleted.");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
  // converts a numeric rating (1-5) into a visual star display using star emojis
  // filled stars (⭐) for rating count, empty stars (☆) for remainder
      ]
    );
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < rating ? "⭐" : "☆"))
      .join(" ");
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
      <Text style={styles.title}>Reviews</Text>
      <Text style={styles.subtitle}>Manage your client reviews and testimonials</Text>

      {!addingReview ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setAddingReview(true)}>
          <Text style={styles.addButtonText}>Add New Review</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addReviewForm}>
          <TextInput
            style={styles.input}
            placeholder="Client Name"
            value={clientName}
            onChangeText={setClientName}
            placeholderTextColor="#999"
          />

          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Rating:</Text>
            <TextInput
              style={[styles.input, styles.ratingInput]}
              placeholder="1-5"
              value={rating}
              onChangeText={setRating}
              keyboardType="numeric"
              maxLength={1}
              placeholderTextColor="#999"
            />
          </View>

          <TextInput
            style={[styles.input, styles.commentInput]}
            placeholder="Review comment"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setAddingReview(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleAddReview}>
              <Text style={styles.saveButtonText}>Save Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Your Reviews</Text>
      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews yet. Add your first review!</Text>
      ) : (
        <FlatList
          data={reviews}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.clientName}>{item.clientName}</Text>
                  <Text style={styles.rating}>{renderStars(item.rating)}</Text>
                </View>
              </View>
              <Text style={styles.comment}>{item.comment}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteReview(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
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
  addReviewForm: {
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
    color: "#333",
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 10,
  },
  ratingInput: {
    flex: 1,
    marginBottom: 0,
  },
  commentInput: {
    textAlignVertical: "top",
    minHeight: 100,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#95a5a6",
    padding: 12,
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
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
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
  reviewCard: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  reviewHeader: {
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 12,
  },
  backText: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "500",
    marginTop: 16,
  },
});
