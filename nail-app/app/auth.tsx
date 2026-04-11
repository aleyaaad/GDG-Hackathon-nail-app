// authentication / login page - handles user signup and login functionality
// stores user info in firebase auth and creates user document in firestore
// automatically redirects logged-in users away from this page

// react - required for building react native components
// usestate - hook for storing and updating component state
import React, { useState } from "react";
// firebase auth functions - create accounts, login, update user profiles
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
// firebase authentication functions for signup/login and profile management
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
// firebase firestore functions - create documents, set data, manage timestamps
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// our firebase configuration - auth and database instances
import { auth, db } from "../firebase/firebaseConfig";
import { router } from "expo-router";

// main authentication screen component - handles both login and signup modes
export default function AuthScreen() {
  const [isSignup, setIsSignup] = useState(false); // toggle between signup and login modes

  // form input states that store user entered data
  const [fullName, setFullName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false); // disable button while request is processing

  // handles both login and signup when user presses the auth button
  // async allows time for firebase to process request before continuing
  const handleAuth = async () => {
    // validate that user filled in required fields (fullname required only for signup)
    if (!email || !password || (isSignup && !fullName)) {
      Alert.alert("Missing info", "Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      // if user is signing up, create new firebase auth account
      if (isSignup) {
        // call firebase auth to create new user with email and password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // get the newly created user object from firebase response
        const user = userCredential.user;

        // if user entered a full name, update their profile with that name
        if (fullName.trim()) {
          await updateProfile(user, {
            displayName: fullName.trim(),
          });
        }

        // create a new document in the "users" firestore collection with user info
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          fullName: fullName.trim(),
          email: user.email,
          createdAt: serverTimestamp(),
        });

        // show success message and redirect to home
        Alert.alert("Success", "Account created successfully.");
        router.replace("/(tabs)");
      } else {
        // user is logging in, verify credentials with firebase auth
        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace("/(tabs)");
        Alert.alert("Success", "Logged in successfully.");
      }
    } catch (error: any) {
      Alert.alert("Auth error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignup ? "Create Account" : "Welcome Back"}</Text>

      {isSignup && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Please wait..." : isSignup ? "Register" : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
        <Text style={styles.switchText}>
          {isSignup
            ? "Already have an account? Login"
            : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
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
    marginTop: 6,
    marginBottom: 18,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  switchText: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "500",
  },
});