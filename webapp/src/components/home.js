import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { Button, Avatar, Typography, IconButton } from '@mui/material';
import { Edit, AddCircle, ExitToApp, Menu } from '@mui/icons-material';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import '../css/home.css';
import EditProfile from './editProfile';


const HomePage = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();  


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("User is logged in:", currentUser);
        setUser(currentUser);
        fetchCourses();
      } else {
        console.log("User is not logged in");
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);


  const fetchCourses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'classroom'));  
      const coursesData = [];
      querySnapshot.forEach((doc) => {
        coursesData.push({ ...doc.data(), courseID: doc.id });
      });
      setCourses(coursesData);  
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false); 
    }
  };


  const handleLogout = () => {
    signOut(auth)
      .then(() => navigate('/'))
      .catch((error) => console.error('Logout Error:', error.message));
  };


  const handleAddCourse = () => navigate('/add-course');
  const handleEditProfile = () => navigate('/edit-profile');
  const handleManageClass = (courseId) => navigate(`/manage-class/${courseId}`);


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  return (
    

    <div className="home-page">
      <div className="menu-icon">
        <IconButton onClick={toggleSidebar}>
          <Menu />
        </IconButton>
      </div>

      
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="user-info">
          {user?.photoURL ? (
            <Avatar src={user?.photoURL} alt={user?.displayName} />
          ) : (
            <Avatar>{user?.displayName?.charAt(0)}</Avatar>
          )}
          <div className="user-details">
            <Typography variant="h6">{user?.displayName}</Typography>
            <Typography variant="body1">{user?.email}</Typography>
          </div>
        </div>
        <div className="sidebar-actions">
          <Button variant="contained" startIcon={<Edit />} onClick={handleEditProfile}>
            Edit Profile
          </Button>
          <Button variant="contained" startIcon={<AddCircle />} onClick={handleAddCourse}>
            Add Course
          </Button>
          <Button variant="outlined" className="logout-button" startIcon={<ExitToApp />} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
     
   
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
       
        {isLoading ? (
          <p>Loading courses...</p> 
        ) : (
        <div className="course-cards">
        {courses.length > 0 ? (
          courses.map((course) => (
           
           <div key={course.courseID} className="course-card">
              <Typography variant="h6">{course.courseName}</Typography>
              <img src={course.imageURL || 'default-image.jpg'} alt={course.courseName} />
              <Typography variant="body1">Room: {course.roomName}</Typography>
              <Button variant="contained" color="primary" onClick={() => handleManageClass(course.courseID)}>
                Manage Classroom
              </Button>
            </div>
          ))
        ) : (
          <p>You haven't added any courses yet.</p>
        )}
      </div>

        )}
      </div>
    </div>
  );
};


export default HomePage;



