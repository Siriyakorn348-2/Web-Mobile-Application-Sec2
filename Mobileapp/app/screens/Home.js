import React, { useState, useEffect } from "react";
import { View, Text, Button, TextInput, Alert, FlatList, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Camera } from "expo-camera";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, get, child } from "firebase/database";

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [cid, setCid] = useState(""); // รหัสวิชา
  const [stdid, setStdId] = useState(""); // รหัสนักศึกษา
  const [name, setName] = useState(""); // ชื่อ
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [classrooms, setClassrooms] = useState([]); // รายการวิชา
  const auth = getAuth();
  const db = getDatabase();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchClassrooms(currentUser.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchClassrooms = async (uid) => {
    const dbRef = ref(db, `/users/${uid}/classroom`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const classList = Object.keys(data).map((key) => ({
        id: key,
        status: data[key].status,
      }));
      setClassrooms(classList);
    }
  };

  const handleRegister = async () => {
    if (!cid || !stdid || !name) {
      Alert.alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const uid = user.uid;

    set(ref(db, `/classroom/${cid}/students/${uid}`), {
      stdid: stdid,
      name: name,
    });

    set(ref(db, `/users/${uid}/classroom/${cid}/status`), 2);

    Alert.alert("✅ ลงทะเบียนสำเร็จ!");
    fetchClassrooms(uid); // รีโหลดวิชาที่เพิ่มใหม่
  };

  const handleAddClassroom = async () => {
    if (!cid) {
      Alert.alert("กรุณากรอกรหัสวิชา");
      return;
    }

    const uid = user.uid;
    set(ref(db, `/users/${uid}/classroom/${cid}`), { status: 2 });

    Alert.alert("✅ เพิ่มวิชาสำเร็จ!");
    setModalVisible(false);
    fetchClassrooms(uid); // รีโหลดรายการวิชา
  };

  return (
    <View style={{ padding: 20 }}>
      {user ? (
        <>
          <Text>👤 ชื่อ: {user.displayName || "ไม่ระบุ"}</Text>
          <Text>📧 E-mail: {user.email}</Text>

          <FlatList
            data={classrooms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Text>📚 วิชา: {item.id} (สถานะ: {item.status})</Text>
            )}
          />

          <Button title="➕ เพิ่มวิชา" onPress={() => setModalVisible(true)} />
          <Button title="📷 สแกน QR Code" onPress={() => setScanning(true)} />

          {scanning && (
            <Camera
              style={{ width: 300, height: 300 }}
              onBarCodeScanned={({ type, data }) => {
                if (type === "qr") {
                  setCid(data);
                  setScanning(false);
                }
              }}
            />
          )}

          {/* Modal สำหรับเพิ่มวิชา */}
          <Modal visible={modalVisible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text>📌 กรอกรหัสวิชา</Text>
                <TextInput
                  style={styles.input}
                  placeholder="รหัสวิชา (CID)"
                  value={cid}
                  onChangeText={setCid}
                />
                <Button title="✅ เพิ่มวิชา" onPress={handleAddClassroom} />
                <Button title="❌ ปิด" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <Text>กรุณาเข้าสู่ระบบ</Text>
      )}
    </View>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: "center",
  },
};
