import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCourseById, deleteCourseById } from "../firebase/courseService";
import { Card, CardContent, Typography, Button, Box, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const ClassroomPage = () => {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    const getCourseData = async () => {
      if (cid) {
        const data = await fetchCourseById(cid);
        setCourse(data);
      }
    };
    getCourseData();
  }, [cid]);

  const handleOpenMenu = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleEdit = () => {
    handleCloseMenu();
    navigate(`/edit-course/${cid}`);
  };

  const handleDelete = async () => {
    handleCloseMenu();
    if (window.confirm("Are you sure you want to delete this course?")) {
      await deleteCourseById(cid);
      alert("Course deleted successfully!");
      navigate("/home");
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={15} >
      {course ? (
        <Card sx={{ bgcolor: "#fff", p: 3, borderRadius: 3, maxWidth: 400, position: "relative" }}>
          <CardContent>
           
            <IconButton
              onClick={handleOpenMenu}
              sx={{ position: "absolute", top: 10, right: 10 }}
            >
              <MoreVertIcon />
            </IconButton>

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
              <MenuItem onClick={handleEdit}>Edit</MenuItem>
              <MenuItem onClick={handleDelete}>Delete</MenuItem>
            </Menu>

            <Typography variant="h5" color="#5E35B1" textAlign="center">
              {course.courseName}
            </Typography>

            <Box display="flex" justifyContent="center" mt={2}>
              <img
                src={course.imageURL || "default-image.jpg"}
                alt={course.courseName}
                style={{ width: "100%", borderRadius: "10px" }}
              />
            </Box>

            <Typography variant="body1" textAlign="center" mt={2}>
              <strong>Room:</strong> {course.roomName}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </Box>
  );
};

export default ClassroomPage;
