import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCourseById, deleteCourseById, fetchStudents, createCheckin, fetchCheckinHistory } from "../firebase/courseService";
import { Card, CardContent, Typography, Button, Box, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Link } from "react-router-dom";


import QRCode from "react-qr-code";

const ClassroomPage = () => {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [qrGenerated, setQrGenerated] = useState(false); 
  const [showQR, setShowQR] = useState(false); 

  useEffect(() => {
    const getCourseData = async () => {
      if (cid) {
        const data = await fetchCourseById(cid);
        setCourse(data);
      }
    };
    getCourseData();
  }, [cid]);

  // Fetch students for the course
  useEffect(() => {
    const getStudentsData = async () => {
      if (cid) {
        const data = await fetchStudents(cid);
        setStudents(data);
      }
    };
    getStudentsData();
  }, [cid]);

  // Fetch check-in history
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
    const checkinNo = new Date().getTime(); // Example check-in number
    await createCheckin(cid, checkinNo);
    // Copy student data to check-in scores with status = 0
    await copyStudentsToCheckin(cid, checkinNo);
    alert("Check-in created successfully!");
  };

  const copyStudentsToCheckin = async (cid, checkinNo) => {
    // Copy student data to check-in scores with status = 0
    const studentData = students.map(student => ({
      studentID: student.studentID,
      status: 0,
    }));
    await createCheckinScores(cid, checkinNo, studentData);
  };

  const createCheckinScores = async (cid, checkinNo, studentData) => {
    // This should interact with your backend to store the check-in scores
    console.log(`Creating check-in scores for ${cid} with check-in ${checkinNo}`, studentData);
  };

  return (
    <Box display="flex" justifyContent="center" mt={15}>
      {course ? (
        <Card sx={{ bgcolor: "#fff", p: 3, borderRadius: 3, maxWidth: 400, position: "relative" }}>
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

            {/* QR Code Section */}
            <Box display="flex" justifyContent="center" mt={4}>
              <QRCode value={`https://yourapp.com/classroom/${cid}`} />
            </Box>
            <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={() => window.open(`https://yourapp.com/classroom/${cid}`, "_blank")}>
              Scan QR Code to Register
            </Button>

            {/* Students List */}
            <Box mt={3}>
              <Typography variant="h6" align="center" mb={2}>
                Registered Students
              </Typography>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Image</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
  {students && Array.isArray(students) ? (
    students.map((student, index) => (
      <tr key={student.studentID}>
        <td>{index + 1}</td>
        <td>{student.studentID}</td>
        <td>{student.name}</td>
        <td><img src={student.imageURL || "default-avatar.jpg"} alt={student.name} width={50} /></td>
        <td>{student.status === 0 ? "Not Checked In" : "Checked In"}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="5">No students found</td>
    </tr>
  )}
</tbody>

              </table>
            </Box>

            <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleCreateCheckin}>
              Create Check-in
            </Button>

            {/* Check-in History */}
            <Box mt={3}>
              <Typography variant="h6" align="center" mb={2}>
                Check-in History
              </Typography>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Attendees</th>
                    <th>Status</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {checkinHistory.map((checkin, index) => (
                    <tr key={checkin.checkinNo}>
                      <td>{index + 1}</td>
                      <td>{new Date(checkin.timestamp).toLocaleString()}</td>
                      <td>{checkin.attendeesCount}</td>
                      <td>{checkin.status}</td>
                      <td><Button variant="outlined" onClick={() => alert(`Manage check-in ${checkin.checkinNo}`)}>Manage</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

             {/* Quiz Button */}
             <Box mt={2} display="flex" justifyContent="center">
                <Link to={`/quiz/${cid}`}>
                  <Button variant="contained" color="success">
                    Quiz
                  </Button>
                </Link>
              </Box>
  
          </CardContent>
        </Card>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </Box>
    
  );
};

export default ClassroomPage;