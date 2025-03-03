import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

const HomeScreen = () => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  const navigation = useNavigation();

  const [stdid, setStdid] = useState('');
  const [name, setName] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  const [classrooms, setClassrooms] = useState([]);

  // ดึงข้อมูลส่วนตัวผู้ใช้จาก Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setStdid(data.stdid || '');
          setName(data.name || '');
        }
      }
    };
    fetchUserData();
  }, [user]);

  // ฟังก์ชันโหลดห้องเรียนที่ผู้ใช้เข้าร่วม
  const loadUserClassrooms = async (userId) => {
    try {
      const classroomCollection = collection(db, "classroom");
      const classroomSnapshot = await getDocs(classroomCollection);
      const userClassrooms = [];

      for (const classroomDoc of classroomSnapshot.docs) {
        const studentRef = doc(db, classroom/${classroomDoc.id}/students/${userId});
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

      setClassrooms(userClassrooms);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการโหลดห้องเรียน:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserClassrooms(user.uid);
    }
  }, [user]);

  // ขออนุญาตใช้กล้อง
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // ฟังก์ชัน logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้');
    }
  };

  const handleClassroomClick = (cid) => {
    navigation.navigate("ClassroomPage", { cid });
  };

  const renderClassroomItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleClassroomClick(item.cid)} style={styles.classCard}>
      <Image source={{ uri: item.imageURL }} style={styles.classroomImage} />
      <View style={styles.classInfo}>
        <Text style={styles.className}>{item.courseName}</Text>
        <Text style={styles.classID}>{item.courseID}</Text>
        <Text style={styles.roomName}>
          <FontAwesome name="map-marker" size={14} color="#777" /> {item.roomName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ส่วนหัว */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <FontAwesome name="user-circle" size={60} color="#007BFF" style={styles.profileIcon} />
          <View>
            <Text style={styles.profileName}>{name || "ไม่ระบุชื่อ"}</Text>
            <Text style={styles.profileId}>{stdid || "ไม่ระบุรหัสนักศึกษา"}</Text>
          </View>
        </View>
      </View>

      {/* ห้องเรียน */}
      <Text style={styles.sectionTitle}>ห้องเรียนของฉัน</Text>
      {classrooms.length === 0 ? (
        <View style={styles.emptyCard}>
          <FontAwesome name="exclamation-circle" size={40} color="#777" />
          <Text style={styles.emptyText}>คุณยังไม่ได้เข้าร่วมห้องเรียนใดๆ</Text>
        </View>
      ) : (
        <FlatList
          data={classrooms}
          keyExtractor={(item) => item.cid}
          renderItem={renderClassroomItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />
      )}

      {/* ปุ่มเพิ่มวิชา */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('JoinClassScreen')}
      >
        <FontAwesome name="plus" size={20} color="#fff" />
        <Text style={styles.addButtonText}>เพิ่มวิชา</Text>
      </TouchableOpacity>

      {/* ปุ่มสแกน QR */}
      {hasPermission === false ? (
        <Text style={styles.permissionText}>ไม่มีสิทธิ์เข้าถึงกล้อง</Text>
      ) : (
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setScanning(true)}
        >
          <FontAwesome name="qrcode" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>สแกน QR Code</Text>
        </TouchableOpacity>
      )}

      {scanning && hasPermission && (
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            type={Camera.Constants.Type.back}
            onBarCodeScanned={({ data }) => {
              setScanning(false);
              Alert.alert('สแกนสำเร็จ', รหัสวิชา: ${data}, [
                { text: 'OK', onPress: () => navigation.navigate("ClassroomPage", { cid: data }) }
              ]);
            }}
            ref={ref => setCameraRef(ref)}
          >
            <View style={styles.cameraOverlay}>
              <Text style={styles.scanningText}>กำลังสแกน...</Text>
            </View>
          </Camera>
        </View>
      )}

      {/* ปุ่ม Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    padding: 20,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  profileIcon: {
    marginRight: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileId: {
    fontSize: 16,
    color: '#777',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  classroomImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  classID: {
    fontSize: 14,
    color: '#555',
  },
  roomName: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.😎',
  },
  camera: {
    width: 300,
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  permissionText: {
    color: '#D9534F',
    fontSize: 16,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#D9534F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default HomeScreen;