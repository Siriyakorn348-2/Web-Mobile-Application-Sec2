import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { saveQuestion, closeQuestion, fetchQuestionRealtime, fetchAnswersRealtime, addAnswer } from '../firebase/courseService';

function Quiz() {
    const { cid } = useParams();
    const [questionNo, setQuestionNo] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [isQuestionActive, setIsQuestionActive] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [error, setError] = useState(null);
    const [activeQuestionNo, setActiveQuestionNo] = useState(null);
    const [closedQuestionNo, setClosedQuestionNo] = useState(null);
    const cno = "quiz";
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!cid || !cno || !activeQuestionNo || !isQuestionActive) {
            console.log("Skipping fetch: incomplete data or question not active");
            return;
        }

        console.log(`Fetching data for activeQuestionNo: ${activeQuestionNo}`);
        let unsubscribeQuestion, unsubscribeAnswers;

        try {
            unsubscribeQuestion = fetchQuestionRealtime(cid, cno, activeQuestionNo, (data) => {
                if (data) {
                    console.log("Question data received:", data);
                    setIsQuestionActive(data.question_show || false);
                    if (!questionText && data.question_text) setQuestionText(data.question_text);
                } else {
                    console.log("No question data found");
                }
            });

            unsubscribeAnswers = fetchAnswersRealtime(cid, cno, activeQuestionNo, (answersData) => {
                console.log("Answers received:", answersData);
                setAnswers(answersData);
            });
        } catch (err) {
            console.error("Error setting up listeners:", err);
            setError("เกิดข้อผิดพลาดในการดึงข้อมูล: " + err.message);
        }

        return () => {
            console.log("Cleaning up listeners");
            if (unsubscribeQuestion) unsubscribeQuestion();
            if (unsubscribeAnswers) unsubscribeAnswers();
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [cid, cno, activeQuestionNo, isQuestionActive]);

    const simulateAnswer = async () => {
        try {
            await addAnswer(cid, cno, activeQuestionNo, `คำตอบที่ ${answers.length + 1} (จากข้อ ${activeQuestionNo})`);
            console.log("Simulated answer added");
        } catch (err) {
            console.error("Error simulating answer:", err);
            setError("เกิดข้อผิดพลาดในการจำลองคำตอบ: " + err.message);
        }
    };

    const startQuestion = async () => {
        console.log("cid:", cid, "cno:", cno, "questionNo:", questionNo, "questionText:", questionText);
        if (!questionNo || !questionText) {
            alert("กรุณากรอกข้อที่และคำถามก่อนเริ่มถาม");
            return;
        }

        try {
            console.log(`Starting question: ${questionNo} - ${questionText}`);
            const success = await saveQuestion(cid, cno, questionNo, questionText);
            if (success) {
                setActiveQuestionNo(questionNo);
                setIsQuestionActive(true);
                setError(null);
                setAnswers([]);
                setClosedQuestionNo(null);
                if (intervalRef.current) clearInterval(intervalRef.current);
                intervalRef.current = setInterval(simulateAnswer, 2000);
                console.log("Question started successfully");
            } else {
                throw new Error("Failed to save question");
            }
        } catch (err) {
            console.error("Error in startQuestion:", err);
            setError("เกิดข้อผิดพลาดในการเริ่มคำถาม: " + err.message);
            setIsQuestionActive(false);
        }
    };

    const handleCloseQuestion = async () => {
        console.log("Closing with cid:", cid, "cno:", cno, "activeQuestionNo:", activeQuestionNo);
        if (!activeQuestionNo) {
            setError("ไม่มีคำถามที่ใช้งานอยู่ให้ปิด");
            return;
        }

        try {
            console.log(`Closing question: ${activeQuestionNo}`);
            const success = await closeQuestion(cid, cno, activeQuestionNo);
            if (success) {
                setIsQuestionActive(false);
                setQuestionText('');
                setQuestionNo('');
                setClosedQuestionNo(activeQuestionNo);
                setActiveQuestionNo(null);
                setError(null);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                console.log("Question closed successfully");
            } else {
                throw new Error("Failed to close question");
            }
        } catch (err) {
            console.error("Error in handleCloseQuestion:", err);
            setError("เกิดข้อผิดพลาดในการปิดคำถาม: " + err.message);
        }
    };

    const resetAnswers = () => {
        console.log("Resetting answers for closedQuestionNo:", closedQuestionNo);
        setAnswers([]);
        setClosedQuestionNo(null);
        console.log("Answers reset successfully");
    };

    if (error) {
        return (
            <Box display="flex" justifyContent="center" mt={15}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box display="flex" justifyContent="center" mt={15}>
            <Box sx={{ bgcolor: "#fff", p: 3, borderRadius: 3, maxWidth: 800 }}>
                <Typography variant="h5" color="#5E35B1" textAlign="center" mb={3}>
                    Quiz
                </Typography>

                <div className="question-container">
                    <div className="input-section">
                        <input
                            type="text"
                            placeholder="ข้อที่"
                            value={questionNo}
                            onChange={(e) => {
                                console.log("QuestionNo changed to:", e.target.value);
                                setQuestionNo(e.target.value);
                            }}
                            disabled={isQuestionActive}
                        />
                        <textarea
                            placeholder="ข้อความคำถาม"
                            value={questionText}
                            onChange={(e) => {
                                console.log("QuestionText changed to:", e.target.value);
                                setQuestionText(e.target.value);
                            }}
                            disabled={isQuestionActive}
                        />
                        <div className="buttons">
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
                            {/* เพิ่มปุ่มรีเซ็ตคำตอบ */}
                            {!isQuestionActive && closedQuestionNo && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={resetAnswers}
                                >
                                    รีเซ็ตคำตอบ
                                </Button>
                            )}
                        </div>
                    </div>

                    {(isQuestionActive || closedQuestionNo) && (
                        <div className="answers-section">
                            <Typography variant="h6" mb={2}>
                                คำตอบสำหรับข้อ {isQuestionActive ? activeQuestionNo : closedQuestionNo}:
                            </Typography>
                            <ul>
                                {answers.length > 0 ? (
                                    answers.map((answer, index) => (
                                        <li key={index}>{answer}</li>
                                    ))
                                ) : (
                                    <li>ยังไม่มีคำตอบ</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .question-container { padding: 20px; }
                    .input-section { margin-bottom: 20px; }
                    input, textarea { width: 100%; margin-bottom: 10px; padding: 8px; box-sizing: border-box; }
                    textarea { min-height: 100px; }
                    .buttons { display: flex; gap: 10px; }
                    .answers-section { border-top: 1px solid #ccc; padding-top: 20px; }
                    ul { list-style: none; padding: 0; }
                    li { padding: 5px 0; border-bottom: 1px solid #eee; }
                `}</style>
            </Box>
        </Box>
    );
}

export default Quiz;