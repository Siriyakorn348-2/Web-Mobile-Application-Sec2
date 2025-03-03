import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Divider } from "@mui/material";
import { saveQuestion, closeQuestion, fetchQuestionRealtime, fetchAnswersRealtime, addAnswer, deleteAnswers} from "../firebase/courseService";

function Quiz() {
  const { cid } = useParams();
  const [questionNo, setQuestionNo] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);
  const [activeQuestionNo, setActiveQuestionNo] = useState(null);
  const [closedQuestionNo, setClosedQuestionNo] = useState(null);
  const cno = "quiz";
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!cid || !cno || !activeQuestionNo || !isQuestionActive) return;
    let unsubscribeQuestion, unsubscribeAnswers;

    try {
      unsubscribeQuestion = fetchQuestionRealtime(cid, cno, activeQuestionNo, (data) => {
        if (data) {
          setIsQuestionActive(data.question_show || false);
          if (!questionText && data.question_text) setQuestionText(data.question_text);
        }
      });

      unsubscribeAnswers = fetchAnswersRealtime(cid, cno, activeQuestionNo, setAnswers);
    } catch (err) {
      setError("เกิดข้อผิดพลาด: " + err.message);
    }

    return () => {
      if (unsubscribeQuestion) unsubscribeQuestion();
      if (unsubscribeAnswers) unsubscribeAnswers();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cid, cno, activeQuestionNo, isQuestionActive]);

  const simulateAnswer = async () => {
    try {
      await addAnswer(cid, cno, activeQuestionNo, `คำตอบที่ ${answers.length + 1}`);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการจำลองคำตอบ: " + err.message);
    }
  };

  const startQuestion = async () => {
    if (!questionNo || !questionText) {
      alert("กรุณากรอกข้อที่และคำถามก่อนเริ่มถาม");
      return;
    }

    try {
      const success = await saveQuestion(cid, cno, questionNo, questionText);
      if (success) {
        setActiveQuestionNo(questionNo);
        setIsQuestionActive(true);
        setError(null);
        setAnswers([]);
        setClosedQuestionNo(null);
        intervalRef.current = setInterval(simulateAnswer, 2000);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเริ่มคำถาม: " + err.message);
    }
  };

  const handleCloseQuestion = async () => {
    if (!activeQuestionNo) {
      setError("ไม่มีคำถามที่ใช้งานอยู่ให้ปิด");
      return;
    }

    try {
      const success = await closeQuestion(cid, cno, activeQuestionNo);
      if (success) {
        setIsQuestionActive(false);
        setQuestionText("");
        setQuestionNo("");
        setClosedQuestionNo(activeQuestionNo);
        setActiveQuestionNo(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการปิดคำถาม: " + err.message);
    }
  };

  const resetAnswers = async () => {
    if (!closedQuestionNo) {
      setError("ไม่มีคำถามที่ปิดเพื่อรีเซ็ตคำตอบ");
      return;
    }

    try {
      const success = await deleteAnswers(cid, cno, closedQuestionNo);
      if (success) {
        setAnswers([]);
        setClosedQuestionNo(null);
        setError(null);
        console.log("Answers reset and deleted from Firestore for questionNo:", closedQuestionNo);
      } else {
        throw new Error("Failed to delete answers");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการรีเซ็ตคำตอบ: " + err.message);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={8}>
      <Card sx={{ width: "90%", maxWidth: 600, p: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" color="#6A1B9A" textAlign="center" mb={2}>
            Quiz
          </Typography>

          {error && (
            <Typography color="error" textAlign="center" mb={2}>
              {error}
            </Typography>
          )}

          <Stack spacing={2}>
            <TextField
              label="ข้อที่"
              variant="outlined"
              fullWidth
              value={questionNo}
              onChange={(e) => setQuestionNo(e.target.value)}
              disabled={isQuestionActive}
              sx={{ borderRadius: 2, "& fieldset": { borderRadius: 2 } }}
            />
            <TextField
              label="ข้อความคำถาม"
              variant="outlined"
              multiline
              rows={3}
              fullWidth
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              disabled={isQuestionActive}
              sx={{ borderRadius: 2, "& fieldset": { borderRadius: 2 } }}
            />

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                onClick={startQuestion}
                disabled={!questionNo || !questionText || isQuestionActive}
              >
                เริ่มถาม
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleCloseQuestion}
                disabled={!isQuestionActive}
              >
                ปิดคำถาม
              </Button>
              {/* ปุ่มรีเซ็ตแสดงเมื่อคำถามถูกปิด */}
              {!isQuestionActive && closedQuestionNo && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={resetAnswers}
                >
                  รีเซ็ต
                </Button>
              )}
            </Stack>

            {(isQuestionActive || closedQuestionNo) && (
              <>
                <Divider />
                <Typography variant="h6" textAlign="center" mt={2}>
                  คำตอบสำหรับข้อ {isQuestionActive ? activeQuestionNo : closedQuestionNo}
                </Typography>
                <Box
                  sx={{
                    bgcolor: "#f9f9f9",
                    p: 2,
                    borderRadius: 3,
                    minHeight: 100,
                    boxShadow: 1,
                  }}
                >
                  {answers.length > 0 ? (
                    answers.map((answer, index) => (
                      <Typography key={index} sx={{ mb: 1 }}>
                        {index + 1}. {answer}
                      </Typography>
                    ))
                  ) : (
                    <Typography color="textSecondary">ยังไม่มีคำตอบ</Typography>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Quiz;