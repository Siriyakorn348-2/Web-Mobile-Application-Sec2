import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  TextField, Button, Container, Typography, Card, CardContent, CardActions, LinearProgress, Box 
} from '@mui/material';

const AddCourse = () => {
  const [courseID, setCourseID] = useState('');
  const [courseName, setCourseName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 📤 ฟังก์ชันอัปโหลดภาพไปยัง Firebase Storage
  const uploadImageToStorage = async (file) => {
    if (!file) return null;

    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `classroom_images/${uniqueFileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress); // อัปเดตค่าความคืบหน้า
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref); // ได้ URL ของภาพที่อัปโหลด
          resolve(downloadURL); // ส่งคืน URL
        }
      );
    });
  };

  const handleSaveCourse = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("กรุณาเข้าสู่ระบบ");
      return;
    }

    if (!courseID || !courseName || !roomName || !imageFile) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนและเลือกรูปภาพ");
      return;
    }

    try {
      setUploading(true);

      // อัปโหลดภาพไปยัง Firebase Storage และรับ URL ของภาพ
      const imageUrl = await uploadImageToStorage(imageFile);

      // สร้าง document ใหม่ใน Firestore
      const courseRef = doc(collection(db, "classroom"));
      const cid = courseRef.id;

      const courseData = {
        courseID,
        courseName,
        roomName,
        imageURL: imageUrl,
        owner: user.uid,
        id: cid,
      };

      // บันทึกข้อมูลคอร์สไปยัง Firestore
      await setDoc(courseRef, courseData);

      alert("บันทึกคอร์สสำเร็จ!");
      navigate("/home"); // นำทางกลับไปหน้าหลัก
    } catch (error) {
      console.error("Error saving course:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } finally {
      setUploading(false);
      setProgress(0); // รีเซ็ต progress หลังจากอัปโหลดเสร็จ
    }
  };

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        minHeight: "100vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        bgcolor: "#F4F4F9" 
      }}
    >
      <Card sx={{ width: "100%", padding: 2, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h4" align="center" color="black" fontWeight="bold" gutterBottom>
            เพิ่มห้องเรียน
          </Typography>

          <TextField
            label="รหัสวิชา"
            variant="outlined"
            fullWidth
            margin="normal"
            value={courseID}
            onChange={(e) => setCourseID(e.target.value)}
            sx={{ bgcolor: "#F5F5F5", borderRadius: 2 }}
          />
          <TextField
            label="ชื่อวิชา"
            variant="outlined"
            fullWidth
            margin="normal"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            sx={{ bgcolor: "#F5F5F5", borderRadius: 2 }}
          />
          <TextField
            label="รหัสห้องเรียน"
            variant="outlined"
            fullWidth
            margin="normal"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            sx={{ bgcolor: "#F5F5F5", borderRadius: 2 }}
          />

          <input
            type="file"
            accept="image/*"
            id="file-upload"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <label htmlFor="file-upload">
            <Button 
              variant="contained" 
              component="span" 
              fullWidth 
              sx={{
                bgcolor: "#AB47BC", 
                "&:hover": { bgcolor: "#8E24AA" }, 
                mt: 2, 
                borderRadius: 2,
                py: 1.5,
              }}
            >
              เลือกรูปภาพ
            </Button>
          </label>

          {imagePreview && (
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  maxWidth: "100%", 
                  borderRadius: 8, 
                  boxShadow: "0 3px 6px rgba(0,0,0,0.2)" 
                }} 
              />
            </Box>
          )}

          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                อัปโหลด: {Math.round(progress)}%
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSaveCourse}
            disabled={uploading || !imageFile || !courseID || !courseName || !roomName}
            sx={{ 
              bgcolor: "#6A1B9A", 
              "&:hover": { bgcolor: "#AB47BC" },
              borderRadius: 2,
              py: 1.5,
              fontSize: "1.1rem",
            }}
          >
            {uploading ? 'กำลังอัปโหลด...' : 'บันทึกข้อมูล'}
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default AddCourse;
