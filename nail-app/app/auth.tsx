// this file stores user info, and handles user authentication (login/signup), and shows some UI for login page


//React - required for react native components
// useState - store and update data in the component
import React, { useState } from "react";
//UI features from react native
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
// firebase auth functioms, signup, login, set user name
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
// using firestore functions - create documents, set data, getting time stamps
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// our firebase system (auth and a database)
import { auth, db } from "../firebase/firebaseConfig";

//this returns our UI and also handles logic for login page
export default function AuthScreen() {
  const [isSignup, setIsSignup] = useState(false); //check if in signup, if not, then login mode

  // stores what the user inputs
  const [fullName, setFullName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false); // if request is running, disable button

  const handleAuth = async () => { // this runs when the user presses login/ sign up, async gives time for firebase to respond before going to next logic
    // if user doesnt have an email OR doesnt have a password OR is trying to sign up but doesnt put full name - display alert and stop
    if (!email || !password || (isSignup && !fullName)) {
      Alert.alert("Missing info", "Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      //if a user is signing up, an account will be made in firebase auth
      if (isSignup) {
        // calls firebase auth to create a new user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // get user info from firebase response
        const user = userCredential.user;

        // if the user put a full name, update their profile with that name
        if (fullName.trim()) {
          await updateProfile(user, {
            displayName: fullName.trim(),
          });
        }

        // create a new document in the "users" collection in firestore with the user's info
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          fullName: fullName.trim(),
          email: user.email,
          createdAt: serverTimestamp(),
        });

        // if all goes well, show success message
        Alert.alert("Success", "Account created successfully.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        Alert.alert("Success", "Logged in successfully.");
      }
    } catch (error: any) {
      Alert.alert("Auth error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // MAIN UI - shows text inputs for email, password, and full name (if signing up), and a button to submit, and a button to switch between login and signup
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