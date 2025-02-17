import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCourseById } from '../firebase/courseService'; 
import '../css/classroom.css';

const ClassroomPage = () => {
  const { cid } = useParams();  
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const getCourseData = async () => {
      if (cid) {
        const data = await fetchCourseById(cid);
        setCourse(data);
      }
    };
    getCourseData();
  }, [cid]);

  return (
    <div className="container">
      {course ? (
        <div>
          <h2 className="heading">{course.courseName}</h2>
          <img src={course.imageURL || 'default-image.jpg'} alt={course.courseName} className="image" />
          <p className="text"><strong>Room:</strong> {course.roomName}</p>
          <p className="text"><strong>Owner:</strong> {course.owner}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ClassroomPage;