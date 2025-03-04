import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Avatar, Card, CardContent, Grid, Box } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { auth } from '../firebase/firebase';
import img from '../assets/login.png';

const LoginPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ maxWidth: 900, borderRadius: 4, overflow: "hidden", boxShadow: 6 }}>
        <Grid container>
          
          {/* Section for Image */}
          <Grid item xs={6} sx={{ background: "#EDE7F6", display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
            <img src={img} alt="login" style={{ width: "100%", maxHeight: 500, objectFit: "contain" }} />
          </Grid>

          {/* Section for Login */}
          <Grid 
            item xs={6} 
            sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 4 }}
          >
            <CardContent sx={{ width: "100%", maxWidth: 350, textAlign: "center" }}>
              {user ? (
                <>
                  <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 100, height: 100, mb: 2 }} />
                  <Typography variant="h6" color="primary">Welcome, {user.displayName}</Typography>
                  <Button variant="contained" color="secondary" fullWidth onClick={() => navigate('/home')}>
                    ไปที่หน้าหลัก
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="h4" fontWeight="bold" color="black" sx={{ mb: 3 }}>
                    Welcome to Website!
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<GoogleIcon />}
                    fullWidth
                    onClick={loginWithGoogle}
                    sx={{ bgcolor: "#5E35B1", color: "white", "&:hover": { bgcolor: "#4527A0" } }}
                  >
                    Login with Google
                  </Button>
                </>
              )}
            </CardContent>
          </Grid>
          
        </Grid>
      </Card>
    </Box>
  );
};

export default LoginPage;