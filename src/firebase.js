import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBSEBIYY3f8kr_oifW3NuATP7qLMyNcuSY",
  authDomain: "shyam-bakery-app.firebaseapp.com",
  projectId: "shyam-bakery-app",
  storageBucket: "shyam-bakery-app.firebasestorage.app",
  messagingSenderId: "220642985890",
  appId: "1:220642985890:web:c11851f2b14c02737314fb",
  measurementId: "G-B40XQJM45T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);