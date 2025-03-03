import React, { useState, useRef } from 'react';
import jsQR from 'jsQR'; // npm install jsqr

const QRCodeScanner = () => {
  const [result, setResult] = useState(''); // เก็บผลลัพธ์จากการสแกน
  const [error, setError] = useState('');   // เก็บข้อผิดพลาดถ้ามี
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // เริ่มการสแกนเมื่อกดปุ่ม
  const startScanning = async () => {
    try {
      // ขอสิทธิ์การเข้าถึงกล้อง
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // ใช้กล้องหลัง
      });
      
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      // เริ่มสแกนแบบเรียลไทม์
      requestAnimationFrame(scanQRCode);
    } catch (err) {
      setError('ไม่สามารถเข้าถึงกล้องได้: ' + err.message);
    }
  };

  // ฟังก์ชันสแกน QR Code
  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // ตั้งค่าขนาด canvas เท่ากับวิดีโอ
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      
      // วาดภาพจากวิดีโอลงใน canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // ดึงข้อมูลภาพ
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      // ถอดรหัส QR Code
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setResult(code.data);
        // หยุด stream เมื่อสแกนสำเร็จ
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      } else {
        // สแกนต่อไปถ้ายังไม่เจอ
        requestAnimationFrame(scanQRCode);
      }
    } else {
      requestAnimationFrame(scanQRCode);
    }
  };

  // หยุดการสแกน
  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setResult('');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>QR Code Scanner</h2>
      
      <video
        ref={videoRef}
        style={{ width: '100%', maxWidth: '400px', display: result ? 'none' : 'block' }}
      />
      
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={startScanning}
          disabled={videoRef.current?.srcObject}
          style={{ marginRight: '10px' }}
        >
          เริ่มสแกน
        </button>
        <button 
          onClick={stopScanning}
          disabled={!videoRef.current?.srcObject}
        >
          หยุดสแกน
        </button>
      </div>

      {result && (
        <div>
          <h3>ผลลัพธ์:</h3>
          <p>{result}</p>
        </div>
      )}

      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}
    </div>
  );
};

export default QRCodeScanner;