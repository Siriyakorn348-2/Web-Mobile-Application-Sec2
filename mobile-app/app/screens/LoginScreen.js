import React, { useState } from 'react';
import { View, TextInput, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebase'; 
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const auth = getAuth(app); // ใช้แอปที่ถูกติดตั้งแล้ว
  const db = getFirestore(app); // ใช้แอปที่ถูกติดตั้งแล้ว

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and Password are required!');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter all fields.' });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setError('User data not found. Please contact support.');
        Toast.show({ type: 'error', text1: 'Error', text2: 'User not found in database.' });
      } else {
        Toast.show({ type: 'success', text1: 'Login Successful', text2: 'Welcome back!' });
        navigation.replace('Home');
      }
    } catch (err) {
      setError(err.message);
      Toast.show({ type: 'error', text1: 'Login Failed', text2: err.message });
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoginScreen;
