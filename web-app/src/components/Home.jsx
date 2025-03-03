import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { Avatar, Button, IconButton, Typography, Drawer, List, ListItem, ListItemText, ListItemIcon, AppBar, Toolbar, Container, Grid, Card, CardContent, CardMedia, Box } from '@mui/material';
import { Edit, AddCircle, ExitToApp, Menu } from '@mui/icons-material';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { ListItemButton } from '@mui/material'; 


const HomePage = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/');
      }
    });
  
    return () => unsubscribe();
  }, [auth, navigate]);
  
  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);
  

  const fetchCourses = async () => {
    if (!user) return;
  
    try {
      console.log("Fetching courses for user:", user.uid);
  
      const querySnapshot = await getDocs(collection(db, 'classroom'));
      console.log("Total courses found:", querySnapshot.docs.length);
  
      const coursesData = querySnapshot.docs
        .map(doc => ({ ...doc.data(), courseID: doc.id }))
        .filter(course => course.owner === user.uid); 
  
      console.log("Courses after filtering:", coursesData);
  
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  
  

  const handleLogout = () => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?")) {
      signOut(auth).then(() => navigate('/'));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column',minHeight:'100vh' }}>
    {/* Navbar */}
    <AppBar position="fixed" sx={{ bgcolor: "#9575CD", px: 2 }}>
  <Toolbar>
    <IconButton
      edge="end"
      color="inherit"
      onClick={() => setIsSidebarOpen(true)}
      sx={{
        marginLeft: "auto",
        mr: 1, 
        "&:hover": {
          bgcolor: "#5E35B1", 
        },
        "&:active": {
          bgcolor: "rgba(151, 49, 198, 0.5)", 
        },
      }}
    >
      <Menu />
    </IconButton>
  </Toolbar>
</AppBar>

  
    {/* Sidebar */}
    <Drawer 
      anchor="left" 
      open={isSidebarOpen} 
      onClose={() => setIsSidebarOpen(false)}
      PaperProps={{
        sx: { 
          background: " #EDE7F6", 
          color: "white",
          width: 280
        }
      }}
    >
      <Box sx={{ padding: 3, textAlign: "center", bgcolor: "#EDE7F6" }}>
        <Avatar 
          src={user?.photoURL} 
          sx={{ 
            width: 80, 
            height: 80, 
            mb: 2, 
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            mx: "auto", 
            bgcolor: "#B39DDB" 
          }}
        >
          {user?.displayName?.charAt(0)}
        </Avatar>
        
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#5E35B1" }}>
          {user?.displayName}
        </Typography>
        
        <Typography variant="body2" sx={{ opacity: 0.8, color: "#7E57C2" }}>
          {user?.email}
        </Typography>
  
        <Button
          startIcon={<Edit />}
          fullWidth
          variant="contained"
          sx={{ 
            mt: 3, 
            bgcolor: "#9575CD", 
            color: "white", 
            "&:hover": { bgcolor: "#7E57C2" } 
          }}
          onClick={() => navigate('/edit-profile')}
        >
          Edit Profile
        </Button>
  
        <List sx={{ mt: 2 }}>
        <ListItemButton onClick={() => navigate('/add-course')}>
        <ListItemIcon sx={{ color: "#5E35B1" }}><AddCircle /></ListItemIcon>
        <ListItemText primary="Add Course" sx={{ color: "#5E35B1" }} />
      </ListItemButton>

      <ListItemButton onClick={handleLogout}>
        <ListItemIcon sx={{ color: "#5E35B1" }}><ExitToApp /></ListItemIcon>
        <ListItemText primary="Logout" sx={{ color: "#5E35B1" }} />
      </ListItemButton>
        </List>
      </Box>
    </Drawer>
  
    <Toolbar />
  
    {/* Content */}
    <Container sx={{ mt: 3, flexGrow: 1, marginTop: 5 }}>
      <Typography variant="h4" sx={{ textAlign: 'center', my: 3, marginTop: 2, color: "#5E35B1" }}>
        My Courses
      </Typography>
      <Grid container spacing={3}>
        {courses.length > 0 ? (
          courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.courseID}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, bgcolor: "#EDE7F6" }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={course.imageURL || 'default-image.jpg'}
                  alt={course.courseName}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: "#512DA8" }}>
                    {course.courseName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Room: {course.roomName}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, bgcolor: "#9575CD", color: "white", "&:hover": { bgcolor: "#7E57C2" } }}
                    onClick={() => navigate(`/manage-class/${course.courseID}`)}
                  >
                    Manage Classroom
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography sx={{ textAlign: "center", color: "#7E57C2" }}>
            No courses added yet.
          </Typography>
        )}
      </Grid>
    </Container>
  </Box>
  
  );
};

export default HomePage;
