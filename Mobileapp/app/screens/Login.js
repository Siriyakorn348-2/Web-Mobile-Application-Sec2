import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useRouter } from "expo-router"; // ✅ เปลี่ยนเป็น useRouter

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter(); // ✅ ใช้ router แทน navigation

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("✅ ล็อกอินสำเร็จ!");
      navigation.navigate("/screens/Home"); 
    } catch (error) {
      Alert.alert("❌ ล็อกอินล้มเหลว", error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>📧 อีเมล:</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} />
      
      <Text>🔒 รหัสผ่าน:</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <Button title="🔑 ล็อกอิน" onPress={handleLogin} />

      <TouchableOpacity onPress={() => router.push("/screens/Register")}>
        <Text style={{ color: "blue", marginTop: 10 }}>➕ ลงทะเบียน</Text>
      </TouchableOpacity>
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
