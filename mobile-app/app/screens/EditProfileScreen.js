import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ route }) => {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;
  const navigation = useNavigation();

  const { userData } = route.params || {};

  const [studentId, setStudentId] = useState(userData?.stid || '');
  const [name, setName] = useState(userData?.name || '');
  const [photo, setPhoto] = useState(userData?.photo || '');
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    console.log('pickImage function called');

    // ตรวจสอบและขออนุญาต
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('Permission status:', status);

    if (status !== 'granted') {
      Alert.alert(
        '⚠️ ข้อผิดพลาด',
        'แอปต้องการสิทธิ์ในการเข้าถึงแกลเลอรี่ภาพเพื่อเปลี่ยนรูปโปรไฟล์ กรุณาอนุญาตในตั้งค่า',
      );
      return;
    }

    try {
      console.log('Launching image library');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // เปลี่ยนจาก MediaType.Image เป็น MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log('ImagePicker result:', result);

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        console.log('New photo URI:', result.assets[0].uri);
      } else {
        console.log('Image picking canceled');
      }
    } catch (error) {
      console.error('Error in pickImage:', error.message);
      Alert.alert('❌ เกิดข้อผิดพลาด', 'ไม่สามารถเปิดแกลเลอรี่ได้: ' + error.message);
    }
  };

  const uploadImage = async (uri) => {
    if (!uri) return photo;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile_pics/${user.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error.message);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!studentId.trim() || !name.trim()) {
      Alert.alert('⚠️ ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      if (!user) throw new Error('No user logged in');

      const photoURL = await uploadImage(photo);

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        stid: studentId,
        name: name,
        photo: photoURL,
      }, { merge: true });

      Alert.alert('✅ บันทึกสำเร็จ', 'ข้อมูลส่วนตัวของคุณได้รับการอัปเดตแล้ว');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error.message);
      Alert.alert('❌ เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ โปรดลองอีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>แก้ไขข้อมูลส่วนตัว</Text>
          </View>
          <View style={styles.cardContent}>
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => {
                console.log('TouchableOpacity pressed');
                pickImage();
              }}
              activeOpacity={0.7}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <MaterialIcons name="add-a-photo" size={30} color="#999" />
                </View>
              )}
              <Text style={styles.photoText}>แตะเพื่อเปลี่ยนรูปโปรไฟล์</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="รหัสนักศึกษา"
              value={studentId}
              onChangeText={setStudentId}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อ-สกุล"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <Text style={styles.buttonText}>บันทึกข้อมูล</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardContent: {
    paddingHorizontal: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoText: {
    fontSize: 14,
    color: '#3498db',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#b0bec5',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default EditProfileScreen;