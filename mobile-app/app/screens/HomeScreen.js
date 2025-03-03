import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    const [userData, setUserData] = useState(null);
    const [roomCode, setRoomCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
            }
        };
        fetchUserData();
    }, [user]);

    const registerRoomCode = async (code) => {
        if (code.trim() === '') {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัสห้อง');
            return;
        }
        try {
            let foundOwner = null;
            const usersRef = collection(db, 'users');
            const usersSnap = await getDocs(usersRef);
            for (const userDoc of usersSnap.docs) {
                const ownerUid = userDoc.id;
                const classroomRef = doc(db, `users/${ownerUid}/classroom`, code);
                const classroomSnap = await getDoc(classroomRef);
                if (classroomSnap.exists()) {
                    foundOwner = ownerUid;
                    break;
                }
            }
            if (!foundOwner) {
                Alert.alert('ไม่พบรหัสห้อง', 'กรุณาตรวจสอบรหัสห้องอีกครั้ง');
                return;
            }
            await setDoc(
                doc(db, `users/${foundOwner}/classroom/${code}/students`, user.uid),
                {
                    uid: user.uid,
                    stid: userData?.stid || '',
                    name: userData?.name || '',
                    email: userData?.email || '',
                    phone: userData?.phone || '',
                    status: 0,
                }
            );
            Alert.alert('ลงทะเบียนสำเร็จ', `ลงทะเบียนเข้าห้อง ${code} เรียบร้อยแล้ว`);
        } catch (error) {
            console.error('Register with code error:', error);
            Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลงทะเบียนได้');
        }
    };

    const handleRegisterWithCode = async () => {
        await registerRoomCode(roomCode);
        setRoomCode('');
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        setScanned(true);
        setScanning(false);
        await registerRoomCode(data);
    };

    const startScanning = async () => {
        const { granted } = await requestPermission();
        if (granted) {
            setScanning(true);
            setScanned(false);
        } else {
            Alert.alert(
                'ไม่ได้รับอนุญาตให้ใช้กล้อง',
                'กรุณาอนุญาตให้แอพเข้าถึงกล้องในการตั้งค่า'
            );
        }
    };

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
                        <TouchableOpacity style={styles.button} onPress={handleRegisterWithCode}>
                            <Text style={styles.buttonText}>ลงทะเบียน</Text>
                        </TouchableOpacity>
                    </View>
                </View>

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
});

export default HomeScreen;