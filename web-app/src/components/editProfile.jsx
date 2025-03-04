import React, { useState, useEffect } from 'react';
import { TextField, Button, Avatar, Typography, Card, CardContent, CardActions, Container, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getAuth, updateProfile } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const EditProfile = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const storage = getStorage();
  const { cid } = useParams(); 

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
    setPhotoURL(user?.photoURL || '');
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    const storageRef = ref(storage, `profile_images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSave = async () => {
    if (!user) {
      alert('เกิดข้อผิดพลาด: ไม่พบข้อมูลผู้ใช้');
      return;
    }
  
    try {
      setUploading(true);
      let updatedPhotoURL = user?.photoURL || '';
      let updatedDisplayName = user?.displayName || '';
  
      if (imageFile) {
        updatedPhotoURL = await uploadImage(imageFile);
      }
      if (displayName.trim() !== '') {
        updatedDisplayName = displayName;
      }
  
      await updateProfile(user, {
        displayName: updatedDisplayName,
        photoURL: updatedPhotoURL
      });
  
      alert('อัปเดตโปรไฟล์สำเร็จ!');
  
      navigate("/home"); 
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container  maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", paddingTop: 0 }}>
      <Card sx={{ 
        bgcolor: "#F3E5F5", 
        borderRadius: 4, 
        boxShadow: 4,
        padding: 3,
        maxWidth: "100%",
        mt: 5,
      }}>
        <CardContent sx={{ textAlign: "center", position: "relative" , marginTop:20 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Avatar 
              src={imagePreview || photoURL} 
              alt={displayName} 
              sx={{ width: 100, height: 100, boxShadow: "0 3px 6px rgba(0,0,0,0.2)" }} 
            />
            <input
              type="file"
              accept="image/*"
              id="file-upload"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <label htmlFor="file-upload">
              <IconButton 
                component="span" 
                sx={{
                    position: "absolute",
                    bottom: -10, 
                    right: -10,  
                    bgcolor: "white",
                    boxShadow: 2,
                    border: "2px solid #6A1B9A",
                    "&:hover": { bgcolor: "#F3E5F5" }
                }}
              >
                <EditIcon sx={{ color: "#6A1B9A" }} />
              </IconButton>
            </label>
          </div>

          <Typography variant="h5" color="#6A1B9A" fontWeight="bold" mt={2}>
            {displayName}
          </Typography>

          <TextField
            label="Display Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            sx={{ bgcolor: "white", borderRadius: 2 }}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            fullWidth
            margin="normal"
            variant="outlined"
            disabled
            sx={{ bgcolor: "white", borderRadius: 2 }}
          />
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={uploading}
            sx={{ 
              bgcolor: "#7B1FA2", 
              "&:hover": { bgcolor: "#6A1B9A" },
              borderRadius: 2
            }}
          >
            {uploading ? 'กำลังอัปโหลด...' : 'บันทึกข้อมูล'}
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default EditProfile;