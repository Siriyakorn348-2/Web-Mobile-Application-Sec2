import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

export default function LoginScreen() {
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!input || !password) {
      Alert.alert("Error", "Please enter your email/phone and password");
      return;
    }
    // Add authentication logic here
    Alert.alert("Success", `Logged in with ${input}`);
  };

  return (
    <View
      style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}
    >
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Login</Text>
      <TextInput
        style={{
          width: "100%",
          padding: 10,
          borderWidth: 1,
          borderColor: "gray",
          marginBottom: 10,
          borderRadius: 5,
        }}
        placeholder="Email or Phone Number"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setInput}
        value={input}
      />
      <TextInput
        style={{
          width: "100%",
          padding: 10,
          borderWidth: 1,
          borderColor: "gray",
          marginBottom: 10,
          borderRadius: 5,
        }}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <TouchableOpacity
        style={{
          backgroundColor: "blue",
          padding: 10,
          borderRadius: 5,
          width: "100%",
          alignItems: "center",
        }}
        onPress={handleLogin}
      >
        <Text style={{ color: "white" }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}
