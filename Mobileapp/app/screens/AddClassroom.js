import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { getAuth } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

const AddClassroom = () => {
  const [classID, setClassID] = useState("");
  const [error, setError] = useState("");
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  const handleAddClass = async () => {
    const user = auth.currentUser;
    if (user) {
      // ตรวจสอบว่าห้องเรียนมีอยู่ในฐานข้อมูลหรือไม่
      const classroomRef = doc(db, "classroom", classID);
      const classroomDoc = await getDoc(classroomRef);

      if (classroomDoc.exists()) {
        // ห้องเรียนมีอยู่แล้ว ทำการลงทะเบียนเข้าร่วม
        await setDoc(
          doc(db, "classroom", classID, "students", user.uid),
          {
            stdid: user.uid,  // รหัสนักศึกษา (UID ของผู้ใช้)
            name: user.displayName || "Unknown",
            status: 0,  // สถานะ 0 คือยังไม่ตรวจสอบ
          },
          { merge: true }
        );

        // เพิ่มสถานะในข้อมูลของผู้ใช้
        await setDoc(
          doc(db, "users", user.uid, "classroom", classID),
          {
            status: 2,  // สถานะ 2 คือเป็นนักเรียนในวิชา
          },
          { merge: true }
        );

        Alert.alert("สำเร็จ", "คุณได้ลงทะเบียนเข้าร่วมวิชาแล้ว!");
        navigation.navigate("Home");  // เปลี่ยนเป็นหน้าหลักหลังลงทะเบียนเสร็จ
      } else {
        setError("ไม่พบรหัสวิชานี้ในระบบ!");
      }
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Class Code (รหัสวิชา)"
        value={classID}
        onChangeText={setClassID}
      />
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      <Button title="ลงทะเบียนวิชา" onPress={handleAddClass} />
    </View>
  );
};

export default AddClassroom;