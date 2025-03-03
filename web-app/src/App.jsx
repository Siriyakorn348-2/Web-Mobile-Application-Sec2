import { Routes, Route, useLocation } from "react-router-dom"; 
import { useState } from "react";
import { AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText } from "@mui/material";
import { Menu } from "@mui/icons-material";
import LoginPage from "./components/login";
import HomePage from "./components/Home";
import AddCourse from "./components/addCourse";
import EditProfile from "./components/editProfile";
import ClassroomPage from "./components/ClassroomPage";
import EditCoursePage from "./components/editCourse";
import CheckinPage from "./components/CheckInPage";
import QAPage from "./components/QAPage";
import StudentList from "./components/StudentList";
import CheckinManagementPage from "./components/CheckinManagementPage";
import ScoresPage from "./components/ScoresPage";



const Sidebar = ({ open, onClose }) => {
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    window.location.href = "/"; 
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <List sx={{ width: 250 }}>
        <ListItem button component="a" href="#/home"> {/* ใช้ #/ สำหรับ HashRouter */}
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

  if (location.pathname === "/") return null;

  return (
    <>
      <AppBar position="fixed" sx={{ bgcolor: "#9575CD", px: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setOpen(true)}
            sx={{ marginLeft: "auto", "&:hover": { bgcolor: "#5E35B1" } }}>
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
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/add-course" element={<AddCourse />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/manage-class/:cid" element={<ClassroomPage />} />
        <Route path="/edit-course/:cid" element={<EditCoursePage />} />
        <Route path="/classroom/:cid/checkin/:cno" element={<CheckinPage />} />
        <Route path="/classroom/:cid/checkin/:cno/qna" element={<QAPage />} />
        <Route path="/classroom/:cid/students" element={<StudentList />} />
        <Route path="/classroom/:cid/add-checkin" element={<CheckinManagementPage />} /> 
        <Route path="/classroom/:cid/checkin/:cno/scores" element={<ScoresPage />} /> 
      </Routes>
    </>
  );
}

export default App;
