import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCourseById, updateCourseById } from "../firebase/courseService";
import { TextField, Button, Box, Typography, Card, CardContent } from "@mui/material";

const EditCoursePage = () => {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState({
    courseName: "",
    roomName: "",
    imageURL: "",
  });
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    const loadCourse = async () => {
      const data = await fetchCourseById(cid);
      if (data) {
        setCourseData(data);
      }
    };
    loadCourse();
  }, [cid]);

  const handleChange = (e) => {
    setCourseData({ ...courseData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    await updateCourseById(cid, courseData, newImage);
    alert("Course updated successfully!");
    navigate(`/manage-class/${cid}`);
  };

  return (
    <Box display="flex" justifyContent="center"  sx={{ paddingTop:15 }} >
      <Card sx={{ p: 3, borderRadius: 3, maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" color="black" fontWeight="bold">
            Edit Course
          </Typography>

          <TextField
            fullWidth
            label="Course Name"
            name="courseName"
            value={courseData.courseName}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            label="Room Name"
            name="roomName"
            value={courseData.roomName}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />

          <Box display="flex" justifyContent="center" mt={2}>
            <img
              src={newImage ? URL.createObjectURL(newImage) : courseData.imageURL}
              alt="Course"
              style={{ width: "100%", borderRadius: "10px" }}
            />
          </Box>

          <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginTop: "10px" }} />

          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            sx={{ mt: 3, bgcolor: "#5E35B1", color: "white" }}
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EditCoursePage;
