import React, { useEffect, useState } from "react";
import { View, Text, Image, TextInput, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";

const ClassroomPage = ({ route }) => {
  const { cid, cno } = route.params;
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [code, setCode] = useState("");
  const [isCodeCorrect, setIsCodeCorrect] = useState(false);
  const [stdid, setStdid] = useState("");
  const [name, setName] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchClassroomDetails = async () => {
      try {
        const classroomRef = doc(db, "classroom", cid);
        const classroomSnap = await getDoc(classroomRef);

        if (classroomSnap.exists()) {
          setClassroom(classroomSnap.data());
        }

        // ✅ โหลดสถานะการเช็คชื่อ
        const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
        const checkinSnap = await getDoc(checkinRef);

        if (checkinSnap.exists()) {
          setIsCheckInOpen(checkinSnap.data().isOpen);
        }
      } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการโหลดข้อมูลห้องเรียน:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomDetails();
  }, [cid, cno]);

  const handleCheckInPress = () => {
    if (!isCheckInOpen) {
      Alert.alert("🔴 การเช็คชื่อถูกปิดแล้ว!", "อาจารย์ได้ปิดการเช็คชื่อสำหรับวิชานี้แล้ว");
      return;
    }
    setShowCheckIn(true);
  };

  const verifyCheckInCode = async () => {
    if (!code) {
      Alert.alert("⚠️ กรุณากรอกรหัสเข้าเรียน");
      return;
    }

    try {
      const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
      const checkinSnap = await getDoc(checkinRef);

      if (!checkinSnap.exists()) {
        Alert.alert("❌ ไม่พบการเช็คชื่อในระบบ!");
        return;
      }

      if (!checkinSnap.data().isOpen) {
        Alert.alert("🔴 การเช็คชื่อถูกปิดแล้ว!");
        return;
      }

      const correctCode = checkinSnap.data().code;

      if (code !== correctCode) {
        Alert.alert("❌ รหัสเข้าเรียนไม่ถูกต้อง!");
        return;
      }

      Alert.alert("✅ รหัสถูกต้อง! กรุณากรอกข้อมูลของคุณ");
      setIsCodeCorrect(true);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการตรวจสอบรหัส:", error);
      Alert.alert("❌ ตรวจสอบรหัสไม่สำเร็จ");
    }
  };

  const handleCheckIn = async () => {
    if (!stdid || !name) {
      Alert.alert("⚠️ กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("⚠️ กรุณาเข้าสู่ระบบก่อนเช็คชื่อ");
        return;
      }

      const studentRef = doc(db, `classroom/${cid}/checkin/${cno}/students/${user.uid}`);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        Alert.alert("✅ คุณได้เช็คชื่อไปแล้ว!");
        setSaving(false);
        return;
      }

      const checkinData = {
        stdid,
        name,
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
      };

      await setDoc(studentRef, checkinData);

      Alert.alert("✅ เช็คชื่อสำเร็จ!", "คุณได้เช็คชื่อเรียบร้อยแล้ว");
      setShowCheckIn(false);
      setCode("");
      setIsCodeCorrect(false);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการเช็คชื่อ:", error);
      Alert.alert("❌ เช็คชื่อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#6a5acd" />;
  }

  if (!classroom) {
    return <Text style={styles.errorText}>⚠️ ไม่พบข้อมูลห้องเรียน</Text>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>⬅️ กลับ</Text>
      </TouchableOpacity>

      {classroom?.imageURL && <Image source={{ uri: classroom.imageURL }} style={styles.image} />}

      <Text style={styles.title}>{classroom.courseName}</Text>
      <Text style={styles.courseID}>📌 รหัสวิชา: {classroom.courseID}</Text>
      <Text style={styles.roomName}>📍 ห้อง: {classroom.roomName}</Text>

      {/* 🔹 ปุ่มเช็คชื่อแสดงตลอดเวลา */}
      <TouchableOpacity onPress={handleCheckInPress} style={styles.checkInButton}>
        <Text style={styles.checkInText}>✅ เช็คชื่อเข้าเรียน</Text>
      </TouchableOpacity>

      {showCheckIn && isCheckInOpen && (
        <>
          <Text style={styles.label}>🔑 รหัสเข้าเรียน</Text>
          <TextInput style={styles.input} value={code} onChangeText={setCode} secureTextEntry />
          <TouchableOpacity onPress={verifyCheckInCode} style={styles.confirmButton}>
            <Text style={styles.confirmText}>📌 ตรวจสอบรหัส</Text>
          </TouchableOpacity>

          {isCodeCorrect && (
            <>
              <Text style={styles.label}>🎓 รหัสนักศึกษา</Text>
              <TextInput style={styles.input} value={stdid} onChangeText={setStdid} />

              <Text style={styles.label}>📝 ชื่อ-นามสกุล</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />

              <TouchableOpacity onPress={handleCheckIn} style={styles.confirmButton} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>📌 ยืนยันเช็คชื่อ</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => setShowCheckIn(false)} style={styles.cancelButton}>
            <Text style={styles.cancelText}>❌ ยกเลิก</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff", alignItems: "center" },
  checkInButton: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, width: "100%", alignItems: "center", marginTop: 10 },
  checkInText: { fontSize: 18, color: "#fff", fontWeight: "bold" },
});

export default ClassroomPage;
