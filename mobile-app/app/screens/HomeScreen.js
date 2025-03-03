import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-camera';

const HomeScreen = () => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    const [stdid, setStdid] = useState('');
    const [name, setName] = useState('');
    const [cid, setCid] = useState('');
    const [hasPermission, setHasPermission] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [cameraRef, setCameraRef] = useState(null);

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

    // ขอสิทธิ์เข้าถึงกล้อง
    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    // ฟังก์ชันเพิ่มวิชาด้วยรหัส CID
    const handleAddClass = async () => {
        if (!cid) {
            Alert.alert('กรุณากรอกรหัสวิชา');
            return;
        }

        try {
            const classRef = doc(db, `classroom/${cid}/students`, user.uid);
            await setDoc(classRef, { stdid, name });

            const userClassRef = doc(db, `users/${user.uid}/classroom`, cid);
            await setDoc(userClassRef, { status: 2 });

            Alert.alert('ลงทะเบียนสำเร็จ!', `คุณได้เพิ่มวิชา ${cid} เรียบร้อยแล้ว`);
            setCid('');
        } catch (error) {
            Alert.alert('เกิดข้อผิดพลาด', error.message);
        }
    };

    // ฟังก์ชันสแกน QR Code
    const handleBarCodeScanned = ({ type, data }) => {
        if (type === BarCodeScanner.Constants.BarCodeType.qr) {
            setScanning(false);
            setCid(data); // ใช้ข้อมูลจาก QR Code เป็นรหัสวิชา
            Alert.alert('สแกนสำเร็จ', `รหัสวิชา: ${data}`);
        }
    };

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>ข้อมูลส่วนตัว</Text>
            <Text>รหัสนักศึกษา: {stdid}</Text>
            <Text>ชื่อ: {name}</Text>

            <TextInput
                style={{
                    borderWidth: 1, width: '80%', padding: 10, marginVertical: 10
                }}
                placeholder="กรอกรหัสวิชา (CID)"
                value={cid}
                onChangeText={setCid}
            />
            <Button title="เพิ่มวิชา" onPress={handleAddClass} />

            {hasPermission === false ? (
                <Text style={{ color: 'red', marginTop: 20 }}>ไม่มีสิทธิ์เข้าถึงกล้อง</Text>
            ) : (
                <>
                    <TouchableOpacity
                        style={{ marginTop: 20, padding: 10, backgroundColor: 'blue' }}
                        onPress={() => setScanning(true)}
                    >
                        <Text style={{ color: 'white' }}>Scan QR Code</Text>
                    </TouchableOpacity>

                    {scanning && hasPermission && (
                        <Camera
                            style={{ width: 300, height: 300, marginTop: 20 }}
                            type={Camera.Constants.Type.back}
                            onBarCodeScanned={handleBarCodeScanned}
                            ref={ref => setCameraRef(ref)}
                        >
                            <Text style={{ color: 'white', textAlign: 'center', marginTop: 10 }}>Scanning...</Text>
                        </Camera>
                    )}
                </>
            )}
        </View>
    );
};

export default HomeScreen;
