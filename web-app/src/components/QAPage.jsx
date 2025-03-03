import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getDatabase, ref, update, onValue } from "firebase/database";

const QAPage = () => {
  const { cid, cno } = useParams();
  const db = getDatabase();
  const [questionNo, setQuestionNo] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (!questionNo) return; // ไม่ดึงข้อมูลถ้า questionNo ว่าง
    const answersRef = ref(db, `/classroom/${cid}/checkin/${cno}/answers/${questionNo}`);
    const unsubscribe = onValue(answersRef, (snapshot) => {
      setAnswers(snapshot.val() ? Object.values(snapshot.val()) : []);
    });
    return () => unsubscribe();
  }, [db, cid, cno, questionNo]);

  const startQuestion = () => {
    if (!questionNo.trim() || !questionText.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    update(ref(db, `/classroom/${cid}/checkin/${cno}`), {
      question_no: questionNo,
      question_text: questionText,
      question_show: true,
    });
  };

  const closeQuestion = () => {
    update(ref(db, `/classroom/${cid}/checkin/${cno}`), {
      question_show: false,
    });
  };

  return (
    <div>
      <h2>ถามตอบ</h2>
      <input
        type="text"
        placeholder="ข้อที่"
        value={questionNo}
        onChange={(e) => setQuestionNo(e.target.value)}
      />
      <input
        type="text"
        placeholder="ข้อความคำถาม"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <button onClick={startQuestion}>เริ่มถาม</button>
      <button onClick={closeQuestion}>ปิดคำถาม</button>

      <h3>รายการคำตอบ</h3>
      {answers.length === 0 ? <p>ยังไม่มีคำตอบ</p> : (
        <ul>
          {answers.map((answer, index) => (
            <li key={index}>{answer}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default QAPage;
