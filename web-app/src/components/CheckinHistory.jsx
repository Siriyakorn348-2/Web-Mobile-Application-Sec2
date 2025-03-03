import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";

const CheckinHistory = () => {
  const { cid } = useParams();
  const [checkins, setCheckins] = useState([]);

  // ดึงข้อมูลประวัติการเช็คชื่อ
  useEffect(() => {
    const fetchCheckins = async () => {
      const snapshot = await db.ref(`/classroom/${cid}/checkin`).get();
      if (snapshot.exists()) {
        setCheckins(Object.entries(snapshot.val()).map(([cno, data]) => ({ cno, ...data })));
      }
    };
    fetchCheckins();
  }, [cid]);


  const addCheckin = async () => {
    const cno = Date.now(); // ใช้ timestamp เป็น key
    await db.ref(`/classroom/${cid}/checkin/${cno}`).set({
      datetime: new Date().toLocaleString(),
      status: "กำลังเรียน",
    });

    const studentsSnapshot = await db.ref(`/classroom/${cid}/students`).get();
    if (studentsSnapshot.exists()) {
      const students = studentsSnapshot.val();
      const scores = Object.keys(students).reduce((acc, sid) => {
        acc[sid] = { status: 0 };
        return acc;
      }, {});


      await db.ref(`/classroom/${cid}/checkin/${cno}/scores`).set(scores);
    }

    setCheckins([...checkins, { cno, datetime: new Date().toLocaleString(), status: "กำลังเรียน" }]);
  };

  return (
    <div>
      <h2>ประวัติการเช็คชื่อ</h2>
      <table>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>วัน-เวลา</th>
            <th>จำนวนคนเข้าเรียน</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {checkins.map((checkin, index) => (
            <tr key={checkin.cno}>
              <td>{index + 1}</td>
              <td>{checkin.datetime}</td>
              <td>{checkin.scores ? Object.keys(checkin.scores).length : 0}</td>
              <td>{checkin.status}</td>
              <td>
                <button onClick={() => window.location.href = `/classroom/${cid}/checkin/${checkin.cno}/qna`}>เช็คชื่อ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addCheckin}>เพิ่ม</button>
    </div>
  );
};

export default CheckinHistory;
