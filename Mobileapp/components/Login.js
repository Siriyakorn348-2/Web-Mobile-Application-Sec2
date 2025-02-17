import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpMode, setIsOtpMode] = useState(false);

  const handleLogin = () => {
    if (isOtpMode) {
      if (!phone || !otp) {
        Alert.alert("Error", "Please enter your phone number and OTP");
        return;
      }
      Alert.alert("Success", `Logged in with phone ${phone} and OTP`);
    } else {
      if (!email || !password) {
        Alert.alert("Error", "Please enter your email and password");
        return;
      }
      Alert.alert("Success", `Logged in with ${email}`);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Login</Text>
      {isOtpMode ? (
        <>
          <TextInput
            style={{ width: "100%", padding: 10, borderWidth: 1, borderColor: "gray", marginBottom: 10, borderRadius: 5 }}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            onChangeText={setPhone}
            value={phone}
          />
          <TextInput
            style={{ width: "100%", padding: 10, borderWidth: 1, borderColor: "gray", marginBottom: 10, borderRadius: 5 }}
            placeholder="OTP"
            keyboardType="numeric"
            onChangeText={setOtp}
            value={otp}
          />
        </>
      ) : (
        <>
          <TextInput
            style={{ width: "100%", padding: 10, borderWidth: 1, borderColor: "gray", marginBottom: 10, borderRadius: 5 }}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
            value={email}
          />
          <TextInput
            style={{ width: "100%", padding: 10, borderWidth: 1, borderColor: "gray", marginBottom: 10, borderRadius: 5 }}
            placeholder="Password"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />
        </>
      )}
      <TouchableOpacity
        style={{ backgroundColor: "blue", padding: 10, borderRadius: 5, width: "100%", alignItems: "center", marginBottom: 10 }}
        onPress={handleLogin}
      >
        <Text style={{ color: "white" }}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsOtpMode(!isOtpMode)}>
        <Text style={{ color: "blue" }}>{isOtpMode ? "Use Email/Password" : "Use Phone/OTP"}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
