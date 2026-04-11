// home / dashboard page - main hub displaying user's profiles, portfolio, and reviews
// shows up to 5 portfolio images and 3 latest reviews from current logged-in user
// provides buttons to navigate to all major app features like creating profiles, managing brands, portfolio, and reviews

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
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

// interface for portfolio images
interface PortfolioImage {
  id: string;
  imageUri: string;
  caption: string;
  ownerUid: string;
}

// interface for reviews with star ratings
interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  ownerUid: string;
}

// main home screen component
export default function HomeScreen() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // logs out the current user and redirects to login page
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };
// navigates to profile creation page so user can create a new client profile
  
  const handleCreateProfile = () => {
    router.push("/profile");
  };
// navigates to nail brands management page
  
  const handleManageBrands = () => {
    router.push("/nail-brands");
  // navigates to portfolio management page where user can upload and manage photos
  };

  const handleManagePortfolio = () => {
    router.push("/portfolio");
  // navigates to reviews management page where user can add and manage client testimonials
  };

  const handleManageReviews = () => {
    router.push("/reviews");
// tests gemini ai connection by attempting to analyze a sample image with lazy initialization
  // dynamically imports gemini client to avoid blocking app startup
    };

const handleTestGemini = async () => {
  try {
    const { testGeminiConnection } = await import("../../gemini/geminiClient");
    const result = await testGeminiConnection();
    console.log("Parsed Gemini result:", result);
    alert(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.log("Gemini test full error:", error);
  // load user profiles, portfolio images, and reviews from firestore on component mount
  // subscribes to real-time updates so dashboard instantly reflects any changes
    alert(`Gemini test failed: ${error?.message || "Unknown error"}`);
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

    // Load portfolio images
    const imagesRef = collection(db, "portfolioImages");
    const imagesUnsubscribe = onSnapshot(
      imagesRef,
      (snapshot) => {
        const loadedImages = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as PortfolioImage))
          .filter((img) => img.ownerUid === currentUser.uid)
          .slice(0, 5); // Show only first 5
        setPortfolioImages(loadedImages);
      },
      (error) => {
        console.log("Error loading portfolio images:", error);
      }
    );

    // Load reviews
    const reviewsRef = collection(db, "reviews");
    const reviewsUnsubscribe = onSnapshot(
      reviewsRef,
      (snapshot) => {
        const loadedReviews = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Review))
          .filter((review) => review.ownerUid === currentUser.uid)
          .slice(0, 3); // Show only first 3
        setReviews(loadedReviews);
      },
      (error) => {
        console.log("Error loading reviews:", error);
      }
    );

    return () => {
      unsubscribe();
  // converts numeric rating (1-5) to star emoji display with filled and empty stars
      imagesUnsubscribe();
      reviewsUnsubscribe();
    };
  }, []);

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < rating ? "⭐" : "☆"))
      .join(" ");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quick Nails</Text>
      <Text style={styles.subtitle}>
        Get accurate nail measurements and compare them with brand sizing charts.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProfile}>
        <Text style={styles.primaryButtonText}>Create Your Measurements</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={handleManageBrands}>
        <Text style={styles.primaryButtonText}>Manage Nail Brands</Text>
      </TouchableOpacity>

      {/*  Gemini test button */}
      <TouchableOpacity style={styles.primaryButton} onPress={handleTestGemini}>
        <Text style={styles.primaryButtonText}>Test Gemini</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed Nail Clients</Text>
        <TouchableOpacity style={styles.manageButton} onPress={handleManagePortfolio}>
          <Text style={styles.manageButtonText}>Manage Portfolio</Text>
        </TouchableOpacity>
        {portfolioImages.length === 0 ? (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              No portfolio images yet. Add your first photo!
            </Text>
          </View>
        ) : (
          <FlatList
            data={portfolioImages}
            renderItem={({ item }) => (
              <View style={styles.portfolioCard}>
                <Image source={{ uri: item.imageUri }} style={styles.portfolioImage} />
                {item.caption && <Text style={styles.portfolioCaption}>{item.caption}</Text>}
              </View>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            horizontal={false}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <TouchableOpacity style={styles.manageButton} onPress={handleManageReviews}>
          <Text style={styles.manageButtonText}>Manage Reviews</Text>
        </TouchableOpacity>
        {reviews.length === 0 ? (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>
              No reviews yet. Add your first client review!
            </Text>
          </View>
        ) : (
          <FlatList
            data={reviews}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewClientName}>{item.clientName}</Text>
                  <Text style={styles.reviewRating}>{renderStars(item.rating)}</Text>
                </View>
                <Text style={styles.reviewComment}>{item.comment}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
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
  manageButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  manageButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 14,
  },
  portfolioCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  portfolioImage: {
    width: "100%",
    height: 200,
  },
  portfolioCaption: {
    fontSize: 14,
    padding: 10,
    color: "#555",
    fontStyle: "italic",
  },
  reviewCard: {
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  reviewHeader: {
    marginBottom: 8,
  },
  reviewClientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewRating: {
    fontSize: 14,
  },
  reviewComment: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
});