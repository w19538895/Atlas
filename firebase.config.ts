// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtulxteL1bmtYm3DS45m1icEZPPbN-80Y",
  authDomain: "atlas-f90ee.firebaseapp.com",
  projectId: "atlas-f90ee",
  storageBucket: "atlas-f90ee.firebasestorage.app",
  messagingSenderId: "503688631875",
  appId: "1:503688631875:web:fc5b3d3195f3066fa6e6f6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);