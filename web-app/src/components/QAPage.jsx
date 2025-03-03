import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, TextField, Box, Typography, List, ListItem, CircularProgress } from "@mui/material";
import { db } from "../firebase/firebase";
import { doc, setDoc, updateDoc, collection, query, where, onSnapshot, getDoc, deleteDoc } from "firebase/firestore";

const QAPage = () => {
  const { cid, cno } = useParams();
  const navigate = useNavigate();

  const [questionNo, setQuestionNo] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionShow, setQuestionShow] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isQuestionClosed, setIsQuestionClosed] = useState(false); // state ใหม่

  // ฟังก์ชันเริ่มถาม
  const handleStartQuestion = async () => {
    if (!questionNo || !questionText) {
      alert("กรุณากรอกหมายเลขคำถามและข้อความคำถาม");
      return;
    }

    try {
      await setDoc(doc(db, `classroom/${cid}/checkin/${cno}/questions/${questionNo}`), {
        question_no: questionNo,
        question_text: questionText,
      });

      await updateDoc(doc(db, `classroom/${cid}/checkin/${cno}`), {
        question_show: true,
      });

      setQuestionShow(true);
      setIsQuestionClosed(false); // รีเซ็ตสถานะเมื่อเริ่มคำถามใหม่
      alert("✅ เริ่มถามคำถามแล้ว!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการตั้งคำถาม:", error);
      alert("❌ เกิดข้อผิดพลาดในการตั้งคำถาม");
    }
  };

  // ฟังก์ชันปิดคำถาม
  const handleCloseQuestion = async () => {
    try {
      await updateDoc(doc(db, `classroom/${cid}/checkin/${cno}`), {
        question_show: false,
      });

      setQuestionShow(false);
      setIsQuestionClosed(true); // ตั้งค่าสถานะเมื่อปิดคำถาม
      alert("✅ ปิดคำถามแล้ว!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการปิดคำถาม:", error);
      alert("❌ เกิดข้อผิดพลาดในการปิดคำถาม");
    }
  };

  // ฟังก์ชันรีเซ็ตคำถามและคำตอบ
  const handleResetQuestion = async () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะรีเซ็ตคำถามและคำตอบทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    try {
      setLoading(true);
      
      await deleteDoc(doc(db, `classroom/${cid}/checkin/${cno}/questions/${questionNo}`));
      
      const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/answers`);
      const q = query(answersRef, where("question_no", "==", questionNo));
      const snapshot = await onSnapshot(q, async (snapshot) => {
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      });

      await updateDoc(doc(db, `classroom/${cid}/checkin/${cno}`), {
        question_show: false,
      });

      setQuestionNo("");
      setQuestionText("");
      setQuestionShow(false);
      setAnswers([]);
      setIsQuestionClosed(false); // รีเซ็ตสถานะเมื่อรีเซ็ตคำถาม
      
      alert("✅ รีเซ็ตคำถามและคำตอบเรียบร้อยแล้ว!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการรีเซ็ต:", error);
      alert("❌ เกิดข้อผิดพลาดในการรีเซ็ต");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!questionNo) return;

    const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/answers`);
    const q = query(answersRef, where("question_no", "==", questionNo));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedAnswers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const answersWithNames = await Promise.all(
        fetchedAnswers.map(async (answer) => {
          const studentRef = doc(db, "users", answer.student_id);
          const studentSnap = await getDoc(studentRef);
          const studentData = studentSnap.exists() ? studentSnap.data() : {};
          return {
            ...answer,
            studentName: studentData.name || "ไม่ระบุชื่อ",
          };
        })
      );

      setAnswers(answersWithNames);
      setLoading(false);
    }, (error) => {
      console.error("❌ Error fetching answers:", error);
      setLoading(false);
    });

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
        {isQuestionClosed && ( // แสดงปุ่ม Reset เฉพาะเมื่อคำถามถูกปิด
          <Button
            variant="contained"
            color="error"
            onClick={handleResetQuestion}
            sx={{ marginLeft: "10px" }}
          >
            Reset
          </Button>
        )}
      </Box>

      <Typography variant="h6" gutterBottom>คำตอบ</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {answers.length > 0 ? (
            answers.map((answer, index) => (
              <ListItem key={index}>
                <Box>
                  <Typography variant="body1">
                    <strong>{answer.studentName}:</strong> {answer.text}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    ตอบเมื่อ: {new Date(answer.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </ListItem>
            ))
          ) : (
            <Typography variant="body1">ยังไม่มีคำตอบสำหรับคำถามนี้</Typography>
          )}
        </List>
      )}
    </Box>
  );
};

export default QAPage;