import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";

export default function Login() {
  console.log("✅ Login Screen Loaded"); // ✅ Debugging

  const router = useRouter();
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Login Successful"); // ✅ Debugging
      router.replace("/home"); // ✅ ใช้ expo-router
    } catch (error) {
      console.error("❌ Login Failed:", error.message);
      alert("Login Failed: " + error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "white" },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginVertical: 10, borderRadius: 5 },
});
