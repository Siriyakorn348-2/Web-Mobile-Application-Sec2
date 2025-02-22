import React, { useState, useEffect } from 'react'; 
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import '../css/login.css';

const LoginPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      navigate('/home');
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="login-page">
      <img src="/02.png" className="center-image" alt="Your description" />
      <h1 className="app-title">Web Application สำหรับอาจารย์</h1> 
      <div className="login-container">
        {user ? (
          <div className="welcome-message">
            <h2>Welcome, {user.displayName}</h2>
            <img src={user.photoURL} alt={user.displayName} />
            <Button variant="contained" onClick={() => navigate('/home')} style={{ width: '100%' }}>
              ไปที่หน้าหลัก
            </Button>
          </div>
        ) : (
          <div className="login-form">
            <h2>Login</h2>
            <Button
              variant="contained"
              onClick={loginWithGoogle}
              startIcon={<GoogleIcon />}
              style={{ width: '100%' }}
            >
              Login with Google
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
