import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, StyleSheet, ScrollView, Image } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
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

    // ฟังก์ชันแยก roomCode จาก URL
    const extractRoomCode = (input) => {
        if (!input) return '';
        // ถ้าเป็น URL ให้แยกส่วน ID ออกมา (เช่น XsHJAYqUB07ExSaaeGAq จาก https://yourapp.com/courses/XsHJAYqUB07ExSaaeGAq)
        const match = input.match(/courses\/([^/]+)/);
        return match ? match[1] : input.trim(); // คืนค่า ID หรือ input เดิมถ้าไม่ใช่ URL
    };

    const fetchClassroomDetails = async (roomCode) => {
        try {
            const cleanedRoomCode = extractRoomCode(roomCode);
            const ownerUid = await findClassroomOwner(cleanedRoomCode);
            console.log(`Fetching details for room: ${cleanedRoomCode}, Owner UID: ${ownerUid}`);
            if (ownerUid) {
                const classroomRef = doc(db, `users/${ownerUid}/classroom`, cleanedRoomCode);
                const classroomSnap = await getDoc(classroomRef);
                if (classroomSnap.exists()) {
                    const data = classroomSnap.data();
                    console.log(`Data for ${cleanedRoomCode}:`, data);
                    setClassroomDetails(prev => ({
                        ...prev,
                        [cleanedRoomCode]: {
                            courseID: data.courseID,
                            courseName: data.courseName,
                            img: data.img,
                            owner: data.owner,
                            roomName: data.roomName
                        }
                    }));
                } else {
                    console.log(`No data found for room ${cleanedRoomCode}`);
                }
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
                const roomsRef = collection(db, `users/${user.uid}/classroom`);
                const roomsSnap = await getDocs(roomsRef);
                const roomsList = roomsSnap.docs.map(doc => doc.id);
                console.log('Registered rooms:', roomsList);
                setRegisteredRooms(roomsList);
                if (roomsList.length > 0) {
                    await Promise.all(roomsList.map(room => {
                        if (room && room.trim() !== '') {
                            return fetchClassroomDetails(room);
                        }
                        return null;
                    }));
                }
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
            const ownerUid = await findClassroomOwner(cleanedRoomCode);
            if (!ownerUid) {
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
            const ownerUid = await findClassroomOwner(scannedRoomCode);
            if (!ownerUid) {
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
                navigation.navigate('Classroom', { roomCode });
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
            setRegisteredRooms(prev => [...prev, roomCode]);
            setRoomCode('');
            navigation.navigate('Classroom', { roomCode });
        } catch (error) {
            console.error('Confirm registration error:', error.message);
            Alert.alert('❌ เกิดข้อผิดพลาด', 'โปรดลองอีกครั้งในภายหลัง');
        }
    };

    const navigateToClassroom = (roomCode) => {
        navigation.navigate('Classroom', { roomCode });
    };

    const findClassroomOwner = async (code) => {
        try {
            const usersRef = collection(db, 'users');
            const usersSnap = await getDocs(usersRef);
            for (const userDoc of usersSnap.docs) {
                const ownerUid = userDoc.id;
                const classroomRef = doc(db, `users/${ownerUid}/classroom`, code);
                const classroomSnap = await getDoc(classroomRef);
                if (classroomSnap.exists()) {
                    return ownerUid;
                }
            }
            console.log(`No owner found for room code: ${code}`);
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
                    </View>
                    <View style={styles.cardContent}>
                        <Image source={{ uri: userData?.photo }} style={styles.profileImage} />
                        <Text style={styles.infoText}>รหัสนักศึกษา: {userData?.stid || '-'}</Text>
                        <Text style={styles.infoText}>ชื่อ: {userData?.name || '-'}</Text>
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
                            <Text style={styles.buttonText}>เปิดสแกนเนอร์</Text>
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
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.registeredRoomItem}
                                        onPress={() => navigateToClassroom(room)}
                                    >
                                        {details.img && (
                                            <Image
                                                source={{ uri: details.img }}
                                                style={styles.roomImage}
                                            />
                                        )}
                                        <View style={styles.roomTextContainer}>
                                            <Text style={styles.infoText}>
                                                {details.courseName || 'ไม่ระบุชื่อวิชา'}
                                            </Text>
                                            <Text style={styles.infoText}>
                                                รหัสวิชา: {details.courseID || '-'}
                                            </Text>
                                            <Text style={styles.infoText}>
                                                ห้อง: {details.roomName || '-'}
                                            </Text>
                                            <Text style={styles.infoText}>
                                                อาจารย์: {details.owner || '-'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
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
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    registeredRoomItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
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
});

export default HomeScreen;