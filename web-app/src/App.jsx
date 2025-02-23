import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import { AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText } from "@mui/material";
import { Menu } from "@mui/icons-material";
import LoginPage from "./components/login";
import HomePage from "./components/Home";
import AddCourse from "./components/addCourse";
import EditProfile from "./components/editProfile";
import ClassroomPage from "./components/ClassroomPage";
import EditCoursePage from "./components/editCourse";

const Sidebar = ({ open, onClose }) => {
  const handleLogout = () => {
    localStorage.removeItem("userToken"); // เคลียร์ Token หรือข้อมูลที่ใช้ล็อกอิน
    window.location.href = "/"; // Redirect ไปหน้า Login
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <List sx={{ width: 250 }}>
        <ListItem button component="a" href="/home">
          <ListItemText primary="🏠 Home" />
        </ListItem>
       
        <ListItem button onClick={handleLogout} sx={{ color: "red" }}>
          <ListItemText primary="🚪 Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
};


const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (location.pathname === "/") return null; // ซ่อน Navbar ถ้าอยู่หน้า Login

  return (
    <>
      <AppBar position="fixed" sx={{ bgcolor: "#9575CD", px: 2 }}>
        <Toolbar>
          <IconButton  edge="start" color="inherit" onClick={() => setOpen(true)}
           sx={{ marginLeft: "auto","&:hover": { bgcolor: "#5E35B1" } }}>
            <Menu />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Sidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/add-course" element={<AddCourse />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/manage-class/:cid" element={<ClassroomPage />} />
        <Route path="/edit-course/:cid" element={<EditCoursePage />} />
      </Routes>
    </Router>
  );
}

export default App;
