import { useState, useEffect } from "react";
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Box, Typography, Paper } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { db } from "../firebase/firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import QRCode from "react-qr-code";

const CheckInPage = () => {
  const { cid, cno } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [checkInCode, setCheckInCode] = useState(""); 
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // 📌 โหลดข้อมูลเช็คชื่อและรหัสจาก Firestore
  useEffect(() => {
    const fetchCheckInData = async () => {
      try {
        if (!db) {
          console.error("❌ Firestore ยังไม่ได้เชื่อมต่อ!");
          return;
        }

        const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
        const checkinSnap = await getDoc(checkinRef);

        if (checkinSnap.exists()) {
          setCheckInCode(checkinSnap.data().code);
          setIsCheckInOpen(checkinSnap.data().isOpen);
        }

        const studentsRef = collection(db, `classroom/${cid}/checkin/${cno}/students`);
        const studentsSnap = await getDocs(studentsRef);
        
        setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("❌ โหลดข้อมูลเช็คชื่อไม่สำเร็จ:", error);
      }
    };

    fetchCheckInData();
    const interval = setInterval(fetchCheckInData, 5000); // โหลดใหม่ทุก 5 วินาที
    return () => clearInterval(interval);
  }, [cid, cno]);

  // 📌 ฟังก์ชันเปิดเช็คชื่อ (สร้าง Code และบันทึกใน Firestore)
  const handleOpenCheckIn = async () => {
    try {
      const generatedCode = uuidv4().slice(0, 6).toUpperCase(); 
      setCheckInCode(generatedCode);
      setIsCheckInOpen(true);

      if (!db) {
        console.error("❌ Firestore ยังไม่ได้เชื่อมต่อ!");
        return;
      }

      const checkinRef = doc(db, `classroom/${cid}/checkin/${cno}`);
      await setDoc(checkinRef, {
        code: generatedCode,
        isOpen: true,
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ เปิดเช็คชื่อสำเร็จ! รหัสที่บันทึก: ${generatedCode}`);
      alert(`✅ เปิดเช็คชื่อสำเร็จ! รหัส: ${generatedCode}`);
    } catch (error) {
      console.error("❌ เปิดเช็คชื่อไม่สำเร็จ:", error);
      alert("❌ เกิดข้อผิดพลาดในการเปิดเช็คชื่อ!");
    }
  };

  // 📌 ฟังก์ชันปิดเช็คชื่อ
  const handleCloseCheckIn = async () => {
    try {
      setIsCheckInOpen(false);
      setCheckInCode("");

      await updateDoc(doc(db, `classroom/${cid}/checkin/${cno}`), {
        isOpen: false,
      });

      alert("✅ ปิดเช็คชื่อสำเร็จ!");
    } catch (error) {
      console.error("❌ ปิดเช็คชื่อไม่สำเร็จ:", error);
    }
  };

  // 📌 ฟังก์ชันลบรายชื่อนักเรียน
  const handleDelete = async (studentID) => {
    try {
      await deleteDoc(doc(db, `classroom/${cid}/checkin/${cno}/students/${studentID}`));
      setStudents(students.filter((s) => s.id !== studentID));
    } catch (error) {
      console.error("❌ ลบนักเรียนไม่สำเร็จ:", error);
    }
  };

  // 📌 ฟังก์ชันบันทึกข้อมูลการเช็คชื่อไปที่ /scores
  const handleSaveCheckIn = async () => {
    try {
      const studentsRef = collection(db, `classroom/${cid}/checkin/${cno}/students`);
      const studentsSnap = await getDocs(studentsRef);
  
      const batch = writeBatch(db); // เริ่มต้น batch
  
      studentsSnap.forEach((docSnapshot) => {
        const studentData = docSnapshot.data();
  
        const studentDocRef = doc(db, `classroom/${cid}/checkin/${cno}/scores`, docSnapshot.id);
        batch.set(studentDocRef, {
          ...studentData,
          status: 1, // เปลี่ยน status เป็น 1
        });
      });
  
      await batch.commit(); // คอมมิตข้อมูลทั้งหมดใน batch
      alert("✅ บันทึกการเช็คชื่อสำเร็จ!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการบันทึกการเช็คชื่อ:", error);
      alert(`❌ บันทึกการเช็คชื่อไม่สำเร็จ: ${error.message}`);
    }
  };

  // 📌 ฟังก์ชันแสดง QR Code
  const handleShowQRCode = () => {
    if (!checkInCode) {
      alert("กรุณาเปิดเช็คชื่อก่อน");
      return;
    }
    return <QRCode value={checkInCode} size={256} />;
  };

  const handleGoBack = () => {
    navigate(-1); // กลับไปหน้าก่อน
  };

  return (
    <Box sx={{ padding: "70px" }}>
      <Typography variant="h4" gutterBottom>การเช็คชื่อ</Typography>

      {/* 🔹 ปุ่มเปิด/ปิดเช็คชื่อ */}
      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <Button variant="contained" color="primary" onClick={handleOpenCheckIn} disabled={isCheckInOpen}>
          เปิดเช็คชื่อ
        </Button>
        <Button variant="contained" color="secondary" onClick={handleCloseCheckIn} disabled={!isCheckInOpen}>
          ปิดเช็คชื่อ
        </Button>
      </Box>

      {/* 🔹 แสดง Code เช็คชื่อ ถ้าเปิดใช้งาน */}
      {isCheckInOpen && (
        <Paper sx={{ padding: 3, backgroundColor: "#f0f0f0", textAlign: "center", marginBottom: 2 }}>
          <Typography variant="h6">🔑 รหัสเช็คชื่อ</Typography>
          <Typography variant="h3" sx={{ fontWeight: "bold", color: "#d32f2f" }}>{checkInCode}</Typography>
        </Paper>
      )}

      {/* 🔹 ปุ่มแสดง QR Code */}
      <Button variant="outlined" onClick={handleShowQRCode} sx={{ marginBottom: 2 }}>
        แสดง QR Code เช็คชื่อ
      </Button>

      {/* 🔹 แสดง QR Code */}
      {checkInCode && (
        <Paper sx={{ padding: 3, backgroundColor: "#f0f0f0", textAlign: "center" }}>
          <QRCode value={checkInCode} size={256} />
        </Paper>
      )}

      {/* 🔹 ตารางรายชื่อนักเรียนที่เช็คชื่อแล้ว */}
      <Table sx={{ marginTop: "20px" }}>
        <TableHead>
          <TableRow>
            <TableCell>ลำดับ</TableCell>
            <TableCell>รหัส</TableCell>
            <TableCell>ชื่อ</TableCell>
            <TableCell>หมายเหตุ</TableCell>
            <TableCell>วันเวลา</TableCell>
            <TableCell>ลบ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student, index) => (
            <TableRow key={student.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{student.stdid}</TableCell>
              <TableCell>{student.name}</TableCell>
              <TableCell>{student.remark || "-"}</TableCell>
              <TableCell>{student.date}</TableCell>
              <TableCell>
                <Button color="error" onClick={() => handleDelete(student.id)}>ลบ</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 🔹 ปุ่มกลับ */}
      <Button variant="contained" color="secondary" onClick={handleGoBack} sx={{ marginBottom: "20px", marginTop: "20px" }}>
        กลับ
      </Button>
    </Box>
  );
};

export default CheckInPage;
