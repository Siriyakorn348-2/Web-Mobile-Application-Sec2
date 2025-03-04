import React, { useState, useEffect } from "react";
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, collection, onSnapshot, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router-dom";

const StudentList = () => {
  const { cid } = useParams();
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ id: "", name: "", image: "", status: "" });
  const [editStudent, setEditStudent] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const db = getFirestore();
    const studentRef = collection(db, "classroom", cid, "students");

    const unsubscribe = onSnapshot(studentRef, async (snapshot) => {
      const studentList = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => { // เปลี่ยนจาก doc เป็น docSnapshot เพื่อความชัดเจน
          const studentData = {
            key: docSnapshot.id,
            ...docSnapshot.data(),
          };

          // 📌 ตรวจสอบและดึงรูปจาก users ถ้ามี stdid ที่ตรงกับ UID
          if (studentData.stdid) {
            const userRef = doc(db, "users", studentData.stdid); // แก้จาก doc2 เป็น doc
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().photo) {
              studentData.image = userSnap.data().photo; // ใช้รูปจาก users แทน
            }
          }

          return studentData;
        })
      );
      setStudents(studentList);
    });

    return () => unsubscribe();
  }, [cid]);

  // 📌 ฟังก์ชันในการอัปโหลดรูปภาพไปยัง Firebase Storage
  const uploadImage = async (file) => {
    const storage = getStorage();
    const imageRef = ref(storage, `students/${cid}/${file.name}`);
    try {
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดภาพ");
      return null;
    }
  };

  // 📌 ฟังก์ชันเพิ่มนักศึกษา
  const handleAddStudent = async () => {
    if (!cid) return alert("ไม่พบรหัสห้องเรียน");
    if (!newStudent.id || !newStudent.name || newStudent.status === "") {
      return alert("กรุณากรอกรหัส, ชื่อ และสถานะนักเรียน");
    }

    let imageUrl = newStudent.image;
    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        return alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      }
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return;
    }

    const db = getFirestore();
    const studentRef = doc(db, "classroom", cid, "students", newStudent.id);

    await setDoc(studentRef, { 
      stdid: newStudent.id,
      name: newStudent.name,
      status: newStudent.status,
      image: imageUrl || "",
    })
      .then(() => {
        alert("เพิ่มนักศึกษาเรียบร้อย");
        setNewStudent({ id: "", name: "", image: "", status: "" });
        setIsPopupOpen(false);
        setImageFile(null);
      })
      .catch((error) => alert("เกิดข้อผิดพลาด: " + error.message));
  };

  // 📌 ฟังก์ชันลบข้อมูลนักศึกษา
  const handleDeleteStudent = (key) => {
    if (!window.confirm("คุณต้องการลบนักศึกษาคนนี้ใช่หรือไม่?")) return;

    const db = getFirestore();
    const studentRef = doc(db, "classroom", cid, "students", key);

    deleteDoc(studentRef)
      .then(() => alert("ลบนักศึกษาเรียบร้อย"))
      .catch((error) => alert("เกิดข้อผิดพลาด: " + error.message));
  };

  // 📌 ฟังก์ชันเริ่มแก้ไขข้อมูลนักศึกษา
  const handleStartEdit = (student) => {
    setEditStudent({
      key: student.key,
      stdid: student.stdid,
      name: student.name,
      image: student.image,
      status: student.status,
    });
    setIsPopupOpen(true);
  };

  // 📌 ฟังก์ชันบันทึกข้อมูลที่แก้ไข
  const handleEditStudent = async () => {
    if (!editStudent || !editStudent.key) return;

    const db = getFirestore();
    const studentRef = doc(db, "classroom", cid, "students", editStudent.key);

    let imageUrl = editStudent.image;
    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        return alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      }
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return;
    }

    await updateDoc(studentRef, { 
      stdid: editStudent.stdid,
      name: editStudent.name,
      status: editStudent.status,
      image: imageUrl || "",
    })
      .then(() => {
        alert("แก้ไขข้อมูลนักศึกษาเรียบร้อย");
        setEditStudent(null);
        setImageFile(null);
        setIsPopupOpen(false);
      })
      .catch((error) => alert("เกิดข้อผิดพลาด: " + error.message));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "70px", fontFamily: "Arial, sans-serif", backgroundColor: "#f9f5ff", minHeight: "100vh" }}>
      <h2 style={{ color: "black", marginBottom: "20px" }}>รายชื่อนักศึกษา</h2>

      {/* ปุ่มเพิ่มนักศึกษา */}
      <button
        onClick={() => {
          setNewStudent({ id: "", name: "", image: "", status: "" });
          setEditStudent(null);
          setIsPopupOpen(true);
        }}
        style={{
          backgroundColor: "#6a5acd",
          color: "white",
          padding: "12px 25px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          marginBottom: "20px"
        }}
      >
        เพิ่มนักศึกษา
      </button>

      <table style={{ width: "80%", margin: "20px auto", borderCollapse: "collapse", backgroundColor: "white", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", borderRadius: "10px", textAlign: "center" }}>
        <thead>
          <tr style={{ backgroundColor: "#6a5acd", color: "white" }}>
            <th style={{ padding: "12px" }}>ลำดับ</th>
            <th style={{ padding: "12px" }}>รหัส</th>
            <th style={{ padding: "12px" }}>ชื่อ</th>
            <th style={{ padding: "12px" }}>รูปภาพ</th>
            <th style={{ padding: "12px" }}>สถานะ</th>
            <th style={{ padding: "12px" }}>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.key} style={{ borderBottom: "1px solid #ddd", backgroundColor: index % 2 === 0 ? "#f3e5ff" : "white" }}>
              <td style={{ padding: "12px" }}>{index + 1}</td>
              <td style={{ padding: "12px" }}>{student.stdid || "-"}</td>
              <td style={{ padding: "12px" }}>{student.name || "-"}</td>
              <td style={{ padding: "12px" }}>
                {student.image ? (
                  <img 
                    src={student.image} 
                    alt="รูป" 
                    style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} 
                  />
                ) : (
                  "ไม่มีรูป"
                )}
              </td>
              <td style={{ padding: "12px" }}>{student.status || "-"}</td>
              <td style={{ padding: "12px" }}>
                <button 
                  onClick={() => handleStartEdit(student)} 
                  style={{ backgroundColor: "#4caf50", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px", marginRight: "10px" }}
                >
                  แก้ไข
                </button>
                <button 
                  onClick={() => handleDeleteStudent(student.key)} 
                  style={{ backgroundColor: "#f44336", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}
                >
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pop-up เพิ่มหรือแก้ไขนักศึกษา */}
      {isPopupOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "15px", width: "450px", textAlign: "center", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)" }}>
            <h2 style={{ marginBottom: "20px", color: "black" }}>{editStudent ? "แก้ไขนักศึกษา" : "เพิ่มนักศึกษา"}</h2>
            <input 
              type="text" 
              placeholder="รหัส" 
              value={editStudent ? editStudent.stdid : newStudent.id} 
              onChange={(e) => editStudent ? setEditStudent({ ...editStudent, stdid: e.target.value }) : setNewStudent({ ...newStudent, id: e.target.value })} 
              style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd" }} 
            />
            <input 
              type="text" 
              placeholder="ชื่อ" 
              value={editStudent ? editStudent.name : newStudent.name} 
              onChange={(e) => editStudent ? setEditStudent({ ...editStudent, name: e.target.value }) : setNewStudent({ ...newStudent, name: e.target.value })} 
              style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd" }} 
            />
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files[0])} 
              style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd" }} 
            />
            <input 
              type="text" 
              placeholder="สถานะ" 
              value={editStudent ? editStudent.status : newStudent.status} 
              onChange={(e) => editStudent ? setEditStudent({ ...editStudent, status: e.target.value }) : setNewStudent({ ...newStudent, status: e.target.value })} 
              style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ddd" }} 
            />
            <button 
              onClick={editStudent ? handleEditStudent : handleAddStudent} 
              style={{ marginRight: "15px", backgroundColor: "#6a5acd", color: "white", padding: "12px 25px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}
            >
              {editStudent ? "บันทึกการแก้ไข" : "เพิ่ม"}
            </button>
            <button 
              onClick={() => { setIsPopupOpen(false); setEditStudent(null); setImageFile(null); }} 
              style={{ backgroundColor: "#f44336", color: "white", padding: "12px 25px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;