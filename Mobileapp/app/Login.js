import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';
import { useState } from 'react';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
e

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Login ด้วย Email/Password
  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Logged in with Email!');
    } catch (error) {
      alert(error.message);
    }
  };

  // ส่ง OTP
  const handleSendOtp = async () => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phone);
      setConfirmation(confirmationResult);
      setOtpSent(true);
      alert('OTP sent!');
    } catch (error) {
      alert(error.message);
    }
  };

  // ยืนยัน OTP
  const handleVerifyOtp = async () => {
    try {
      if (!confirmation) throw new Error('No OTP confirmation available');
      await confirmation.confirm(otp);
      alert('Logged in with Phone!');
      setOtpSent(false);
      setOtp('');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile Login</Text>

      {/* Email/Password */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login with Email" onPress={handleEmailLogin} />

      {/* Phone Login */}
      <TextInput
        style={styles.input}
        placeholder="Phone (e.g., +66123456789)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      {!otpSent ? (
        <Button title="Send OTP" onPress={handleSendOtp} />
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
          />
          <Button title="Verify OTP" onPress={handleVerifyOtp} />
        </>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});