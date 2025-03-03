import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Box, Typography, CircularProgress } from "@mui/material";
import { db } from "../firebase/firebase";
import { doc, setDoc, collection, getDocs, getCountFromServer } from "firebase/firestore";  // เพิ่ม setDoc ที่นี่
import { v4 as uuidv4 } from "uuid"; // ใช้ uuid เพื่อสร้างหมายเลขเช็คชื่อใหม่

const CheckinManagementPage = () => {
  const { cid } = useParams(); // ดึง `cid` จาก URL
  const { cno } = useParams(); // ดึง `cno` จาก URL
  const navigate = useNavigate(); // สำหรับการนำทาง
  const [students, setStudents] = useState([]); // เก็บข้อมูลนักเรียน
  const [checkinHistory, setCheckinHistory] = useState([]); // เก็บประวัติการเช็คชื่อ
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล

  // ฟังก์ชันดึงข้อมูลนักเรียน
  useEffect(() => {
    const fetchStudentsData = async () => {
      const studentsRef = collection(db, `classroom/${cid}/students`);
      const studentsSnap = await getDocs(studentsRef);
      setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchStudentsData();
  }, [cid]);

  // ฟังก์ชันดึงประวัติการเช็คชื่อ
  useEffect(() => {
    const fetchCheckinHistory = async () => {
      const checkinHistoryRef = collection(db, `classroom/${cid}/checkin`);
      const checkinHistorySnap = await getDocs(checkinHistoryRef);
      const historyWithStudentCount = [];

      for (const historyDoc of checkinHistorySnap.docs) {
        const checkinNo = historyDoc.id;
        // คำนวณจำนวนคนที่เช็คชื่อ
        const scoresRef = collection(db, `classroom/${cid}/checkin/${checkinNo}/scores`);
        const scoresSnapshot = await getCountFromServer(scoresRef);
        
        const studentCount = scoresSnapshot.data().count;
        historyWithStudentCount.push({
          id: checkinNo,
          ...historyDoc.data(),
          studentCount: studentCount,
        });
      }

      setCheckinHistory(historyWithStudentCount);
      setLoading(false);
    };
    fetchCheckinHistory();
  }, [cid]);

  // ฟังก์ชันสร้างการเช็คชื่อ
  const handleCreateCheckin = async () => {
    const checkinNo = uuidv4();  // สร้างหมายเลขเช็คชื่อใหม่ (cno)
    const generatedCode = uuidv4().slice(0, 6).toUpperCase();  // รหัสเช็คชื่อ 6 หลัก
    
    try {
      // สร้างการเช็คชื่อใน Firestore
      await setDoc(doc(db, `classroom/${cid}/checkin/${checkinNo}`), {
        code: generatedCode,
        isOpen: true,
        createdAt: new Date().toISOString(),
      });

      // เพิ่มการเช็คชื่อใหม่ที่ตำแหน่งแรก
      setCheckinHistory(prevHistory => [
        { id: checkinNo, createdAt: new Date().toISOString(), studentCount: students.length, isOpen: true },
        ...prevHistory 
      ]);

      alert(`✅ เพิ่มการเช็คชื่อสำเร็จ! รหัสเช็คชื่อ: ${generatedCode}`);

      // นำทางไปยังหน้าเช็คชื่อ พร้อมส่ง cno (หมายเลขเช็คชื่อ) ไปยัง URL
      navigate(`/classroom/${cid}/checkin/${checkinNo}`);  // ส่งไปยังหน้า CheckInPage

    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการสร้างการเช็คชื่อ:", error);
      alert("❌ เกิดข้อผิดพลาดในการเพิ่มการเช็คชื่อ");
    }
  };

  // ฟังก์ชันนำทางไปหน้าเช็คชื่อ
  const handleGoToCheckInPage = (cno) => {
    navigate(`/classroom/${cid}/checkin/${cno}`);
  };

  return (
    <Box sx={{ padding: "75px" }}>
      <Typography variant="h4" gutterBottom>การจัดการการเช็คชื่อ</Typography>

      {/* ปุ่มเพิ่มการเช็คชื่อ */}
      <Box sx={{ marginBottom: "20px" }}>
        <Button variant="contained" color="primary" onClick={handleCreateCheckin}>
          เพิ่มการเช็คชื่อ
        </Button>
      </Box>

      {/* แสดงสถานะการโหลด */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* แสดงประวัติการเช็คชื่อ */}
          <Typography variant="h6" gutterBottom>ประวัติการเช็คชื่อ</Typography>
          <Table sx={{ marginBottom: "20px" }}>
            <TableHead>
              <TableRow>
                <TableCell>ลำดับ</TableCell>
                <TableCell>วัน-เวลา</TableCell>
                <TableCell>จำนวนคนเข้าเรียน</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checkinHistory.map((history, index) => (
                <TableRow key={history.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{new Date(history.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{history.studentCount}</TableCell>
                  <TableCell>{history.isOpen ? "กำลังเรียน" : "ปิดการเช็คชื่อ"}</TableCell>
                  <TableCell>
                    <Button variant="contained" color="primary" onClick={() => handleGoToCheckInPage(history.id)}>
                      เช็คเชื่อ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Box>
  );
};

export default CheckinManagementPage;
