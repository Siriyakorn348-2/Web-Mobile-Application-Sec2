import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCourseById } from '../firebase/courseService'; 
import '../css/classroom.css';

const ClassroomPage = () => {
  const { cid } = useParams();  
  const [course, setCourse] = useState(null);
  const [qrGenerated, setQrGenerated] = useState(false); 

  useEffect(() => {
    const getCourseData = async () => {
      if (cid) {
        const data = await fetchCourseById(cid);
        setCourse(data);
      }
    };
    getCourseData();

  
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
     
      document.body.removeChild(script);
    };
  }, [cid]);

  const handleGenerateQRCode = () => {
    if (qrGenerated) return; 

    const qrcodeContainer = document.getElementById("qrcode");
    new window.QRCode(qrcodeContainer, {
      text: `https://your-app-url.com/course/${cid}`, 
      width: 128,
      height: 128,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H
    });

    setQrGenerated(true); 
  };

  

  return (
    <div className="container">
      {course ? (
        <div>
          <h2 className="heading">{course.courseName}</h2>
          <img src={course.imageURL || 'default-image.jpg'} alt={course.courseName} className="image" />
          <p className="text"><strong>Room:</strong> {course.roomName}</p>
          
          {/* ปุ่มสำหรับแสดง QRCode */}
          <button onClick={handleGenerateQRCode} className="qr-btn">
            Show QRCode
          </button>

          {/* แสดง QRCode */}
          <div id="qrcode" style={{ marginTop: '20px' }}></div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ClassroomPage;
