import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, SafeAreaView, StatusBar, Dimensions } from 'react-native';
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
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
            <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>ข้อมูลส่วนตัว</Text>
                <Text>รหัสนักศึกษา: {userData?.stid || '-'}</Text>
                <Text>ชื่อ: {userData?.name || '-'}</Text>

                <TextInput
                    style={{ borderWidth: 1, width: '80%', padding: 10, marginVertical: 10 }}
                    placeholder="กรอกรหัสห้อง"
                    value={roomCode}
                    onChangeText={setRoomCode}
                />
                <TouchableOpacity
                    style={{ backgroundColor: 'blue', padding: 10, borderRadius: 5 }}
                    onPress={handleRegisterWithCode}
                >
                    <Text style={{ color: 'white' }}>ลงทะเบียนด้วยรหัสห้อง</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ marginTop: 20, padding: 10, backgroundColor: 'green', borderRadius: 5 }}
                    onPress={startScanning}
                >
                    <Text style={{ color: 'white' }}>สแกน QR Code</Text>
                </TouchableOpacity>
            </View>

            {scanning && permission?.granted && (
                <View style={{ flex: 1 }}>
                    <StatusBar barStyle="light-content" backgroundColor="#000000" />
                    <CameraView
                        style={{ flex: 1 }}
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    />
                    <TouchableOpacity
                        style={{ position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'red', padding: 10, borderRadius: 5 }}
                        onPress={() => setScanning(false)}
                    >
                        <Text style={{ color: 'white' }}>ยกเลิก</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

export default HomeScreen;