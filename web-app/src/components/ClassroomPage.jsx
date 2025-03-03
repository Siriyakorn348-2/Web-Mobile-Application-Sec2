import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCourseById, deleteCourseById, fetchStudents, createCheckin, fetchCheckinHistory } from "../firebase/courseService";
import { Box, Card, CardContent, IconButton, Menu, MenuItem, Typography, Drawer, List, ListItemButton, ListItemText, ListItemIcon } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { QrCode, ListAlt, CheckCircle, QuestionAnswer } from "@mui/icons-material";
import QRCode from "react-qr-code";

const ClassroomPage = () => {
  const { cid, cno } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const getCourseData = async () => {
      if (cid) {
        const data = await fetchCourseById(cid);
        setCourse(data);
      }
    };
    getCourseData();
  }, [cid]);

  useEffect(() => {
    const getStudentsData = async () => {
      if (cid) {
        const data = await fetchStudents(cid);
        setStudents(data);
      }
    };
    getStudentsData();
  }, [cid]);

  useEffect(() => {
    const getCheckinHistory = async () => {
      if (cid) {
        const data = await fetchCheckinHistory(cid);
        setCheckinHistory(data);
      }
    };
    getCheckinHistory();
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

  const handleCreateCheckin = async () => {
    const checkinNo = new Date().getTime();
    await createCheckin(cid, checkinNo);
    await copyStudentsToCheckin(cid, checkinNo);
    alert("Check-in created successfully!");
  };

  const copyStudentsToCheckin = async (cid, checkinNo) => {
    const studentData = students.map(student => ({
      studentID: student.studentID,
      status: 0,
    }));
    await createCheckinScores(cid, checkinNo, studentData);
  };

  const createCheckinScores = async (cid, checkinNo, studentData) => {
    console.log(`Creating check-in scores for ${cid} with check-in ${checkinNo}`, studentData);
  };

  const toggleQR = () => {
    setShowQR(!showQR);
  };

  return (
    <Box display="flex" justifyContent="center" mt={15}>
      <Drawer
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 280,
            mt: 8,
            backgroundColor: "#F3E8FF",
            borderRight: "2px solid #D8BFD8",
            boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <Box sx={{ overflow: "hidden", display: "flex", flexDirection: "column", height: "100vh" }}>
          <List sx={{ flexGrow: 1 }}>
            {[
              { text: "Show QR Code", icon: <QrCode />, action: toggleQR },
              { text: "รายชื่อนักศึกษา", icon: <ListAlt />, action: () => navigate(`/classroom/${cid}/students`) },
              { text: "เพิ่มการเช็คชื่อ", icon: <CheckCircle />, action: () => navigate(`/classroom/${cid}/add-checkin`) },
              { text: "ถามตอบ", icon: <QuestionAnswer />, action: () => navigate(`/classroom/${cid}/qa`) },
            ].map((item, index) => (
              <ListItemButton
                key={index}
                onClick={item.action}
                sx={{
                  color: "#6A0572",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                  padding: "15px 20px",
                  fontSize: "1.1rem",
                  "&:hover": {
                    backgroundColor: "#E6CCFF",
                    transform: "scale(1.02)",
                  },
                  "&:active": {
                    backgroundColor: "#D8BFD8",
                    transform: "scale(0.98)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "#6A0572", minWidth: "40px" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {course ? (
        <Card sx={{ bgcolor: "#fff", p: 3, borderRadius: 3, maxWidth: 2000, position: "relative" }}>
          <CardContent>
            <IconButton onClick={handleOpenMenu} sx={{ position: "absolute", top: 10, right: 10 }}>
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

            {showQR && (
              <Box display="flex" justifyContent="center" mt={3}>
                <QRCode value={`https://yourapp.com/courses/${cid}`} size={256} />
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </Box>
  );
};

export default ClassroomPage;
