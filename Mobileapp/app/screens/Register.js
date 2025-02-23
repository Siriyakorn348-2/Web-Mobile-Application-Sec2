import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useRouter } from "expo-router"; // ✅ เปลี่ยนเป็น useRouter

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter(); // ✅ ใช้ router แทน navigation

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        photo: "https://via.placeholder.com/150",
      });

      Alert.alert("✅ ลงทะเบียนสำเร็จ!");
      router.push("/screens/Login"); // ✅ ใช้ router.push() ไปหน้า Login
    } catch (error) {
      Alert.alert("❌ ลงทะเบียนล้มเหลว", error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>👤 ชื่อ:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text>📧 อีเมล:</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} />

      <Text>🔒 รหัสผ่าน:</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <Button title="✅ ลงทะเบียน" onPress={handleRegister} />
    </View>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
};
