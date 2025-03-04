import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { db } from "../firebase/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

// Custom styled components
const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
  border: 0,
  borderRadius: 25,
  boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
  color: "white",
  height: 48,
  padding: "0 30px",
  "&:hover": {
    background: "linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)",
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
  borderRadius: 25,
  color: "white",
  height: 48,
  padding: "0 30px",
  "&:hover": {
    background: "linear-gradient(45deg, #21CBF3 30%, #2196F3 90%)",
  },
}));

const ResetButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #FF5252 30%, #F44336 90%)",
  borderRadius: 25,
  color: "white",
  height: 48,
  padding: "0 30px",
  "&:hover": {
    background: "linear-gradient(45deg, #F44336 30%, #FF5252 90%)",
  },
}));

const QAPage = () => {
  const { cid, cno } = useParams();
  const [questionNo, setQuestionNo] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionShow, setQuestionShow] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isQuestionClosed, setIsQuestionClosed] = useState(false);

  // Handle Start Question
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
      setIsQuestionClosed(false);
      alert("✅ เริ่มถามคำถามแล้ว!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการตั้งคำถาม:", error);
      alert("❌ เกิดข้อผิดพลาดในการตั้งคำถาม");
    }
  };

  // Handle Close Question
  const handleCloseQuestion = async () => {
    try {
      await updateDoc(doc(db, `classroom/${cid}/checkin/${cno}`), {
        question_show: false,
      });
      setQuestionShow(false);
      setIsQuestionClosed(true);
      alert("✅ ปิดคำถามแล้ว!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการปิดคำถาม:", error);
      alert("❌ เกิดข้อผิดพลาดในการปิดคำถาม");
    }
  };

  // Handle Reset Question
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
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      });
      await updateDoc(doc(db, `classroom/${cid}/checkin/${cno}`), {
        question_show: false,
      });
      setQuestionNo("");
      setQuestionText("");
      setQuestionShow(false);
      setAnswers([]);
      setIsQuestionClosed(false);
      alert("✅ รีเซ็ตคำถามและคำตอบเรียบร้อยแล้ว!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการรีเซ็ต:", error);
      alert("❌ เกิดข้อผิดพลาดในการรีเซ็ต");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Answers
  useEffect(() => {
    if (!questionNo) return;
    const answersRef = collection(db, `classroom/${cid}/checkin/${cno}/answers`);
    const q = query(answersRef, where("question_no", "==", questionNo));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const fetchedAnswers = snapshot.docs.map((doc) => ({
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
      },
      (error) => {
        console.error("❌ Error fetching answers:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [cid, cno, questionNo]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f0f4f8, #dfe9f3)",
        padding: "70px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Card
        sx={{
          maxWidth: 800,
          width: "100%",
          borderRadius: "20px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ padding: "40px" }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#333", textAlign: "center" }}
          >
            หน้าจอถาม-ตอบ
          </Typography>

          {/* Input Section */}
          <Box sx={{ marginBottom: "30px" }}>
            <TextField
              label="หมายเลขคำถาม"
              value={questionNo}
              onChange={(e) => setQuestionNo(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ marginBottom: "20px", borderRadius: "10px" }}
            />
            <TextField
              label="ข้อความคำถาม"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              sx={{ marginBottom: "20px", borderRadius: "10px" }}
            />
          </Box>

          {/* Buttons */}
          <Box sx={{ display: "flex", gap: "15px", justifyContent: "center", marginBottom: "30px" }}>
            {!questionShow ? (
              <GradientButton onClick={handleStartQuestion}>เริ่มถาม</GradientButton>
            ) : (
              <SecondaryButton onClick={handleCloseQuestion}>ปิดคำถาม</SecondaryButton>
            )}
            {isQuestionClosed && (
              <ResetButton onClick={handleResetQuestion}>รีเซ็ต</ResetButton>
            )}
          </Box>

          {/* Answers Section */}
          <Divider sx={{ marginBottom: "20px" }} />
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#555" }}
          >
            คำตอบ
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper
              elevation={2}
              sx={{
                maxHeight: "300px",
                overflowY: "auto",
                borderRadius: "10px",
                padding: "10px",
              }}
            >
              <List>
                {answers.length > 0 ? (
                  answers.map((answer, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: "medium", color: "#333" }}>
                          <strong>{answer.studentName}:</strong> {answer.text}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          ตอบเมื่อ: {new Date(answer.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body1" sx={{ color: "#777", textAlign: "center" }}>
                    ยังไม่มีคำตอบสำหรับคำถามนี้
                  </Typography>
                )}
              </List>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default QAPage;