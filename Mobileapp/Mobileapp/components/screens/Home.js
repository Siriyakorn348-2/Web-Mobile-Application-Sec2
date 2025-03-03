import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView, Button, FlatList, Image, TextInput, Modal, Alert } from "react-native";
import { getDoc, doc, collection, getDocs, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Camera } from "expo-camera";
import { TouchableOpacity } from "react-native";

const HomeScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [studentID, setStudentID] = useState("");
  const [studentName, setStudentName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("✅ พบผู้ใช้ล็อกอิน:", user.uid);
        setUserInfo(null);
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUserInfo(docSnap.data());
          await loadUserClassrooms(user.uid);
        } else {
          console.warn("⚠️ ไม่พบข้อมูลผู้ใช้ใน Firestore");

          await setDoc(userRef, {
            name: user.displayName || "ไม่ระบุชื่อ",
            email: user.email || "ไม่ระบุอีเมล",
            photo: user.photoURL || "",
          });
          console.log("📜 สร้างข้อมูลผู้ใช้ใหม่ใน Firestore");
        }
      } else {
        console.log("🔄 รอโหลด session...");
        setTimeout(() => {
          if (!auth.currentUser) {
            console.log("🚫 ผู้ใช้ไม่ได้ล็อกอิน กำลังเปลี่ยนหน้าไป Login...");
            navigation.replace("Login");
          }
        }, 1500);
      }
      setLoading(false);
    });

    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const loadUserClassrooms = async (userId) => {
    try {
      const classroomCollection = collection(db, "classroom");
      const classroomSnapshot = await getDocs(classroomCollection);
      const userClassrooms = [];

      for (const classroomDoc of classroomSnapshot.docs) {
        const studentRef = doc(db, `classroom/${classroomDoc.id}/students/${userId}`);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          const classroomData = classroomDoc.data();
          userClassrooms.push({
            cid: classroomDoc.id,
            courseID: classroomData.courseID || "ไม่มีรหัส",
            courseName: classroomData.courseName || "ไม่มีชื่อวิชา",
            imageURL: classroomData.imageURL || "",
            roomName: classroomData.roomName || "ไม่มีห้อง",
          });
        }
      }

      setClassrooms(userClassrooms);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการโหลดห้องเรียน:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการล็อกเอาต์:", error);
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (type === "org.iso.QRCode") {
      console.log("📷 สแกน QR สำเร็จ:", data);
      setScanning(false);
      setScannedData(data);
      setModalVisible(true);
    }
  };

  const handleRegisterClass = async () => {
    if (!scannedData || !studentID || !studentName) {
      Alert.alert("⚠️ กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("⚠️ กรุณาเข้าสู่ระบบ");
      return;
    }

    const cid = scannedData;
    const uid = user.uid;

    try {
      await setDoc(doc(db, `classroom/${cid}/students/${uid}`), {
        stdid: studentID,
        name: studentName,
      });

      await setDoc(doc(db, `users/${uid}/classroom/${cid}`), {
        status: 2,
      });

      Alert.alert("✅ ลงทะเบียนสำเร็จ!");
      setModalVisible(false);
      setStudentID("");
      setStudentName("");
      await loadUserClassrooms(uid);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการลงทะเบียน:", error);
      Alert.alert("❌ ลงทะเบียนไม่สำเร็จ");
    }
  };

  const handleClassroomClick = (cid) => {
    navigation.navigate("ClassroomPage", { cid });
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="large" color="#A68AC4" />
        ) : userInfo ? (
          <>
            <Text style={styles.title}>👋 สวัสดี, {userInfo.name}!</Text>
            <Text style={styles.email}>📧 {userInfo.email}</Text>
            <Button title="เข้าร่วมห้องเรียน" onPress={() => navigation.navigate("JoinClassScreen")} color="#5A67D8" />
            <Button title="สแกน QR Code" onPress={() => setScanning(true)} color="#4CAF50" />

            {scanning && hasPermission && (
              <Camera 
                style={styles.camera} 
                onBarCodeScanned={handleBarCodeScanned} 
                barCodeScannerSettings={{ barCodeTypes: ["qr"] }} 
                flashMode={Camera.Constants.FlashMode.off}  
              />
            )}

          <FlatList
            data={classrooms}
            keyExtractor={(item) => item.cid}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleClassroomClick(item.cid)}
                style={styles.classCard}
              >
                <Image source={{ uri: item.imageURL }} style={styles.classImage} />
                <View>
                  <Text style={styles.className}>{item.courseName} ({item.courseID})</Text>
                  <Text style={styles.roomName}>📍 ห้อง: {item.roomName}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

            <Button title="Logout" onPress={handleLogout} color="#D9534F" />
          </>
        ) : (
          <Text style={styles.loadingText}>⏳ กำลังโหลดข้อมูล...</Text>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text>กรอกรหัสนักศึกษา:</Text>
          <TextInput style={styles.input} value={studentID} onChangeText={setStudentID} />
          <Text>ชื่อ-สกุล:</Text>
          <TextInput style={styles.input} value={studentName} onChangeText={setStudentName} />
          <Button title="ลงทะเบียน" onPress={handleRegisterClass} color="#2196F3" />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#888',
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  classImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roomName: {
    fontSize: 14,
    color: '#888',
  },
  camera: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    borderRadius: 5,
  },
});


export default HomeScreen;
