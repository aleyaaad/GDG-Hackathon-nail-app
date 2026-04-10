// firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBNJGROY2Fa0LdNC-njGyY7F5fBuXOVyis",
  authDomain: "nail-sizing-app.firebaseapp.com",
  projectId: "nail-sizing-app",
  storageBucket: "nail-sizing-app.firebasestorage.app",
  messagingSenderId: "745276596539",
  appId: "1:745276596539:web:42db6df1755a3a1955171e",
  measurementId: "G-YLQDSEMW27"
};

const app = initializeApp(firebaseConfig);

export default app;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
