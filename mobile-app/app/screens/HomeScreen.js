import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Camera } from 'expo-camera';
import { FontAwesome } from '@expo/vector-icons'; // สามารถใช้ไอคอนจาก FontAwesome ได้

const HomeScreen = ({ navigation }) => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    const [stdid, setStdid] = useState('');
    const [name, setName] = useState('');
    const [cid, setCid] = useState('');
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

    // ใช้ useEffect เพื่อโหลดห้องเรียนเมื่อผู้ใช้เข้าสู่ระบบ
    useEffect(() => {
        if (user) {
            loadUserClassrooms(user.uid);
        }
    }, [user]);

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

    return (
        <View style={styles.container}>
            {/* ข้อมูลส่วนตัว */}
            <Text style={styles.header}>ข้อมูลส่วนตัว</Text>
            <Text style={styles.infoText}>รหัสนักศึกษา: {stdid}</Text>
            <Text style={styles.infoText}>ชื่อ: {name}</Text>

            {/* ห้องเรียนที่เข้าร่วม */}
            <Text style={styles.header}>ห้องเรียนที่คุณเข้าร่วม</Text>

            {classrooms.length === 0 ? (
                <Text style={styles.infoText}>คุณยังไม่ได้เข้าร่วมห้องเรียนใดๆ</Text>
            ) : (
        
                <FlatList
                data={classrooms}
                keyExtractor={(item) => item.cid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleClassroomClick(item.cid)}
                    style={styles.classCard}
                  >
                                <Image source={{ uri: item.imageURL }} style={styles.classroomImage} />
                                <View>
                      <Text style={styles.className}>{item.courseName} ({item.courseID})</Text>
                      <Text style={styles.roomName}>📍 ห้อง: {item.roomName}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* เพิ่มวิชา */}
            <TouchableOpacity style={styles.addClassButton} onPress={() => navigation.navigate('JoinClassScreen')}>
                <Text style={styles.addClassButtonText}>เพิ่มวิชา</Text>
            </TouchableOpacity>

            {/* ตรวจสอบสิทธิ์กล้อง */}
            {hasPermission === false ? (
                <Text style={styles.permissionText}>ไม่มีสิทธิ์เข้าถึงกล้อง</Text>
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => setScanning(true)}
                    >
                        <FontAwesome name="qrcode" size={24} color="white" />
                        <Text style={styles.scanButtonText}>Scan QR Code</Text>
                    </TouchableOpacity>

                    {scanning && hasPermission && (
                        <Camera
                            style={styles.camera}
                            type={Camera.Constants.Type.back}
                            onBarCodeScanned={({ type, data }) => {
                                setScanning(false);
                                setCid(data);
                                Alert.alert('สแกนสำเร็จ', `รหัสวิชา: ${data}`);
                            }}
                            ref={ref => setCameraRef(ref)}
                        >
                            <Text style={styles.scanningText}>Scanning...</Text>
                        </Camera>
                    )}
                </>
            )}

            {/* ปุ่ม Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

// สไตล์ของ UI
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 15,
        color: '#333',
    },
    infoText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    classroomCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        width: '100%',
    },
    courseName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    classroomText: {
        fontSize: 14,
        color: '#555',
    },
    classroomImage: {
        width: 100,
        height: 100,
        marginTop: 10,
        borderRadius: 8,
    },
    addClassButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    addClassButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scanButton: {
        backgroundColor: '#28a745',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    camera: {
        width: 300,
        height: 300,
        marginTop: 20,
    },
    scanningText: {
        color: 'white',
        textAlign: 'center',
        marginTop: 10,
    },
    permissionText: {
        color: 'red',
        marginTop: 20,
    },
    logoutButton: {
        backgroundColor: '#d9534f',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 30,
        width: '100%',
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
