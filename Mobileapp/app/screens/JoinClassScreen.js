import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { getDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";

const JoinClassScreen = ({ navigation }) => {
  const [cid, setCid] = useState("");

  const handleJoinClass = async () => {
    if (!cid.trim()) {
      Alert.alert("⚠️ ข้อผิดพลาด", "กรุณากรอกรหัสห้องเรียน");
      return;
    }

    try {
      const classRef = doc(db, "classroom", cid); // ใช้ cid แทน courseID
      const classSnap = await getDoc(classRef);

      if (!classSnap.exists()) {
        Alert.alert("❌ ไม่พบห้องเรียน", "กรุณาตรวจสอบรหัส CID แล้วลองอีกครั้ง");
        return;
      }

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        classes: arrayUnion(cid),
      });

      Alert.alert("✅ เข้าร่วมสำเร็จ", "คุณได้เข้าห้องเรียนเรียบร้อยแล้ว!");
      navigation.goBack();
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
      Alert.alert("❌ เกิดข้อผิดพลาด", "โปรดลองอีกครั้งในภายหลัง");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>กรอกรหัสห้องเรียน (CID)</Text>
      <TextInput
        style={styles.input}
        placeholder="ตัวอย่าง: ABC123"
        value={cid}
        onChangeText={setCid}
      />
      <Button title="เข้าร่วมห้องเรียน" onPress={handleJoinClass} color="#5A67D8" />
      <Button title="กลับ" onPress={() => navigation.goBack()} color="#A0AEC0" />
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
