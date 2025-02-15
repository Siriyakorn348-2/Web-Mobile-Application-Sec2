// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from 'firebase/database';


const firebaseConfig = {
  apiKey: "AIzaSyCLF0lSC8MjOME3Kd5XcjPK3IWnU2HAFcI",
  authDomain: "webmobileapplication-ccb72.firebaseapp.com",
  projectId: "webmobileapplication-ccb72",
  storageBucket: "webmobileapplication-ccb72.appspot.com", 
  messagingSenderId: "982789253508",
  appId: "1:982789253508:web:d00d5bd14b4e1a71a015d1",
  measurementId: "G-09RSTXNY4X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);  

export { auth, db };
