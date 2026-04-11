// root layout - main app navigation controller that listens to firebase auth state
// automatically shows login page if user is not authenticated, home page if authenticated
// handles the initial auth state check when app first loads

import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

// main root layout component - conditionally renders either auth screen or home tabs based on user login status
export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // listen to firebase auth state changes and update component state
  // user can be: undefined (initial/loading), null (not logged in), or User object (logged in)
  useEffect(() => {
    // subscribe to firebase auth state changes
    // this listener automatically triggers whenever user logs in or out
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // cleanup listener when component unmounts
    return unsubscribe;
  }, []);

  // don't render anything while checking auth status to avoid ui flashing
  if (user === undefined) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(tabs)" /> // user is logged in, show home page with tabs
      ) : (
        <Stack.Screen name="auth" /> // user not logged in, show login/signup screen
      )}
    </Stack>
  );
}