import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { auth } from './firebase/firebase';
import HomePage from './components/home';
import LoginPage from './components/login';
import EditProfile from './components/editProfile';
import AddCourse from './components/addCourse';
import ClassroomPage from './components/classroomPage';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      navigate('/'); 
    } catch (error) {
      console.error("Logout Error: ", error.message);
    }
  };

  return (
    <Routes>
      <Route path="/home" element={<HomePage user={user} logout={logout} />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/" element={<LoginPage setUser={setUser} />} />
      <Route path="/add-course" element={<AddCourse />} />
      <Route path="/manage-class/:cid" element={<ClassroomPage />} />
      </Routes>
  );
}

export default App;
