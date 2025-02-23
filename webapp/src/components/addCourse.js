import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { TextField, Button, Container, Typography } from '@mui/material';
import '../css/addCourse.css';

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

  const uploadImageToStorage = async (file) => {
    if (!file) return null;

    const storageRef = ref(storage, `classroom_images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
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

    try {
      setUploading(true);
      const imageUrl = await uploadImageToStorage(imageFile);

      const courseRef = doc(collection(db, "classroom"));
      const courseData = {
        courseID,
        courseName,
        roomName,
        imageURL: imageUrl,
        owner: user.uid,
      };

      await setDoc(courseRef, courseData);
      await setDoc(doc(db, `users/${user.uid}/classroom/${courseRef.id}`), { status: 1 });

      alert("บันทึกคอร์สสำเร็จ!");
      navigate("/home");
    } catch (error) {
      console.error("Error saving course:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4">เพิ่มห้องเรียน</Typography>

      <TextField
        label="รหัสวิชา"
        variant="outlined"
        fullWidth
        margin="normal"
        value={courseID}
        onChange={(e) => setCourseID(e.target.value)}
      />
      <TextField
        label="ชื่อวิชา"
        variant="outlined"
        fullWidth
        margin="normal"
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
      />
      <TextField
        label="รหัสห้องเรียน"
        variant="outlined"
        fullWidth
        margin="normal"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />

      <div className="upload-container">
        <input
          type="file"
          accept="image/*"
          id="file-upload"
          className="custom-file-input"
          onChange={handleImageChange}
        />
        <label htmlFor="file-upload" className="custom-file-label">
          เลือกรูปภาพ
        </label>
      </div>

      {imagePreview && (
        <div className="image-preview-container">
          <img src={imagePreview} alt="Preview" className="image-preview" />
        </div>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveCourse}
        disabled={uploading || !imageFile}
        style={{ marginTop: '20px' }}
      >
        {uploading ? 'Uploading...' : 'บันทึกข้อมูล'}
      </Button>
    </Container>
  );
};

export default AddCourse;
