import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore"; // เพิ่ม getDocs จาก Firestore
import { db, auth } from "../firebase"; // สมมติว่าไฟล์ firebase.js เหมือนกับ ClassroomPage
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from '@expo/vector-icons';

const StudentQAPage = ({ route }) => {
  const { cid, cno } = route?.params || {};
  const [questionNo, setQuestionNo] = useState(""); // หมายเลขคำถามที่เลือก
  const [questionText, setQuestionText] = useState(""); // ข้อความคำถามจาก Firestore
  const [questionShow, setQuestionShow] = useState(false); // สถานะการแสดงคำถาม
  const [answerText, setAnswerText] = useState(""); // ข้อความคำตอบของนักเรียน
  const [loading, setLoading] = useState(true); // สถานะการโหลด
  const [submitting, setSubmitting] = useState(false); // สถานะการส่งคำตอบ
  const navigation = useNavigation();

  // ดึงข้อมูลคำถามแบบเรียลไทม์
  useEffect(() => {
    if (!cid || !cno) {
      Alert.alert("❌ ข้อมูลห้องเรียนไม่ครบถ้วน");
      setLoading(false);
      return;
    }

    console.log("Fetching QA data with cid:", cid, "cno:", cno);

    // ดึงสถานะ question_show จาก checkin
    const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
    const unsubscribeCheckin = onSnapshot(checkinRef, (checkinSnap) => {
      if (checkinSnap.exists()) {
        const checkinData = checkinSnap.data() || {};
        console.log("Checkin Data:", checkinData);
        setQuestionShow(checkinData.question_show ?? false);

        // ถ้ามีการแสดงคำถาม ให้ดึง questionNo และ questionText
        if (checkinData.question_show && !questionNo) {
          fetchLatestQuestion();
        }
      } else {
        console.log("No checkin document found for cid:", cid, "cno:", cno);
        setQuestionShow(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Checkin onSnapshot Error:", error);
      Alert.alert("❌ เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setLoading(false);
    });

    return () => unsubscribeCheckin();
  }, [cid, cno, questionNo]);

  // ฟังก์ชันดึงคำถามล่าสุด
  const fetchLatestQuestion = async () => {
    try {
      const questionsRef = collection(db, `classroom/${cid}/checkin/${cno}/questions`);
      const questionSnap = await getDocs(questionsRef);
      if (!questionSnap.empty) {
        const latestQuestion = questionSnap.docs[questionSnap.docs.length - 1].data(); // ดึงคำถามล่าสุด
        setQuestionNo(latestQuestion.question_no || "");
        setQuestionText(latestQuestion.question_text || "");
        console.log("Latest Question:", latestQuestion);
      } else {
        console.log("No questions found for cid:", cid, "cno:", cno);
        setQuestionText("ยังไม่มีคำถาม");
      }
    } catch (error) {
      console.error("Error fetching latest question:", error);
      Alert.alert("❌ ไม่สามารถดึงคำถามล่าสุดได้");
    }
  };

  // ส่งคำตอบไป Firestore
  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      Alert.alert("⚠️ กรุณากรอกคำตอบ");
      return;
    }
    if (!auth.currentUser) {
      Alert.alert("⚠️ กรุณาเข้าสู่ระบบ");
      return;
    }

    setSubmitting(true);
    try {
      const answerRef = doc(collection(db, `classroom/${cid}/checkin/${cno}/answers`));
      await setDoc(answerRef, {
        question_no: questionNo,
        text: answerText,
        student_id: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      });
      Alert.alert("✅ ส่งคำตอบสำเร็จ!");
      setAnswerText(""); // รีเซ็ตช่องคำตอบ
    } catch (error) {
      console.error("❌ Error submitting answer:", error);
      Alert.alert("❌ เกิดข้อผิดพลาดในการส่งคำตอบ");
    } finally {
      setSubmitting(false);
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
    <View style={styles.container}>
      <Text style={styles.title}>ตอบคำถาม</Text>

      {/* แสดงสถานะคำถาม */}
      {questionShow ? (
        <>
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>คำถามหมายเลข: {questionNo}</Text>
            <Text style={styles.questionText}>{questionText}</Text>
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome name="pencil" size={20} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="พิมพ์คำตอบของคุณที่นี่"
              value={answerText}
              onChangeText={setAnswerText}
              multiline
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmitAnswer}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>ส่งคำตอบ</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.warningCard}>
          <FontAwesome name="exclamation-triangle" size={20} color="#d9534f" />
          <Text style={styles.warningText}>ขณะนี้ยังไม่มีคำถามที่เปิดอยู่</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
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
    paddingVertical: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    minHeight: 100,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#d9534f',
  },
  warningText: {
    fontSize: 16,
    color: '#d9534f',
    marginLeft: 10,
    flex: 1,
    textAlign: 'center',
  },
});

export default StudentQAPage;