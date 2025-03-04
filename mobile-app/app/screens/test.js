import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  const navigation = useNavigation();

  const [classroomDetails, setClassroomDetails] = useState({});
  const [userData, setUserData] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [studentIdInput, setStudentIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showInputFields, setShowInputFields] = useState(false);
  const [registeredRooms, setRegisteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const extractRoomCode = (input) => {
    if (!input) return '';
    const match = input.match(/courses\/([^/]+)/);
    return match ? match[1] : input.trim();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('✅ ออกจากระบบสำเร็จ', 'คุณได้ออกจากระบบเรียบร้อยแล้ว');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error.message);
      Alert.alert('❌ เกิดข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้ โปรดลองอีกครั้ง');
    }
  };

  const fetchClassroomDetails = async (roomCode) => {
    try {
      const cleanedRoomCode = extractRoomCode(roomCode);
      const classroomRef = doc(db, `classroom`, cleanedRoomCode);
      const classroomSnap = await getDoc(classroomRef);

      if (classroomSnap.exists()) {
        const data = classroomSnap.data();
        console.log(`Data for ${cleanedRoomCode}:`, data);
        setClassroomDetails((prev) => ({
          ...prev,
          [cleanedRoomCode]: {
            cid: cleanedRoomCode,
            courseID: data.courseID || "ไม่มีรหัส",
            courseName: data.courseName || "ไม่มีชื่อวิชา",
            imageURL: data.imageURL || "https://via.placeholder.com/60",
            roomName: data.roomName || "ไม่มีห้อง",
          },
        }));
      } else {
        console.log(`No data found for room ${cleanedRoomCode}`);
      }
    } catch (error) {
      console.error('Error fetching classroom details:', error.message);
    }
  };

  useEffect(() => {
    if (!user) {
      console.log('No user logged in');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          console.log('User data:', data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchRegisteredRooms = async () => {
      try {
        const classroomCollection = collection(db, "classroom");
        const classroomSnapshot = await getDocs(classroomCollection);
        const userClassrooms = [];

        for (const classroomDoc of classroomSnapshot.docs) {
          const studentRef = doc(db, `classroom/${classroomDoc.id}/students`, user.uid);
          const studentSnap = await getDoc(studentRef);

          if (studentSnap.exists()) {
            const classroomData = classroomDoc.data();
            userClassrooms.push({
              cid: classroomDoc.id,
              courseID: classroomData.courseID || "ไม่มีรหัส",
              courseName: classroomData.courseName || "ไม่มีชื่อวิชา",
              imageURL: classroomData.imageURL || "https://via.placeholder.com/60",
              roomName: classroomData.roomName || "ไม่มีห้อง",
            });
          }
        }

        console.log('Registered rooms:', userClassrooms);
        setRegisteredRooms(userClassrooms.map(room => room.cid));
        setClassroomDetails(userClassrooms.reduce((acc, room) => ({
          ...acc,
          [room.cid]: room
        }), {}));
      } catch (error) {
        console.error('Error fetching registered rooms:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchRegisteredRooms();
  }, [user]);

  const registerRoomCode = async (code) => {
    const cleanedRoomCode = extractRoomCode(code);
    if (!cleanedRoomCode) {
      Alert.alert('ข้อผิดพลาด', 'รหัสห้องไม่ถูกต้อง');
      return;
    }

    try {
      const classroomRef = doc(db, `classroom`, cleanedRoomCode);
      const classroomSnap = await getDoc(classroomRef);
      if (!classroomSnap.exists()) {
        Alert.alert('ไม่พบรหัสห้อง', 'กรุณาตรวจสอบรหัสห้องอีกครั้ง');
        return;
      }

      setRoomCode(cleanedRoomCode);
      setStudentIdInput(userData?.stid || '');
      setNameInput(userData?.name || '');
      setShowInputFields(true);
    } catch (error) {
      console.error('Register with code error:', error.message);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบรหัสห้องได้');
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setScanning(false);

    if (!user) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาลงชื่อเข้าใช้ก่อนสแกน QR Code');
      return;
    }

    const scannedRoomCode = extractRoomCode(data);
    if (!scannedRoomCode) {
      Alert.alert('ข้อผิดพลาด', 'รหัส QR Code ไม่ถูกต้อง');
      return;
    }

    try {
      const classroomRef = doc(db, `classroom`, scannedRoomCode);
      const classroomSnap = await getDoc(classroomRef);
      if (!classroomSnap.exists()) {
        Alert.alert('ไม่พบรหัสห้อง', 'รหัส QR Code ไม่ถูกต้อง');
        return;
      }

      setRoomCode(scannedRoomCode);
      setStudentIdInput(userData?.stid || '');
      setNameInput(userData?.name || '');
      setShowInputFields(true);
    } catch (error) {
      console.error('QR Code scan error:', error.message);
      Alert.alert('❌ เกิดข้อผิดพลาด', 'ไม่สามารถประมวลผล QR Code ได้');
    }
  };

  const startScanning = async () => {
    const { granted } = await requestPermission();
    if (granted) {
      setScanning(true);
      setScanned(false);
    } else {
      Alert.alert('ไม่ได้รับอนุญาตให้ใช้กล้อง', 'กรุณาอนุญาตให้แอพเข้าถึงกล้องในการตั้งค่า');
    }
  };

  const confirmRegistration = async () => {
    if (!roomCode.trim() || !studentIdInput.trim() || !nameInput.trim()) {
      Alert.alert('⚠️ ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      if (registeredRooms.includes(roomCode)) {
        Alert.alert('แจ้งเตือน', 'คุณลงทะเบียนห้องนี้ไปแล้ว');
        navigation.navigate('ClassroomPage', { cid: roomCode });
        return;
      }

      await setDoc(doc(db, `classroom/${roomCode}/students`, user.uid), {
        stdid: studentIdInput,
        name: nameInput,
        status: 2,
      }, { merge: true });

      await setDoc(doc(db, `users/${user.uid}/classroom`, roomCode), { status: 2 }, { merge: true });

      Alert.alert('✅ เข้าร่วมสำเร็จ', `คุณได้เข้าห้องเรียน ${roomCode} เรียบร้อยแล้ว!`);
      setShowInputFields(false);
      setStudentIdInput('');
      setNameInput('');
      setRegisteredRooms((prev) => [...prev, roomCode]);
      await fetchClassroomDetails(roomCode);
      setRoomCode('');
      navigation.navigate('ClassroomPage', { cid: roomCode });
    } catch (error) {
      console.error('Confirm registration error:', error.message);
      Alert.alert('❌ เกิดข้อผิดพลาด', 'โปรดลองอีกครั้งในภายหลัง');
    }
  };

  const navigateToClassroom = (roomCode) => {
    navigation.navigate('ClassroomPage', { cid: roomCode });
  };

  const handleRoomOptions = (roomCode) => {
    Alert.alert(
      'จัดการห้องเรียนนี้',
      `คุณต้องการลบห้องเรียน ${classroomDetails[roomCode]?.courseName || roomCode} นี้หรือไม่?`,
      [
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, `classroom/${roomCode}/students`, user.uid));
              await deleteDoc(doc(db, `users/${user.uid}/classroom`, roomCode));
              setRegisteredRooms((prev) => prev.filter((room) => room !== roomCode));
              setClassroomDetails((prev) => {
                const updatedDetails = { ...prev };
                delete updatedDetails[roomCode];
                return updatedDetails;
              });
              Alert.alert('✅ ลบสำเร็จ', `ห้องเรียน ${roomCode} ถูกลบออกจากรายการแล้ว`);
            } catch (error) {
              console.error('Delete room error:', error.message);
              Alert.alert('❌ เกิดข้อผิดพลาด', 'ไม่สามารถลบห้องเรียนได้ โปรดลองอีกครั้ง');
            }
          },
        },
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
      ]
    );
  };

  // New function to navigate to Edit Profile screen
  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { userData });
  };

  const findClassroomOwner = async (code) => {
    try {
      const classroomRef = doc(db, `classroom`, code);
      const classroomSnap = await getDoc(classroomRef);
      if (classroomSnap.exists()) {
        return user.uid;
      }
      console.log(`No classroom found for code: ${code}`);
      return null;
    } catch (error) {
      console.error('Error finding classroom owner:', error.message);
      return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.infoText}>กำลังโหลดข้อมูล...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>ข้อมูลส่วนตัว</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color="#d9534f" />
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            <Image source={{ uri: userData?.photo }} style={styles.profileImage} />
            <Text style={styles.infoText}>รหัสนักศึกษา: {userData?.stid || '-'}</Text>
            <Text style={styles.infoText}>ชื่อ: {userData?.name || '-'}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <MaterialIcons name="edit" size={20} color="#fff" />
              <Text style={styles.buttonText}>แก้ไขข้อมูลส่วนตัว</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="edit" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>ลงทะเบียนด้วยรหัสห้อง</Text>
          </View>
          <View style={styles.cardContent}>
            <TextInput
              style={styles.input}
              placeholder="กรอกรหัสห้องเรียน"
              value={roomCode}
              onChangeText={setRoomCode}
            />
            <TouchableOpacity style={styles.button} onPress={() => registerRoomCode(roomCode)}>
              <Text style={styles.buttonText}>ตรวจสอบห้องเรียน</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showInputFields && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={24} color="#3498db" />
              <Text style={styles.cardTitle}>ข้อมูลนักศึกษา</Text>
            </View>
            <View style={styles.cardContent}>
              <TextInput
                style={styles.input}
                placeholder="รหัสนักศึกษา"
                value={studentIdInput}
                onChangeText={setStudentIdInput}
              />
              <TextInput
                style={styles.input}
                placeholder="ชื่อ-สกุล"
                value={nameInput}
                onChangeText={setNameInput}
              />
              <TouchableOpacity style={styles.button} onPress={confirmRegistration}>
                <Text style={styles.buttonText}>ลงทะเบียนเข้าร่วมห้องเรียน</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="qr-code-scanner" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>สแกน QR Code</Text>
          </View>
          <View style={styles.cardContent}>
            <TouchableOpacity style={styles.button} onPress={startScanning}>
              <Text style={styles.buttonText}>เปิดตัวสแกน</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="class" size={24} color="#3498db" />
            <Text style={styles.cardTitle}>ห้องเรียนที่ลงทะเบียน</Text>
          </View>
          <View style={styles.cardContent}>
            {registeredRooms.length > 0 ? (
              registeredRooms.map((room, index) => {
                const details = classroomDetails[room] || {};
                return (
                  <View key={index} style={styles.classroomCard}>
                    <TouchableOpacity
                      style={styles.registeredRoomItem}
                      onPress={() => navigateToClassroom(room)}
                    >
                      {details.imageURL && (
                        <Image
                          source={{ uri: details.imageURL }}
                          style={styles.roomImage}
                        />
                      )}
                      <View style={styles.roomTextContainer}>
                        <Text style={styles.infoText}>
                          {details.courseName || 'ไม่มีชื่อวิชา'}
                        </Text>
                        <Text style={styles.infoText}>
                          รหัสวิชา: {details.courseID || 'ไม่มีรหัส'}
                        </Text>
                        <Text style={styles.infoText}>
                          ห้อง: {details.roomName || 'ไม่มีห้อง'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.optionsButton}
                      onPress={() => handleRoomOptions(room)}
                    >
                      <MaterialIcons name="more-vert" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <Text style={styles.infoText}>ยังไม่มีห้องเรียนที่ลงทะเบียน</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {scanning && permission?.granted && (
        <View style={styles.cameraContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setScanning(false)}
          >
            <Text style={styles.cancelButtonText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  classroomCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  registeredRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  roomTextContainer: {
    flex: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  logoutButton: {
    padding: 5,
    marginStart: 160,
  },
  optionsButton: {
    padding: 5,
  },
});

export default HomeScreen;