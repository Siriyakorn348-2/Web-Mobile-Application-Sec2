import React, { useState } from 'react';
import { View, TextInput, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const auth = getAuth(getApp());
  const db = getFirestore(getApp());
  const storage = getStorage(getApp());

  // 📷 ฟังก์ชันเลือกภาพจากเครื่อง
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  // อัปโหลดภาพไปยัง Firebase Storage
  const uploadImageAsync = async (uri, uid) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_pictures/${uid}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // 📌 ฟังก์ชันลงทะเบียน
  const handleSignUp = async () => {
    if (!name || !email || !password || !photo) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      // สร้างผู้ใช้ใหม่ใน Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // อัปโหลดรูปภาพและดึง URL
      const photoURL = await uploadImageAsync(photo, user.uid);
  
      if (!photoURL) {
        throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
      }
  
      // บันทึกข้อมูลผู้ใช้ลง Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: user.email,
        photo: photoURL,
      });
  
      navigation.navigate('Home');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {photo ? <Image source={{ uri: photo }} style={styles.profileImage} /> : <Text>เลือกรูปภาพ</Text>}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="ชื่อของคุณ" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} />

      {loading ? (
        <ActivityIndicator size="large" color="#7A5ACF" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 10, marginBottom: 15, paddingHorizontal: 15, backgroundColor: 'white' },
  button: { backgroundColor: '#7A5ACF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  imagePicker: { alignItems: 'center', marginBottom: 15, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 10 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 10 },
});

export default RegisterScreen;
