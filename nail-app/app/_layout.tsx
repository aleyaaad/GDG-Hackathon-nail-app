// this file listens to firebase auth and depending on if the user is logged in or not, it will automatically show the login page or the home page
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    // user can be undefined (initial state), null (not logged in), or a User which means the user IS logged in
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  if (user === undefined) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(tabs)" /> //logged in, show home page
      ) : (
        <Stack.Screen name="auth" /> // if user isnt logged in just show login screen
      )}
    </Stack>
  );
}