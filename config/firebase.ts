// Import the functions you need from the SDKs you need
// import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";

import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBD69EdDVSfImg0txGzs9Ntfux9VH9dVuU",
  authDomain: "expense-tracker-app-d2d71.firebaseapp.com",
  projectId: "expense-tracker-app-d2d71",
  storageBucket: "expense-tracker-app-d2d71.firebasestorage.app",
  messagingSenderId: "940385265092",
  appId: "1:940385265092:web:ee01a74aac51e1035cf091",
  measurementId: "G-383YXFYRMN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

//auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

//db
export const firestore = getFirestore(app);
