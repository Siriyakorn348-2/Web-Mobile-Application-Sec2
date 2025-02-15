import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'; 
import { TextField, Button, Container, Typography } from '@mui/material';

const AddCourse = () => {
  const [courseID, setCourseID] = useState('');
  const [courseName, setCourseName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [imageURL, setImageURL] = useState('');

  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();  

  const handleSaveCourse = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('กรุณาเข้าสู่ระบบ');
      return;
    }

    const courseRef = doc(collection(db, 'classroom'));  
    const courseData = {
      courseID,
      courseName,
      roomName,
      imageURL,
      owner: user.uid,
    };

    try {
      await setDoc(courseRef, courseData);

      await setDoc(doc(db, `users/${user.uid}/classroom/${courseRef.id}`), { status: 1 });

      alert('บันทึกคอร์สสำเร็จ!');
      navigate('/home');
    } catch (error) {
      console.error('Error saving course:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Add New Course
      </Typography>
      <TextField
        label="Course ID"
        fullWidth
        margin="normal"
        value={courseID}
        onChange={(e) => setCourseID(e.target.value)}
      />
      <TextField
        label="Course Name"
        fullWidth
        margin="normal"
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
      />
      <TextField
        label="Room Name"
        fullWidth
        margin="normal"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />
      <TextField
        label="Image URL"
        fullWidth
        margin="normal"
        value={imageURL}
        onChange={(e) => setImageURL(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleSaveCourse}>
        Save Course
      </Button>
    </Container>
  );
};

export default AddCourse;
