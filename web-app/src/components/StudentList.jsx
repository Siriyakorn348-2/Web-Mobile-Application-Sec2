import React, { useState, useEffect } from "react";
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";  // เพิ่มการใช้งาน Firebase Storage
import { useParams } from "react-router-dom";

const StudentList = () => {
  const { cid } = useParams();  // รับค่า cid จาก URL params
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ id: "", name: "", image: "", status: "" });
  const [editStudent, setEditStudent] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // state สำหรับ pop-up
  const [imageFile, setImageFile] = useState(null); // state สำหรับเก็บไฟล์ภาพที่เลือก

  useEffect(() => {
    const db = getFirestore();
    const studentRef = collection(db, "classroom", cid, "students");

    const unsubscribe = onSnapshot(studentRef, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        key: doc.id,
        ...doc.data(),
      }));
      setStudents(studentList);
    });

    return () => unsubscribe();  // หยุดการฟังข้อมูลเมื่อออกจาก component
  }, [cid]);

  // 📌 ฟังก์ชันในการอัปโหลดรูปภาพไปยัง Firebase Storage
  const uploadImage = async (file) => {
    const storage = getStorage();
    const imageRef = ref(storage, `students/${cid}/${file.name}`);
    try {
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;  // คืนค่า URL ของรูปภาพที่อัปโหลด
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดภาพ");
      return null;
    }
  };

  // 📌 ฟังก์ชันเพิ่มนักศึกษา
  const handleAddStudent = async () => {
    if (!cid) return alert("ไม่พบรหัสห้องเรียน");
    if (!newStudent.stdid || !newStudent.name || newStudent.status === "") {
      return alert("กรุณากรอกรหัส, ชื่อ และสถานะนักเรียน");
    }
  
    // 📌 หากมีการเลือกไฟล์ภาพ, อัปโหลดไปยัง Firebase Storage
    let imageUrl = newStudent.image;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return; // ถ้าอัปโหลดไม่สำเร็จ จะไม่ทำการเพิ่มนักศึกษา
    }
  
    const db = getFirestore();
    const studentRef = doc(db, "classroom", cid, "students", newStudent.stdid); // ใช้ stdid เป็น key
  
    await setDoc(studentRef, { 
      stdid: newStudent.stdid,
      name: newStudent.name,
      status: newStudent.status, // ใช้เป็น number
      image: imageUrl || "",
    })
      .then(() => {
        alert("เพิ่มนักศึกษาเรียบร้อย");
        setNewStudent({ stdid: "", name: "", image: "", status: "" }); // รีเซ็ตค่า newStudent หลังการเพิ่ม
        setIsPopupOpen(false);
        setImageFile(null);  // รีเซ็ต state ของไฟล์ภาพ
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

  // 📌 ฟังก์ชันแก้ไขข้อมูลนักศึกษา
  const handleEditStudent = async () => {
    if (!editStudent || !editStudent.key) return;

    const db = getFirestore();
    const studentRef = doc(db, "classroom", cid, "students", editStudent.key);

    // 📌 หากมีการเลือกไฟล์ภาพ, อัปโหลดไปยัง Firebase Storage
    let imageUrl = editStudent.image;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return; // ถ้าอัปโหลดไม่สำเร็จ จะไม่ทำการแก้ไขข้อมูล
    }

    await updateDoc(studentRef, { ...editStudent, image: imageUrl })
      .then(() => {
        alert("แก้ไขข้อมูลนักศึกษาเรียบร้อย");
        setEditStudent(null);
        setImageFile(null);  // รีเซ็ต state ของไฟล์ภาพ
      })
      .catch((error) => alert("เกิดข้อผิดพลาด: " + error.message));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "70px", fontFamily: "Arial, sans-serif", backgroundColor: "#f9f5ff", minHeight: "100vh" }}>
      <h2 style={{ color: "#6a5acd", marginBottom: "20px" }}>รายชื่อนักศึกษา</h2>

      

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
                {student.image ? <img src={student.image} alt="รูป" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} /> : "ไม่มีรูป"}
              </td>
              <td style={{ padding: "12px" }}>{student.status || "-"}</td>
              <td>
                <button onClick={() => handleDeleteStudent(student.key)} style={{ marginBottom: "20px", backgroundColor: "#6a5acd", color: "white", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}>ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pop-up เพิ่มนักศึกษา */}
      {isPopupOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "15px", width: "450px", textAlign: "center", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)" }}>
            <h2 style={{ marginBottom: "20px", color: "#6a5acd" }}>เพิ่มนักศึกษา</h2>
            <input type="text" placeholder="รหัส" value={newStudent.id} onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd" }} />
            <input type="text" placeholder="ชื่อ" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd" }} />
            
            {/* เลือกรูปภาพ */}
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #ddd" }} />

            <input type="text" placeholder="สถานะ" value={newStudent.status} onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })} style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ddd" }} />
            <button onClick={handleAddStudent} style={{ marginRight: "15px", backgroundColor: "#6a5acd", color: "white", padding: "12px 25px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}>เพิ่ม</button>
            <button onClick={() => setIsPopupOpen(false)} style={{ backgroundColor: "#f44336", color: "white", padding: "12px 25px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}>ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
