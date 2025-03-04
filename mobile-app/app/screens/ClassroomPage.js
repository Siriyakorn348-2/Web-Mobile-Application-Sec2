import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { FontAwesome } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from 'expo-camera';

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
  const [remark, setRemark] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [cno, setCno] = useState(initialCno);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showRemarkForm, setShowRemarkForm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();

  // Fetch latest check-in
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

  // Fetch classroom details and check-in status
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
        const unsubscribe = onSnapshot(
          checkinRef,
          (checkinSnap) => {
            console.log("Checkin Snap exists:", checkinSnap.exists());
            if (checkinSnap.exists()) {
              const checkinData = checkinSnap.data() || {};
              console.log("Checkin Data:", checkinData);
              setIsCheckInOpen(checkinData.isOpen ?? false);
            } else {
              console.log("No checkin document found for cid:", cid, "cno:", cno);
              setIsCheckInOpen(false);
            }
          },
          (error) => {
            console.error("Checkin onSnapshot Error:", error);
          }
        );

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

  // Fetch existing remark
  useEffect(() => {
    const fetchRemark = async () => {
      if (cid && cno && auth.currentUser) {
        const remarkRef = doc(db, `classroom/${cid}/checkin/${cno}/students/${auth.currentUser.uid}`);
        const remarkSnap = await getDoc(remarkRef);
        if (remarkSnap.exists()) {
          setRemark(remarkSnap.data().remark || "");
        }
      }
    };
    fetchRemark();
  }, [cid, cno]);

  useEffect(() => {
    setMessage(isCheckInOpen ? "" : "🔴 การเช็คชื่อถูกปิดแล้วโดยอาจารย์");
  }, [isCheckInOpen]);

  const handleCheckInPress = () => {
    if (!isCheckInOpen) return;
    setShowCheckIn(true);
    setMessage("");
    setScanned(false); // รีเซ็ตสถานะการสแกนเมื่อเปิดฟอร์มใหม่
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
      await setDoc(studentRef, checkinData, { merge: true });
      Alert.alert("✅ เช็คชื่อสำเร็จ!");
      setShowCheckIn(false);
      setCode("");
      setIsCodeCorrect(false);
      setStdid("");
      setName("");
      setIsCheckedIn(true);
    } catch (error) {
      Alert.alert("❌ เกิดข้อผิดพลาดในการเช็คชื่อ");
      console.error("Check-In Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRemark = async () => {
    if (!cid || !cno || !auth.currentUser) {
      Alert.alert("❌ ข้อมูลไม่ครบถ้วนหรือยังไม่ได้เข้าสู่ระบบ");
      return;
    }
    setSaving(true);
    try {
      const remarkRef = doc(db, `classroom/${cid}/checkin/${cno}/students/${auth.currentUser.uid}`);
      await setDoc(
        remarkRef,
        {
          remark: remark,
          updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
        { merge: true }
      );
      Alert.alert("✅ บันทึกหมายเหตุสำเร็จ!");
      setShowRemarkForm(false);
    } catch (error) {
      console.error("Error saving remark:", error);
      Alert.alert("❌ เกิดข้อผิดพลาดในการบันทึกหมายเหตุ");
    } finally {
      setSaving(false);
    }
  };

  const handleGoToQAPage = () => {
    if (!cid || !cno) {
      Alert.alert("❌ ข้อมูลห้องเรียนไม่ครบถ้วน");
      return;
    }
    console.log("Navigating to StudentQAPage with cid:", cid, "cno:", cno);
    navigation.navigate("StudentQAPage", { cid, cno });
  };

  const startScanning = async () => {
    if (!permission) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้แอพเข้าถึงกล้องในการตั้งค่า');
        return;
      }
    } else if (!permission.granted) {
      Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาอนุญาตให้แอพเข้าถึงกล้องในการตั้งค่า');
      return;
    }
    setScanning(true);
    setScanned(false);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return; // ป้องกันการสแกนซ้ำ
    setScanned(true);
    setScanning(false);

    try {
      if (!cid || !cno) {
        Alert.alert("❌ ข้อมูลห้องเรียนไม่ครบถ้วน");
        return;
      }

      const checkinRef = doc(db, "classroom", cid, "checkin", cno);
      const checkinSnap = await getDoc(checkinRef);
      if (!checkinSnap.exists()) {
        Alert.alert("🔴 ไม่พบข้อมูลการเช็คชื่อ!");
        return;
      }

      const checkinData = checkinSnap.data();
      if (!checkinData.isOpen) {
        Alert.alert("🔴 การเช็คชื่อถูกปิดแล้ว!");
        return;
      }

      const correctCode = String(checkinData.code || "").toUpperCase();
      const scannedCode = String(data).toUpperCase();

      console.log("Scanned Code:", scannedCode, "Expected Code:", correctCode);

      if (!correctCode) {
        Alert.alert("❌ ไม่พบรหัสเข้าเรียนในระบบ!");
        return;
      }

      if (scannedCode === correctCode) {
        setCode(scannedCode);
        setIsCodeCorrect(true);
        Alert.alert("✅ สแกน QR Code สำเร็จ", "รหัสถูกต้อง!");
      } else {
        Alert.alert("❌ รหัสไม่ถูกต้อง", "รหัสจาก QR Code ไม่ตรงกับรหัสเข้าเรียน");
        setCode(""); // รีเซ็ต code หากไม่ถูกต้อง
      }
    } catch (error) {
      console.error("QR Code scan error:", error);
      Alert.alert("❌ เกิดข้อผิดพลาด", "ไม่สามารถประมวลผล QR Code ได้");
    }
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
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
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

          {remark ? (
            <View style={styles.remarkContainer}>
              <Text style={styles.remarkText}>
                <Text style={styles.boldText}>หมายเหตุ: </Text>
                {remark}
              </Text>
            </View>
          ) : (
            <Text style={styles.noRemarkText}>ยังไม่มีหมายเหตุ</Text>
          )}
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

        <TouchableOpacity style={styles.qaButton} onPress={handleGoToQAPage}>
          <FontAwesome name="question-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>ไปที่หน้าตอบคำถาม</Text>
        </TouchableOpacity>

        {isCheckedIn && (
          <TouchableOpacity
            style={styles.remarkButton}
            onPress={() => setShowRemarkForm(true)}
          >
            <FontAwesome name="comment" size={20} color="#fff" />
            <Text style={styles.buttonText}>เพิ่ม/แก้ไขหมายเหตุ</Text>
          </TouchableOpacity>
        )}

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
                editable={!isCodeCorrect}
              />
            </View>
            {!isCodeCorrect && (
              <>
                <TouchableOpacity
                  style={[styles.qrButton, saving && styles.disabledButton]}
                  onPress={startScanning}
                  disabled={saving || scanning}
                >
                  {scanning ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <FontAwesome name="qrcode" size={20} color="#fff" />
                      <Text style={styles.buttonText}>สแกน QR Code</Text>
                    </>
                  )}
                </TouchableOpacity>
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
              </>
            )}
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

        {showRemarkForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>เพิ่ม/แก้ไขหมายเหตุ</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="comment" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="กรอกหมายเหตุของคุณที่นี่"
                value={remark}
                onChangeText={setRemark}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, saving && styles.disabledButton]}
              onPress={handleSaveRemark}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>บันทึกหมายเหตุ</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {scanning && permission?.granted && (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setScanning(false);
                setScanned(false);
              }}
            >
              <Text style={styles.cancelButtonText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 20,
  },
  container: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007BFF",
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
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
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginLeft: 5,
  },
  remarkContainer: {
    backgroundColor: "#F3E8FF",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  remarkText: {
    fontSize: 14,
    color: "#6A0572",
    fontStyle: "italic",
  },
  boldText: {
    fontWeight: "bold",
  },
  noRemarkText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#fff5f5",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#d9534f",
  },
  warningText: {
    fontSize: 14,
    color: "#d9534f",
    marginLeft: 10,
    flex: 1,
  },
  checkInButton: {
    flexDirection: "row",
    backgroundColor: "#28a745",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  qaButton: {
    flexDirection: "row",
    backgroundColor: "#FF5733",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  remarkButton: {
    flexDirection: "row",
    backgroundColor: "#AB83A1",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  qrButton: {
    flexDirection: "row",
    backgroundColor: "#17a2b8",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: "#b0bec5",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 10,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d8e0",
    marginBottom: 20,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
    paddingVertical: 10,
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
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

export default ClassroomPage;