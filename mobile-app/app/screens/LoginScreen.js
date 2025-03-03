import React, { useState } from 'react';
import { View, TextInput, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';  // ใช้ import จาก firebase.js
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter all fields.' });
      return;
    }

    setLoading(true);

    try {
      // ✅ Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCredential.user;

      // ✅ Check user data in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'User not found in database.' });
      } else {
        Toast.show({ type: 'success', text1: 'Login Successful', text2: 'Welcome back!' });
        navigation.replace('Home');
      }
    } catch (err) {
      console.error("Login Error: ", err);
      Toast.show({ type: 'error', text1: 'Login Failed', text2: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#7A5ACF" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </>
      )}

      <Toast />
    </View>
  );
};

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#7A5ACF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  signupText: {
    color: '#7A5ACF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
