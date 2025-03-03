import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import QRCode from 'react-qr-code';

const CheckinScreen = ({ cid, cno, course }) => {
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState([]);
  const [showScores, setShowScores] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const studentsRef = collection(db, `classroom/${cid}/checkin/${cno}/students`);
      const snapshot = await getDocs(studentsRef);
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchStudents();
  }, [cid, cno]);

  const handleDeleteStudent = async (studentId) => {
    await deleteDoc(doc(db, `classroom/${cid}/checkin/${cno}/students`, studentId));
    setStudents(students.filter(student => student.id !== studentId));
  };

  const handleSaveCheckin = async () => {
    const scoresRef = collection(db, `classroom/${cid}/checkin/${cno}/scores`);
    for (const student of students) {
      await setDoc(doc(scoresRef, student.id), {
        ...student,
        status: 1,
      });
    }
    alert('บันทึกการเช็คชื่อสำเร็จ');
  };

  const handleShowScores = async () => {
    const scoresRef = collection(db, `classroom/${cid}/checkin/${cno}/scores`);
    const snapshot = await getDocs(scoresRef);
    setScores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setShowScores(true);
  };

  const handleUpdateScore = async (studentId, field, value) => {
    const studentRef = doc(db, `classroom/${cid}/checkin/${cno}/scores`, studentId);
    await updateDoc(studentRef, { [field]: value });
    setScores(scores.map(s => s.id === studentId ? { ...s, [field]: value } : s));
  };

  return (
    <div>
      <h1>{course.code} - {course.name}</h1>
      <img src={course.image} alt="Course Background" style={{ width: '100%' }} />
      <div>
        <button>ออก</button>
        <button>เปิดเช็คชื่อ</button>
        <button>ปิดเช็คชื่อ</button>
        <button onClick={handleSaveCheckin}>บันทึกการเช็คชื่อ</button>
        <button>แสดงรหัสเช็คชื่อ</button>
        <button><QRCode value={cid} /></button>
        <button>ถาม-ตอบ</button>
        <button onClick={handleShowScores}>แสดงคะแนน</button>
      </div>
      <h2>รายชื่อผู้เช็คชื่อ</h2>
      <table>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>รหัส</th>
            <th>ชื่อ</th>
            <th>หมายเหตุ</th>
            <th>วันเวลา</th>
            <th>ลบ</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.id}>
              <td>{index + 1}</td>
              <td>{student.studentID}</td>
              <td>{student.name}</td>
              <td>{student.note || '-'}</td>
              <td>{student.timestamp}</td>
              <td><button onClick={() => handleDeleteStudent(student.id)}>ลบ</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showScores && (
        <div>
          <h2>คะแนนเช็คชื่อ</h2>
          <table>
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>รหัส</th>
                <th>ชื่อ</th>
                <th>หมายเหตุ</th>
                <th>วันเวลา</th>
                <th>คะแนน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.studentID}</td>
                  <td>{student.name}</td>
                  <td><input type="text" value={student.note || ''} onChange={(e) => handleUpdateScore(student.id, 'note', e.target.value)} /></td>
                  <td>{student.timestamp}</td>
                  <td><input type="number" value={student.score || 0} onChange={(e) => handleUpdateScore(student.id, 'score', e.target.value)} /></td>
                  <td><input type="text" value={student.status || ''} onChange={(e) => handleUpdateScore(student.id, 'status', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CheckinScreen;
