import React, { useState, useEffect } from "react";
import { db } from "./firebase";  
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Button, Typography, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from 'qrcode.react';
import '../css/classroom.css';

const ClassroomPage = ({ cid, cno }) => {
  const [course, setCourse] = useState({});
  const [students, setStudents] = useState([]);
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseDocRef = doc(db, "courses", cid); 
        const courseDoc = await getDoc(courseDocRef);
        if (courseDoc.exists()) {
          setCourse(courseDoc.data()); 
        }

        const studentsCollectionRef = collection(db, "courses", cid, "students");
        const studentsSnapshot = await getDocs(studentsCollectionRef);
        setStudents(studentsSnapshot.docs.map(doc => doc.data()));

        const checkinHistoryCollectionRef = collection(db, "courses", cid, "checkin-history");
        const checkinHistorySnapshot = await getDocs(checkinHistoryCollectionRef);
        setCheckinHistory(checkinHistorySnapshot.docs.map(doc => doc.data()));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [cid]);

  const handleAddCheckin = async () => {
    try {
      const response = await fetch(`/classroom/${cid}/checkin/${cno}`, { method: "POST" });
      if (response.ok) {
        const studentsResponse = await fetch(`/classroom/${cid}/students`);
        const studentsData = await studentsResponse.json();
        await fetch(`/classroom/${cid}/checkin/${cno}/scores`, {
          method: "POST",
          body: JSON.stringify(studentsData.map((student) => ({
            studentID: student.studentID,
            status: 0,
          }))),
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      console.error("Error adding check-in:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="classroom-page">
      <div className="course-info">
        <Typography variant="h4">{course.courseName}</Typography>
        <img src={course.backgroundImage} alt={course.courseName} className="course-image" />
        <Typography variant="h6">{course.courseID}</Typography>
        <Typography variant="body1">{course.description}</Typography>

        <div className="qrcode">
          <QRCodeCanvas value={`/classroom/${cid}/add`} />
          <Typography variant="body1">Scan this QR code to add this course</Typography>
        </div>
      </div>

      <div className="student-table">
        <Button variant="contained" onClick={handleAddCheckin}>Add Check-in</Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student, index) => (
              <TableRow key={student.studentID}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{student.studentID}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>
                  <img src={student.imageURL || "default-avatar.png"} alt={student.name} width={50} />
                </TableCell>
                <TableCell>{student.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="checkin-history">
        <Typography variant="h5">Check-in History</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Date-Time</TableCell>
              <TableCell>Number of Students</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {checkinHistory.map((history, index) => (
              <TableRow key={history.checkinID}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{history.timestamp}</TableCell>
                <TableCell>{history.studentCount}</TableCell>
                <TableCell>{history.status}</TableCell>
                <TableCell>
                  <Button variant="contained" onClick={() => {/* Handle manage checkin */}}>
                    Manage Check-in
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClassroomPage;
