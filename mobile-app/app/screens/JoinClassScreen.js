import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { getDoc, doc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

const JoinClassScreen = ({ navigation }) => {
  const [cid, setCid] = useState(""); 
  const [studentID, setStudentID] = useState(""); 
  const [studentName, setStudentName] = useState("");
  const [isValidClass, setIsValidClass] = useState(false);  // สถานะการตรวจสอบ CID

  const handleJoinClass = async () => {
    if (!cid.trim()) {
        Alert.alert("⚠️ ข้อผิดพลาด", "กรุณากรอกรหัสห้องเรียน");
        return;
    }

    if (!auth.currentUser) {
        Alert.alert("⚠️ ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อนเข้าร่วมห้องเรียน");
        return;
    }

    console.log("กำลังตรวจสอบห้องเรียน:", cid);
    console.log("UID ของผู้ใช้:", auth.currentUser.uid);

    try {
        // ตรวจสอบว่า `cid` เป็น string และมีข้อมูล
        if (typeof cid !== "string" || cid.trim() === "") {
            throw new Error("รหัสห้องเรียนไม่ถูกต้อง");
        }

        const classRef = doc(db, "classroom", cid);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
            Alert.alert("❌ ไม่พบห้องเรียน", "กรุณาตรวจสอบรหัส CID แล้วลองอีกครั้ง");
            setIsValidClass(false); // ถ้าห้องเรียนไม่พบ ให้ตั้งค่าเป็น false
            return;
        }

        console.log("ห้องเรียนมีอยู่จริง กำลังเพิ่มข้อมูลผู้ใช้...");
        setIsValidClass(true); // ถ้าห้องเรียนมีอยู่ ให้ตั้งค่าเป็น true

    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
        Alert.alert("❌ เกิดข้อผิดพลาด", "โปรดลองอีกครั้งในภายหลัง");
    }
};

  const handleRegisterStudent = async () => {
    if (!studentID.trim() || !studentName.trim()) {
      Alert.alert("⚠️ ข้อผิดพลาด", "กรุณากรอกรหัสนักศึกษาและชื่อ-สกุล");
      return;
    }
  
    try {
      // เพิ่มห้องเรียนในโปรไฟล์ผู้ใช้
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        classes: arrayUnion(cid),
      });
  
      // เพิ่มข้อมูลนักเรียนลงในห้องเรียน พร้อมกับสถานะ
      const studentRef = doc(db, `classroom/${cid}/students/${auth.currentUser.uid}`);
      await setDoc(studentRef, {
        stdid: studentID,
        name: studentName,
        status: 2, // เพิ่มสถานะในข้อมูลของนักเรียน
      }, { merge: true });
  
      // บันทึกสถานะของนักเรียนในห้องเรียนในอีกเส้นทางหนึ่ง (หากจำเป็น)
      const statusRef = doc(db, `users/${auth.currentUser.uid}/classroom/${cid}`);
      await setDoc(statusRef, {
        status: 2,
      }, { merge: true });
  
      console.log("✅ อัปเดตสำเร็จ! ผู้ใช้เข้าร่วมห้องเรียนแล้ว");
      Alert.alert("✅ เข้าร่วมสำเร็จ", "คุณได้เข้าห้องเรียนเรียบร้อยแล้ว!");
      navigation.goBack();
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
      Alert.alert("❌ เกิดข้อผิดพลาด", "โปรดลองอีกครั้งในภายหลัง");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>กรอกรหัสห้องเรียน</Text>
      <TextInput
        style={styles.input}
        value={cid}
        onChangeText={setCid}
        placeholder="รหัสห้องเรียน"
      />
      <Button title="ตรวจสอบห้องเรียน" onPress={handleJoinClass} />

      {/* แสดงฟอร์มกรอกข้อมูลนักศึกษาเมื่อ CID ถูกต้อง */}
      {isValidClass && (
        <>
          <Text style={styles.label}>กรอกรหัสนักศึกษา</Text>
          <TextInput
            style={styles.input}
            value={studentID}
            onChangeText={setStudentID}
            placeholder="รหัสนักศึกษา"
          />
          
          <Text style={styles.label}>กรอกชื่อ-สกุล</Text>
          <TextInput
            style={styles.input}
            value={studentName}
            onChangeText={setStudentName}
            placeholder="ชื่อ-สกุล"
          />
          
          <Button title="ลงทะเบียนเข้าร่วมห้องเรียน" onPress={handleRegisterStudent} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F6F0FF",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "80%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#A0AEC0",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
});

export default JoinClassScreen;
