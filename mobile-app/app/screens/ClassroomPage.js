import React, { useEffect, useState } from "react";
import { View, Text, Image, TextInput, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { FontAwesome } from '@expo/vector-icons';

const ClassroomPage = ({ route }) => {
  const { cid, cno: initialCno } = route?.params || {};
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [code, setCode] = useState("");
  const [isCodeCorrect, setIsCodeCorrect] = useState(false);
  const [stdid, setStdid] = useState("");
  const [name, setName] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [cno, setCno] = useState(initialCno);
  const navigation = useNavigation();

  useEffect(() => {
    console.log("Initial cid:", cid, "cno:", cno);
    const fetchLatestCheckIn = async () => {
      if (!cid || cno) return;
      try {
        const checkinCollection = collection(db, `classroom/${cid}/checkin`);
        const checkinSnapshot = await getDocs(checkinCollection);
        if (!checkinSnapshot.empty) {
          const latestCheckIn = checkinSnapshot.docs[0].id;
          console.log("Fetched latest cno:", latestCheckIn);
          setCno(latestCheckIn);
          navigation.setParams({ cno: latestCheckIn });
        } else {
          console.log("No check-in found for cid:", cid);
          setIsCheckInOpen(false);
        }
      } catch (error) {
        console.error("Error fetching check-in:", error);
        Alert.alert("❌ ไม่สามารถดึงข้อมูลการเช็คชื่อล่าสุดได้");
      }
    };
    fetchLatestCheckIn();
  }, [cid, cno, navigation]);

  useEffect(() => {
    if (!cno) return;
    console.log("Starting fetchClassroomDetails with cid:", cid, "cno:", cno);
    const fetchClassroomDetails = async () => {
      try {
        if (!cid || !cno) {
          console.error("Missing cid or cno:", { cid, cno });
          Alert.alert("❌ ข้อมูลห้องเรียนไม่ครบถ้วน");
          setClassroom({
            courseName: "ไม่มีชื่อวิชา",
            courseID: "ไม่มีรหัสวิชา",
            roomName: "ไม่มีห้อง",
            imageURL: null,
          });
          setIsCheckInOpen(false);
          return;
        }

        const classroomRef = doc(db, "classroom", cid);
        const classroomSnap = await getDoc(classroomRef);
        console.log("Classroom Snap exists:", classroomSnap.exists());
        if (classroomSnap.exists()) {
          const data = classroomSnap.data() || {};
          console.log("Classroom Data:", data);
          setClassroom({
            courseName: data.courseName || "ไม่มีชื่อวิชา",
            courseID: data.courseID || "ไม่มีรหัสวิชา",
            roomName: data.roomName || "ไม่มีห้อง",
            imageURL: data.imageURL || null,
          });
        } else {
          console.log("No classroom document found for cid:", cid);
          setClassroom({
            courseName: "ไม่มีชื่อวิชา",
            courseID: "ไม่มีรหัสวิชา",
            roomName: "ไม่มีห้อง",
            imageURL: null,
          });
        }

        const checkinRef = doc(db, "classroom", cid, "checkin", cno);
        console.log("Setting up checkin listener for path:", `classroom/${cid}/checkin/${cno}`);
        const unsubscribe = onSnapshot(checkinRef, (checkinSnap) => {
          console.log("Checkin Snap exists:", checkinSnap.exists());
          if (checkinSnap.exists()) {
            const checkinData = checkinSnap.data() || {};
            console.log("Checkin Data:", checkinData);
            setIsCheckInOpen(checkinData.isOpen ?? false);
          } else {
            console.log("No checkin document found for cid:", cid, "cno:", cno);
            setIsCheckInOpen(false);
          }
        }, (error) => {
          console.error("Checkin onSnapshot Error:", error);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("❌ Error loading classroom:", error);
        Alert.alert("❌ เกิดข้อผิดพลาดในการโหลดข้อมูลห้องเรียน");
      } finally {
        setLoading(false);
      }
    };
    fetchClassroomDetails();
  }, [cid, cno]);

  useEffect(() => {
    setMessage(isCheckInOpen ? "" : "🔴 การเช็คชื่อถูกปิดแล้วโดยอาจารย์");
  }, [isCheckInOpen]);

  const handleCheckInPress = () => {
    if (!isCheckInOpen) return;
    setShowCheckIn(true);
    setMessage("");
  };

  const verifyCheckInCode = async () => {
    if (!code) return Alert.alert("⚠️ กรุณากรอกรหัสเข้าเรียน");
    if (!cid || !cno) return Alert.alert("❌ ข้อมูลห้องเรียนไม่ครบถ้วน");
    try {
      const checkinRef = doc(db, "classroom", cid, "checkin", cno);
      console.log("Fetching checkin data for path:", `classroom/${cid}/checkin/${cno}`);
      const checkinSnap = await getDoc(checkinRef);
      console.log("Verify Check-In Snap exists:", checkinSnap.exists());
      if (!checkinSnap.exists()) {
        return Alert.alert("🔴 ไม่พบข้อมูลการเช็คชื่อ!");
      }
      const checkinData = checkinSnap.data() || {};
      console.log("Verify Check-In Data:", checkinData);

      const isOpen = checkinData.isOpen ?? false;
      const correctCode = checkinData.code;

      if (!isOpen) {
        return Alert.alert("🔴 การเช็คชื่อถูกปิดแล้ว!");
      }
      if (correctCode === undefined || correctCode === null) {
        return Alert.alert("❌ ไม่พบรหัสเข้าเรียนในระบบ!");
      }

      const enteredCode = String(code).toUpperCase();
      const expectedCode = String(correctCode).toUpperCase();
      console.log("Entered Code:", enteredCode, "Expected Code:", expectedCode);

      if (enteredCode !== expectedCode) {
        return Alert.alert("❌ รหัสเข้าเรียนไม่ถูกต้อง!");
      }

      setIsCodeCorrect(true);
      Alert.alert("✅ รหัสถูกต้อง!");
    } catch (error) {
      console.error("Verify Check-In Error:", error);
      Alert.alert("❌ เกิดข้อผิดพลาดในการตรวจสอบรหัส");
    }
  };

  const handleCheckIn = async () => {
    if (!stdid || !name) return Alert.alert("⚠️ กรุณากรอกข้อมูลให้ครบถ้วน");
    if (!cid || !cno) return Alert.alert("❌ ข้อมูลห้องเรียนไม่ครบถ้วน");
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return Alert.alert("⚠️ กรุณาเข้าสู่ระบบ");
      const studentRef = doc(db, "classroom", cid, "checkin", cno, "students", user.uid);
      const checkinData = {
        stdid,
        name,
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await setDoc(studentRef, checkinData);
      Alert.alert("✅ เช็คชื่อสำเร็จ!");
      setShowCheckIn(false);
      setCode("");
      setIsCodeCorrect(false);
      setStdid("");
      setName("");
    } catch (error) {
      Alert.alert("❌ เกิดข้อผิดพลาดในการเช็คชื่อ");
      console.error("Check-In Error:", error);
    } finally {
      setSaving(false);
    }
  };

  // ฟังก์ชันสำหรับลิงก์ไป StudentQAPage
  const handleGoToQAPage = () => {
    if (!cid || !cno) {
      Alert.alert("❌ ข้อมูลห้องเรียนไม่ครบถ้วน");
      return;
    }
    navigation.navigate("StudentQAPage", { cid, cno });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        {classroom?.imageURL ? (
          <Image source={{ uri: classroom.imageURL }} style={styles.classImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <FontAwesome name="image" size={50} color="#ccc" />
          </View>
        )}
        <Text style={styles.title}>{classroom?.courseName || "ไม่มีชื่อวิชา"}</Text>
        <View style={styles.infoRow}>
          <FontAwesome name="tag" size={16} color="#777" />
          <Text style={styles.subtitle}> {classroom?.courseID || "ไม่มีรหัสวิชา"}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="map-marker" size={16} color="#777" />
          <Text style={styles.subtitle}> {classroom?.roomName || "ไม่มีห้อง"}</Text>
        </View>
      </View>

      {message && (
        <View style={styles.warningCard}>
          <FontAwesome name="exclamation-triangle" size={20} color="#d9534f" />
          <Text style={styles.warningText}>{message}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.checkInButton, !isCheckInOpen && styles.disabledButton]}
        onPress={handleCheckInPress}
        disabled={!isCheckInOpen}
      >
        <FontAwesome name="check" size={20} color="#fff" />
        <Text style={styles.buttonText}>เช็คชื่อเข้าเรียน</Text>
      </TouchableOpacity>

      {/* ปุ่มใหม่สำหรับไปหน้า StudentQAPage */}
      <TouchableOpacity
        style={styles.qaButton}
        onPress={handleGoToQAPage}
      >
        <FontAwesome name="question-circle" size={20} color="#fff" />
        <Text style={styles.buttonText}>ไปที่หน้าตอบคำถาม</Text>
      </TouchableOpacity>

      {showCheckIn && isCheckInOpen && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>กรอกข้อมูลเพื่อเช็คชื่อ</Text>

          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="รหัสเข้าเรียน (6 ตัวอักษร/ตัวเลข)"
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase().slice(0, 6))}
              keyboardType="default"
              maxLength={6}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity
            style={[styles.actionButton, saving && styles.disabledButton]}
            onPress={verifyCheckInCode}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>ตรวจสอบรหัส</Text>
            )}
          </TouchableOpacity>

          {isCodeCorrect && (
            <>
              <View style={styles.inputContainer}>
                <FontAwesome name="id-card" size={20} color="#555" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="รหัสนักศึกษา"
                  value={stdid}
                  onChangeText={(text) => setStdid(text.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputContainer}>
                <FontAwesome name="user" size={20} color="#555" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ชื่อ-นามสกุล"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity
                style={[styles.actionButton, saving && styles.disabledButton]}
                onPress={handleCheckIn}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>ยืนยันเช็คชื่อ</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007BFF',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  classImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginLeft: 5,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d9534f',
  },
  warningText: {
    fontSize: 14,
    color: '#d9534f',
    marginLeft: 10,
    flex: 1,
  },
  checkInButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15, // เพิ่มระยะห่างจากปุ่ม QA
  },
  qaButton: {
    flexDirection: 'row',
    backgroundColor: '#FF5733', // สีส้มเพื่อแยกจากปุ่มเช็คชื่อ
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ClassroomPage;