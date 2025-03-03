
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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
const db = getDatabase(app);

export { auth, db };
