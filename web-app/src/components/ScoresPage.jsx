import React, { useState, useEffect } from "react";
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { db } from "../firebase/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const ScoresPage = () => {
  const { cid, cno } = useParams(); 
  const [scores, setScores] = useState([]); 
  const [isSaving, setIsSaving] = useState(false); 

  // 📌 ดึงข้อมูลจาก Firestore
  useEffect(() => {
    const fetchScores = async () => {
      const scoresRef = collection(db, `classroom/${cid}/checkin/${cno}/scores`);
      const scoresSnap = await getDocs(scoresRef);
      setScores(scoresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchScores();
  }, [cid, cno]);

  // 📌 ฟังก์ชันการแก้ไขข้อมูล (เช่น คะแนน, หมายเหตุ, สถานะ)
  const handleChange = (event, id, field) => {
    const updatedScores = scores.map(score => {
      if (score.id === id) {
        return { ...score, [field]: event.target.value };
      }
      return score;
    });
    setScores(updatedScores);
  };

  // 📌 ฟังก์ชันบันทึกข้อมูลที่แก้ไขแล้ว
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      scores.forEach(score => {
        const scoreRef = doc(db, `classroom/${cid}/checkin/${cno}/scores`, score.id);
        batch.update(scoreRef, {
          score: score.score,
          note: score.note,
          status: score.status,
        });
      });
      await batch.commit();
      alert("✅ บันทึกการแก้ไขข้อมูลสำเร็จ!");
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
      alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ padding: "70px" }}>
      <Typography variant="h4" gutterBottom>แสดงคะแนน</Typography>
      
      {/* 🔹 ตารางคะแนน */}
      <Table sx={{ marginTop: "20px" }}>
        <TableHead>
          <TableRow>
            <TableCell>ลำดับ</TableCell>
            <TableCell>รหัส</TableCell>
            <TableCell>ชื่อ</TableCell>
            <TableCell>หมายเหตุ</TableCell>
            <TableCell>วันเวลา</TableCell>
            <TableCell>คะแนน</TableCell>
            <TableCell>สถานะ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {scores.map((score, index) => (
            <TableRow key={score.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{score.stdid}</TableCell>
              <TableCell>{score.name}</TableCell>
              <TableCell>
                <TextField
                  value={score.note || ""}
                  onChange={(event) => handleChange(event, score.id, "note")}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </TableCell>
              <TableCell>{score.date}</TableCell>
              <TableCell>
                <TextField
                  value={score.score || ""}
                  onChange={(event) => handleChange(event, score.id, "score")}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  value={score.status || ""}
                  onChange={(event) => handleChange(event, score.id, "status")}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 🔹 ปุ่มบันทึกข้อมูล */}
      <Box sx={{ marginTop: "20px" }}>
        <Button variant="contained" color="primary" onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? "บันทึก..." : "บันทึกการแก้ไขข้อมูล"}
        </Button>
      </Box>
    </Box>
  );
};

export default ScoresPage;
