<<<<<<<< HEAD:Mobileapp/Mobileapp/components/firebase/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from 'firebase/database';

========
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
>>>>>>>> main:web-app/src/firebase/firebase.js

const firebaseConfig = {
  apiKey: "AIzaSyAK7O2L6dWCEMcgMHz2Mt9xxvxcN03a4zI",
  authDomain: "petty-hubby.firebaseapp.com",
  databaseURL: "https://petty-hubby-default-rtdb.firebaseio.com",
  projectId: "petty-hubby",
  storageBucket: "petty-hubby.appspot.com",
  messagingSenderId: "671313790696",
  appId: "1:671313790696:web:2c9cc60b89bb370d5beb5d",
  measurementId: "G-0BX2B6YTM0"
};

// ✅ เรียก initializeApp() เพื่อสร้าง Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
<<<<<<<< HEAD:Mobileapp/Mobileapp/components/firebase/firebase.js
const db = getDatabase(app);  
========
const db = getDatabase(app);
>>>>>>>> main:web-app/src/firebase/firebase.js

export { auth, db };
