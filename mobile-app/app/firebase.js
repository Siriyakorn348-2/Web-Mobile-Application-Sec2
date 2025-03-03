import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 

// ตั้งค่าให้ Firebase Auth จำ session
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("🔥 Firebase Auth: จำ session แล้ว!");
  })
  .catch((error) => {
    console.error("⚠️ ตั้งค่า Persistence ล้มเหลว:", error);
  });

export { auth, db };
export default app;
