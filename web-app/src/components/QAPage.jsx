import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, TextField, Box, Typography, List, ListItem, CircularProgress } from "@mui/material";
import { db } from "../firebase/firebase";
import { doc, setDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";

const QAPage = () => {
  const { cid, cno } = useParams();
  const navigate = useNavigate();

  const [questionNo, setQuestionNo] = useState(""); // เก็บหมายเลขคำถาม
  const [questionText, setQuestionText] = useState(""); // เก็บข้อความคำถาม
  const [questionShow, setQuestionShow] = useState(false); // สถานะการแสดงคำถาม
  const [answers, setAnswers] = useState([]); // เก็บคำตอบ
  const [loading, setLoading] = useState(true); // สถานะการโหลดคำตอบ

  // ฟังก์ชันเริ่มถาม
 // ฟังก์ชันเริ่มถาม
const handleStartQuestion = async () => {
  if (!questionNo || !questionText) {
    alert("กรุณากรอกหมายเลขคำถามและข้อความคำถาม");
    return;
  }

  try {
    // บันทึกข้อมูลคำถาม
    await setDoc(doc(db, `classroom/${cid}/checkin/${cno}/questions/${questionNo}`), { 
      question_no: questionNo,
      question_text: questionText,
    });

    // กำหนดให้คำถามแสดง
    await updateDoc(doc(db, `classroom/${cid}/checkin/${cno}`), { 
      question_show: true,
    });

    setQuestionShow(true);
    alert("✅ เริ่มถามคำถามแล้ว!");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการตั้งคำถาม:", error);
    alert("❌ เกิดข้อผิดพลาดในการตั้งคำถาม");
  }
};


  // ฟังก์ชันปิดคำถาม
  const handleCloseQuestion = async () => {
    try {
      // ตั้งค่าให้คำถามไม่แสดง
      await updateDoc(doc(db, `classroom/${cid}/checkin/${cno}`), { 
        question_show: false,
      });

      setQuestionShow(false);
      alert("✅ ปิดคำถามแล้ว!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการปิดคำถาม:", error);
      alert("❌ เกิดข้อผิดพลาดในการปิดคำถาม");
    }
  };

  // ดึงคำตอบแบบ Realtime
  useEffect(() => {
    const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/answers`);
    const q = query(answersRef, where("question_no", "==", questionNo));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAnswers = snapshot.docs.map(doc => doc.data());
      setAnswers(fetchedAnswers);
      setLoading(false);
    });

    // Clean up function when component is unmounted
    return () => unsubscribe();
  }, [cid, cno, questionNo]);

  return (
    <Box sx={{ padding: "75px" }}>
      <Typography variant="h4" gutterBottom>หน้าจอถาม-ตอบ</Typography>

      <Box sx={{ marginBottom: "20px" }}>
        <TextField
          label="หมายเลขคำถาม"
          value={questionNo}
          onChange={(e) => setQuestionNo(e.target.value)}
          fullWidth
          sx={{ marginBottom: "10px" }}
        />
        <TextField
          label="ข้อความคำถาม"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          fullWidth
          sx={{ marginBottom: "10px" }}
        />
      </Box>

      {/* ปุ่มเริ่มถาม และปิดคำถาม */}
      <Box sx={{ marginBottom: "20px" }}>
        {!questionShow ? (
          <Button variant="contained" color="primary" onClick={handleStartQuestion}>
            เริ่มถาม
          </Button>
        ) : (
          <Button variant="contained" color="secondary" onClick={handleCloseQuestion}>
            ปิดคำถาม
          </Button>
        )}
      </Box>

      {/* แสดงคำตอบแบบ Realtime */}
      <Typography variant="h6" gutterBottom>คำตอบ</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {answers.map((answer, index) => (
            <ListItem key={index}>
              <Typography variant="body1">{answer.text}</Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default QAPage;
