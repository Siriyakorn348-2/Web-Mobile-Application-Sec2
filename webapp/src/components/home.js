import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { Button, Avatar, Typography, IconButton } from '@mui/material';
import { Edit, AddCircle, ExitToApp, Menu } from '@mui/icons-material';
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import '../css/style.css';

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
    const confirmLogout = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?");
    if (confirmLogout) {
      signOut(auth)
        .then(() => navigate('/'))
        .catch((error) => console.error('Logout Error:', error.message));
    }
  };
  

  const handleAddCourse = () => navigate('/add-course');
  const handleEditProfile = () => navigate('/edit-profile');
  const handleManageClass = (courseId) => navigate(`/manage-class/${courseId}`);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    const homePage = document.querySelector('.home-page');
    if (!isSidebarOpen) {
      homePage.classList.add('active'); 
    } else {
      homePage.classList.remove('active'); 
    }
  };
  


  return (
    <>
    
      <header className="header">
        <section className="flex">
          <div className="icons">
          <IconButton id="menu-btn" onClick={toggleSidebar}>
              <Menu />  
            </IconButton>
          </div>
        </section>
      </header>

      <div className="home-page">
        {/* side-bar */}
        <div className={`side-bar ${isSidebarOpen ? 'active' : ''}`}>
          <div id="close-btn" onClick={toggleSidebar}>
            <i className="fas fa-times"></i>
          </div>

          <div className="profile">
            {user?.photoURL ? (
              <Avatar className="image" src={user?.photoURL} alt={user?.displayName} />
            ) : (
              <Avatar className="image">{user?.displayName?.charAt(0)}</Avatar>
            )}
            <h3 className="name">{user?.displayName}</h3>
            <p className="email">{user?.email}</p>

            <a onClick={handleEditProfile} className="btn">Edit Profile</a>
          </div>

          <nav className="navbar">
            <a onClick={handleAddCourse}>
              <i className="addcourse"></i><span>Add Course</span>
            </a>
            <a onClick={handleLogout}>
              <i className="logout"></i><span>Logout</span>
            </a>
          </nav>
        </div>

        <section className="courses">
          <h1 className="heading">My courses</h1>
          <div className="box-container">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div className="box" key={course.courseID}>
                  <div className="tutor">
                    <div className="info">
                      <h3 className="title">{course.courseName}</h3>
                    </div>
                  </div>
                  <div className="thumb">
                    <img src={course.imageURL || 'default-image.jpg'} alt={course.courseName} />
                  </div>
                  <h3>Room: {course.roomName}</h3>
                  <a onClick={() => handleManageClass(course.courseID)} className="inline-btn">Manage Classroom</a>
                </div>
              ))
            ) : (
              <p>You haven't added any courses yet.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;