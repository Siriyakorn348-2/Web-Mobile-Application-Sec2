import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { getFirestore, doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import moment from 'moment';
import { MaterialIcons } from '@expo/vector-icons';

const ClassroomScreen = ({ route }) => {
    const { roomCode } = route.params;
    const [classroomData, setClassroomData] = useState(null);
    const [studentList, setStudentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [code, setCode] = useState('');
    const [isCodeCorrect, setIsCodeCorrect] = useState(false);
    const [stdid, setStdid] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        const fetchClassroomData = async () => {
            try {
                const ownerUid = await findClassroomOwner(roomCode);
                if (!ownerUid) {
                    console.error('ไม่พบเจ้าของห้องเรียน');
                    return;
                }

                // ดึงข้อมูลห้องเรียนจากโปรไฟล์ผู้ใช้
                const classroomRef = doc(db, `users/${ownerUid}/classroom`, roomCode); // แก้ไขตรงนี้
                const classroomSnap = await getDoc(classroomRef);
                if (classroomSnap.exists()) {
                    setClassroomData(classroomSnap.data());
                } else {
                    console.log('ไม่พบข้อมูลห้องเรียน');
                }

                // ดึงรายชื่อนักเรียนจากห้องเรียน
                const studentsRef = collection(db, `classroom/${roomCode}/students`);
                const studentsSnap = await getDocs(studentsRef);
                const students = studentsSnap.docs.map(doc => doc.data());
                setStudentList(students);
            } catch (error) {
                console.error('Error fetching classroom data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClassroomData();
    }, [roomCode]);

    const findClassroomOwner = async (code) => {
        try {
            const usersRef = collection(db, 'users');
            const usersSnap = await getDocs(usersRef);
            for (const userDoc of usersSnap.docs) {
                const ownerUid = userDoc.id;
                const classroomRef = doc(db, `users/${ownerUid}/classroom`, code); // แก้ไขตรงนี้
                const classroomSnap = await getDoc(classroomRef);
                if (classroomSnap.exists()) {
                    return ownerUid;
                }
            }
            return null;
        } catch (error) {
            console.error('Error finding classroom owner:', error);
            return null;
        }
    };

    const verifyCheckInCode = async () => {
        if (!code) {
            Alert.alert('⚠️ กรุณากรอกรหัสเข้าเรียน');
            return;
        }

        try {
            // ดึงข้อมูลรหัสเช็คชื่อจาก Firestore (สมมติว่ามี collection ชื่อ 'checkin' และ doc ชื่อ 'today')
            const checkinRef = doc(db, 'classroom', roomCode, 'checkin', 'today');
            const checkinSnap = await getDoc(checkinRef);

            if (!checkinSnap.exists()) {
                Alert.alert('❌ ไม่พบข้อมูลการเช็คชื่อในระบบ!');
                return;
            }

            const correctCode = checkinSnap.data().code;

            // ตรวจสอบรหัสเช็คชื่อ
            if (code !== correctCode) {
                Alert.alert('❌ รหัสเข้าเรียนไม่ถูกต้อง!');
                return;
            }

            setIsCodeCorrect(true);
            Alert.alert('✅ รหัสถูกต้อง! กรุณากรอกข้อมูลของคุณ');
        } catch (error) {
            Alert.alert('❌ ตรวจสอบรหัสไม่สำเร็จ');
        }
    };

    const handleCheckIn = async () => {
        if (!stdid || !name) {
            Alert.alert('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        try {
            if (!user) {
                Alert.alert('⚠️ กรุณาเข้าสู่ระบบก่อนเช็คชื่อ');
                return;
            }

            // บันทึกข้อมูลการเช็คชื่อลงใน Firestore (สมมติว่ามี collection ชื่อ 'students' ใน doc 'today')
            const studentRef = doc(db, 'classroom', roomCode, 'checkin', 'today', 'students', user.uid);
            const checkinData = {
                stdid,
                name,
                date: moment().format('YYYY-MM-DD HH:mm:ss'), // ใช้เวลาปัจจุบันจากระบบ
            };

            await setDoc(studentRef, checkinData);
            Alert.alert('✅ เช็คชื่อสำเร็จ!', 'คุณได้เช็คชื่อเรียบร้อยแล้ว');

            setShowCheckIn(false); // ซ่อนฟอร์มการเช็คชื่อหลังจากเช็คชื่อสำเร็จ
            setCode('');
            setIsCodeCorrect(false);
        } catch (error) {
            Alert.alert('❌ เช็คชื่อไม่สำเร็จ');
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#6a5acd" />;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                {classroomData && (
                    <View>
                        <Text style={styles.title}><MaterialIcons name="class" size={24} color="#3498db" /> ห้องเรียน: {classroomData?.courseName}</Text>
                        <Text style={styles.infoText}><MaterialIcons name="info" size={16} color="#555" /> สถานะ: {classroomData.status}</Text>
                        {/* เพิ่มข้อมูลอื่นๆ ของห้องเรียนที่ต้องการแสดง */}
                    </View>
                )}
            </View>

            <TouchableOpacity onPress={() => setShowCheckIn(true)} style={styles.checkInButton}>
                <Text style={styles.checkInText}><MaterialIcons name="check-circle" size={18} color="#fff" /> เช็คชื่อเข้าเรียน</Text>
            </TouchableOpacity>

            {showCheckIn && (
                <View style={styles.card}>
                    <Text style={styles.label}><MaterialIcons name="vpn-key" size={16} color="#333" /> รหัสเข้าเรียน</Text>
                    <TextInput style={styles.input} value={code} onChangeText={setCode} secureTextEntry />

                    <TouchableOpacity onPress={verifyCheckInCode} style={styles.confirmButton}>
                        <Text style={styles.confirmText}><MaterialIcons name="search" size={18} color="#fff" /> ตรวจสอบรหัส</Text>
                    </TouchableOpacity>

                    {isCodeCorrect && (
                        <>
                            <Text style={styles.label}><MaterialIcons name="school" size={16} color="#333" /> รหัสนักศึกษา</Text>
                            <TextInput style={styles.input} value={stdid} onChangeText={setStdid} />

                            <Text style={styles.label}><MaterialIcons name="person" size={16} color="#333" /> ชื่อ-นามสกุล</Text>
                            <TextInput style={styles.input} value={name} onChangeText={setName} />

                            <TouchableOpacity onPress={handleCheckIn} style={styles.confirmButton}>
                                <Text style={styles.confirmText}><MaterialIcons name="done" size={18} color="#fff" /> ยืนยันเช็คชื่อ</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}

            <View style={styles.card}>
                <Text style={styles.subtitle}><MaterialIcons name="people" size={20} color="#3498db" /> รายชื่อนักเรียน</Text>
                {studentList.map((student, index) => (
                    <View key={index} style={styles.studentCard}>
                        <Text style={styles.studentText}><MaterialIcons name="person-outline" size={16} color="#555" /> ชื่อ: {student.name}</Text>
                        <Text style={styles.studentText}><MaterialIcons name="badge" size={16} color="#555" /> รหัสนักศึกษา: {student.stid}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    card: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.23, shadowRadius: 2.62, elevation: 4 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#3498db', marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: 16, color: '#555', marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    subtitle: { fontSize: 20, fontWeight: 'bold', color: '#3498db', marginTop: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    studentCard: { backgroundColor: '#e0f7fa', padding: 15, marginBottom: 10, borderRadius: 8 },
    studentText: { fontSize: 16, color: '#555', marginBottom: 5, flexDirection: 'row', alignItems: 'center' },
    checkInButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    checkInText: { fontSize: 18, color: '#fff', fontWeight: 'bold', flexDirection: 'row', alignItems: 'center' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, backgroundColor: '#fff' },
    label: { fontSize: 16, color: '#333', marginBottom: 5, flexDirection: 'row', alignItems: 'center' },
    confirmButton: { backgroundColor: '#6a5acd', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    confirmText: { fontSize: 18, color: '#fff', fontWeight: 'bold', flexDirection: 'row', alignItems: 'center' },
});

export default ClassroomScreen;

